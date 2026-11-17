// ════════════════════════════════════════════════════════════════════
//  MY Service Parking — Fase 2: Automação da Cancela (maquete)
//
//  Hardware:
//    • ESP32 DevKit (30 ou 38 pinos)
//    • 1 micro servo SG90 ............ cancela
//    • 2 sensores ultrassônicos HC-SR04: faixa de ENTRADA e faixa de SAÍDA
//
//  Como funciona:
//    1. Os sensores medem a distância o tempo todo. Objeto a menos de
//       LIMIAR_PRESENCA_CM = carro parado na faixa → evento VEICULO_DETECTADO.
//    2. A cada 500 ms o ESP32 faz POST /dispositivos/<id>/sync no API Gateway:
//       envia o estado (cancela + sensores) e recebe o próximo comando.
//    3. O operador registra a entrada (ou conclui a saída com pagamento) no
//       sistema → o estacionamento-service cria o comando ABRIR → o ESP32
//       recebe no próximo sync e levanta a cancela.
//    4. A cancela fecha sozinha TEMPO_APOS_PASSAGEM_MS depois que o carro sai
//       da frente do sensor (passou), ou após TEMPO_MAX_ABERTA_MS se nenhum
//       carro passar. Ela NUNCA fecha com carro na frente do sensor e reabre
//       se um carro aparecer durante o fechamento.
//
//  Bibliotecas (Arduino IDE → Gerenciar Bibliotecas):
//    • ArduinoJson (Benoit Blanchon) v7.x
//    • ESP32Servo  (Kevin Harrington) v3.x
//  Placa: "ESP32 Dev Module" (pacote esp32 da Espressif, v2.x ou v3.x)
//
//  Ligações: veja iot/README.md (os pinos ECHO precisam de divisor de tensão!).
// ════════════════════════════════════════════════════════════════════

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>
#include "config.h"

#define FIRMWARE_VERSAO "1.0.0"

// ── Pinos ───────────────────────────────────────────────────────────
const int PINO_SERVO        = 13;
const int PINO_TRIG_ENTRADA = 5;
const int PINO_ECHO_ENTRADA = 18;  // via divisor 1 kΩ / 2 kΩ (5 V → 3,3 V)
const int PINO_TRIG_SAIDA   = 19;
const int PINO_ECHO_SAIDA   = 21;  // via divisor 1 kΩ / 2 kΩ
const int PINO_LED          = 2;   // LED azul da placa

// ── Ajustes da maquete ──────────────────────────────────────────────
const float LIMIAR_PRESENCA_CM  = 10.0;  // mais perto que isso = carro na faixa
const float HISTERESE_CM        = 4.0;   // só considera "saiu" acima de LIMIAR + HISTERESE
const int   LEITURAS_PRESENCA   = 3;     // leituras seguidas para confirmar que chegou
const int   LEITURAS_AUSENCIA   = 5;     // leituras seguidas para confirmar que saiu
const unsigned long INTERVALO_SENSOR_MS = 60;    // alterna entre os sensores (evita eco cruzado)
const unsigned long ECHO_TIMEOUT_US     = 12000; // ~2 m; acima disso = nada na frente

const int ANGULO_FECHADA = 0;
const int ANGULO_ABERTA  = 90;
const int PASSO_SERVO_GRAUS = 3;                  // movimento suave
const unsigned long INTERVALO_SERVO_MS = 15;

const unsigned long TEMPO_APOS_PASSAGEM_MS = 2000;  // espera depois que o carro passou
const unsigned long TEMPO_MAX_ABERTA_MS    = 20000; // abriu e nenhum carro passou

const unsigned long INTERVALO_SYNC_MS = 500;
const int HTTP_TIMEOUT_MS = 1500;

// Mostra as distâncias no Serial a cada segundo (útil para calibrar o limiar)
#define DEBUG_SENSORES 0

// ── Tipos ───────────────────────────────────────────────────────────
enum Faixa { ENTRADA = 0, SAIDA = 1 };
const char* NOME_FAIXA[] = { "ENTRADA", "SAIDA" };

enum EstadoCancela { FECHADA, ABRINDO, ABERTA, FECHANDO };
const char* NOME_ESTADO[] = { "FECHADA", "ABRINDO", "ABERTA", "FECHANDO" };

struct Sensor {
  int trig, echo;
  float distanciaCm;   // -1 = nada na frente (sem eco)
  bool presenca;
  int contaPerto, contaLonge;
  unsigned long ultimaPresencaMs;
};

struct Evento {        // fila: loop() → tarefa de rede
  char tipo[20];
  char sentido[8];
  float distanciaCm;
  char comandoId[24];
  char detalhe[48];
};

struct Comando {       // fila: tarefa de rede → loop()
  char id[24];
  char acao[8];
  char sentido[8];
};

// ── Estado global ───────────────────────────────────────────────────
Servo servo;
Sensor sensores[2] = {
  { PINO_TRIG_ENTRADA, PINO_ECHO_ENTRADA, -1, false, 0, 0, 0 },
  { PINO_TRIG_SAIDA,   PINO_ECHO_SAIDA,   -1, false, 0, 0, 0 },
};

EstadoCancela estado = FECHADA;
Faixa faixaAberta = ENTRADA;
int anguloAtual = ANGULO_FECHADA;
unsigned long abertaDesdeMs = 0;
bool carroPassando = false;          // algum carro apareceu no sensor desde que abriu
char comandoPendenteId[24] = "";     // comando a confirmar quando o movimento terminar
char ultimoComandoId[24] = "";       // para não executar duas vezes o mesmo comando
char ultimoComandoEvento[20] = "";   // evento que confirmou o último comando (reenvio)

QueueHandle_t filaEventos;
QueueHandle_t filaComandos;
portMUX_TYPE trava = portMUX_INITIALIZER_UNLOCKED;
volatile bool servidorOk = false;

// Cópia do estado lida pela tarefa de rede (protegida pela trava)
struct Snapshot {
  EstadoCancela estado;
  float distancia[2];
  bool presenca[2];
} snapshot;

// ════════════════════════════════════════════════════════════════════
//  Utilidades
// ════════════════════════════════════════════════════════════════════
void copiar(char* destino, const char* origem, size_t tamanho) {
  strncpy(destino, origem ? origem : "", tamanho - 1);
  destino[tamanho - 1] = '\0';
}

void enviarEvento(const char* tipo, int faixa = -1, const char* comandoId = "", const char* detalhe = "") {
  Evento e;
  copiar(e.tipo, tipo, sizeof(e.tipo));
  copiar(e.sentido, faixa >= 0 ? NOME_FAIXA[faixa] : "", sizeof(e.sentido));
  e.distanciaCm = faixa >= 0 ? sensores[faixa].distanciaCm : -1;
  copiar(e.comandoId, comandoId, sizeof(e.comandoId));
  copiar(e.detalhe, detalhe, sizeof(e.detalhe));
  if (xQueueSend(filaEventos, &e, 0) != pdTRUE) {
    Serial.println("[evento] fila cheia, evento descartado");
  }
  Serial.printf("[evento] %s %s %s\n", tipo, e.sentido, comandoId);
}

void atualizarSnapshot() {
  portENTER_CRITICAL(&trava);
  snapshot.estado = estado;
  for (int i = 0; i < 2; i++) {
    snapshot.distancia[i] = sensores[i].distanciaCm;
    snapshot.presenca[i] = sensores[i].presenca;
  }
  portEXIT_CRITICAL(&trava);
}

// ════════════════════════════════════════════════════════════════════
//  Sensores HC-SR04
// ════════════════════════════════════════════════════════════════════
float medirDistanciaCm(const Sensor& s) {
  digitalWrite(s.trig, LOW);
  delayMicroseconds(2);
  digitalWrite(s.trig, HIGH);
  delayMicroseconds(10);
  digitalWrite(s.trig, LOW);
  unsigned long duracao = pulseIn(s.echo, HIGH, ECHO_TIMEOUT_US);
  if (duracao == 0) return -1;              // sem eco: nada na frente
  return duracao * 0.0343f / 2.0f;          // velocidade do som ≈ 343 m/s
}

void processarSensor(int faixa, unsigned long agora) {
  Sensor& s = sensores[faixa];
  s.distanciaCm = medirDistanciaCm(s);
  bool perto = s.distanciaCm > 0 && s.distanciaCm < LIMIAR_PRESENCA_CM;
  bool longe = s.distanciaCm < 0 || s.distanciaCm > LIMIAR_PRESENCA_CM + HISTERESE_CM;

  s.contaPerto = perto ? s.contaPerto + 1 : 0;
  s.contaLonge = longe ? s.contaLonge + 1 : 0;
  if (s.presenca) s.ultimaPresencaMs = agora;

  if (!s.presenca && s.contaPerto >= LEITURAS_PRESENCA) {
    s.presenca = true;
    s.ultimaPresencaMs = agora;
    enviarEvento("VEICULO_DETECTADO", faixa);
  } else if (s.presenca && s.contaLonge >= LEITURAS_AUSENCIA) {
    s.presenca = false;
    enviarEvento("VEICULO_SAIU", faixa);
  }
}

// ════════════════════════════════════════════════════════════════════
//  Cancela (servo + máquina de estados)
// ════════════════════════════════════════════════════════════════════
void confirmarComando(const char* tipoEvento, int faixa) {
  enviarEvento(tipoEvento, faixa, comandoPendenteId);
  if (comandoPendenteId[0]) copiar(ultimoComandoEvento, tipoEvento, sizeof(ultimoComandoEvento));
  comandoPendenteId[0] = '\0';
}

void abrir(Faixa faixa, const char* comandoId) {
  faixaAberta = faixa;
  abertaDesdeMs = millis();
  carroPassando = sensores[faixa].presenca;
  copiar(comandoPendenteId, comandoId, sizeof(comandoPendenteId));
  if (estado == ABERTA) {
    confirmarComando("CANCELA_ABERTA", faixa);  // já estava aberta: só renova o tempo
  } else {
    estado = ABRINDO;
  }
}

void fechar(const char* comandoId) {
  copiar(comandoPendenteId, comandoId, sizeof(comandoPendenteId));
  if (estado == FECHADA) {
    confirmarComando("CANCELA_FECHADA", faixaAberta);
  } else {
    estado = FECHANDO;
  }
}

bool carroNaFaixa() {
  return sensores[faixaAberta].presenca;
}

void atualizarCancela(unsigned long agora) {
  static unsigned long ultimoPassoMs = 0;

  switch (estado) {
    case ABERTA:
      if (carroNaFaixa()) carroPassando = true;
      // Carro passou (saiu da frente do sensor) → espera um pouco e fecha
      if (carroPassando && !carroNaFaixa() && agora - sensores[faixaAberta].ultimaPresencaMs > TEMPO_APOS_PASSAGEM_MS) {
        estado = FECHANDO;
      }
      // Abriu e ninguém passou → fecha por tempo (se não houver carro na frente)
      if (!carroPassando && !carroNaFaixa() && agora - abertaDesdeMs > TEMPO_MAX_ABERTA_MS) {
        estado = FECHANDO;
      }
      break;

    case FECHANDO:
      // Segurança: apareceu um carro durante o fechamento → reabre
      if (carroNaFaixa()) {
        Serial.println("[cancela] carro detectado durante o fechamento: reabrindo");
        estado = ABRINDO;
        abertaDesdeMs = agora;
        carroPassando = true;
      }
      break;

    default:
      break;
  }

  if (agora - ultimoPassoMs < INTERVALO_SERVO_MS) return;
  ultimoPassoMs = agora;

  if (estado == ABRINDO) {
    anguloAtual = min(ANGULO_ABERTA, anguloAtual + PASSO_SERVO_GRAUS);
    servo.write(anguloAtual);
    if (anguloAtual >= ANGULO_ABERTA) {
      estado = ABERTA;
      abertaDesdeMs = agora;
      confirmarComando("CANCELA_ABERTA", faixaAberta);
    }
  } else if (estado == FECHANDO) {
    anguloAtual = max(ANGULO_FECHADA, anguloAtual - PASSO_SERVO_GRAUS);
    servo.write(anguloAtual);
    if (anguloAtual <= ANGULO_FECHADA) {
      estado = FECHADA;
      carroPassando = false;
      confirmarComando("CANCELA_FECHADA", faixaAberta);
    }
  }
}

void executarComando(const Comando& c) {
  // Reentrega do mesmo comando (a confirmação anterior pode ter se perdido)
  if (strcmp(c.id, ultimoComandoId) == 0) {
    if (comandoPendenteId[0] == '\0' && ultimoComandoEvento[0]) {
      enviarEvento(ultimoComandoEvento, faixaAberta, c.id);
    }
    return;
  }
  copiar(ultimoComandoId, c.id, sizeof(ultimoComandoId));
  ultimoComandoEvento[0] = '\0';

  Faixa faixa = strcmp(c.sentido, "SAIDA") == 0 ? SAIDA : ENTRADA;
  Serial.printf("[comando] %s %s (#%s)\n", c.acao, c.sentido, c.id);

  if (strcmp(c.acao, "ABRIR") == 0) {
    abrir(faixa, c.id);
  } else if (strcmp(c.acao, "FECHAR") == 0) {
    if (sensores[ENTRADA].presenca || sensores[SAIDA].presenca) {
      enviarEvento("COMANDO_RECUSADO", faixa, c.id, "Veiculo na frente do sensor");
      copiar(ultimoComandoEvento, "COMANDO_RECUSADO", sizeof(ultimoComandoEvento));
    } else {
      fechar(c.id);
    }
  } else {
    enviarEvento("COMANDO_RECUSADO", faixa, c.id, "Acao desconhecida");
  }
}

// ════════════════════════════════════════════════════════════════════
//  Rede (tarefa no núcleo 0): Wi-Fi, sync e envio de eventos
// ════════════════════════════════════════════════════════════════════
int postJson(const String& url, const String& corpo, String& resposta) {
  HTTPClient http;
  http.setConnectTimeout(HTTP_TIMEOUT_MS);
  http.setTimeout(HTTP_TIMEOUT_MS);
  if (!http.begin(url)) return -1;
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Key", DEVICE_KEY);
  int codigo = http.POST(corpo);
  if (codigo > 0) resposta = http.getString();
  http.end();
  return codigo;
}

void garantirWiFi() {
  static unsigned long ultimaTentativa = 0;
  if (WiFi.status() == WL_CONNECTED) return;
  servidorOk = false;
  if (millis() - ultimaTentativa < 10000 && ultimaTentativa != 0) return;  // dá tempo de associar
  ultimaTentativa = millis();
  Serial.printf("[wifi] conectando em %s...\n", WIFI_SSID);
  WiFi.disconnect();
  WiFi.begin(WIFI_SSID, WIFI_PASS);
}

void enviarEventosPendentes() {
  Evento e;
  while (xQueuePeek(filaEventos, &e, 0) == pdTRUE) {
    JsonDocument doc;
    doc["tipo"] = e.tipo;
    if (e.sentido[0]) doc["sentido"] = e.sentido;
    if (e.distanciaCm >= 0) doc["distanciaCm"] = roundf(e.distanciaCm * 10) / 10;
    if (e.comandoId[0]) doc["comandoId"] = e.comandoId;
    if (e.detalhe[0]) doc["detalhe"] = e.detalhe;
    String corpo, resposta;
    serializeJson(doc, corpo);

    int codigo = postJson(String(API_BASE) + "/dispositivos/" + DEVICE_ID + "/eventos", corpo, resposta);
    if (codigo <= 0 || codigo >= 500) return;  // servidor fora: tenta de novo no próximo ciclo
    if (codigo >= 400) Serial.printf("[evento] recusado pelo servidor (%d): %s\n", codigo, resposta.c_str());
    xQueueReceive(filaEventos, &e, 0);         // entregue (ou recusado de vez): tira da fila
  }
}

void sincronizar() {
  Snapshot s;
  portENTER_CRITICAL(&trava);
  s = snapshot;
  portEXIT_CRITICAL(&trava);

  JsonDocument doc;
  doc["firmware"] = FIRMWARE_VERSAO;
  doc["ip"] = WiFi.localIP().toString();
  doc["rssi"] = WiFi.RSSI();
  doc["cancela"] = NOME_ESTADO[s.estado];
  for (int i = 0; i < 2; i++) {
    JsonObject sensor = doc["sensores"][NOME_FAIXA[i]].to<JsonObject>();
    if (s.distancia[i] >= 0) sensor["distanciaCm"] = roundf(s.distancia[i] * 10) / 10;
    else sensor["distanciaCm"] = nullptr;
    sensor["presenca"] = s.presenca[i];
  }
  String corpo, resposta;
  serializeJson(doc, corpo);

  int codigo = postJson(String(API_BASE) + "/dispositivos/" + DEVICE_ID + "/sync", corpo, resposta);
  bool ok = codigo == 200;
  if (ok != servidorOk) Serial.printf("[rede] servidor %s (HTTP %d)\n", ok ? "conectado" : "indisponivel", codigo);
  servidorOk = ok;
  if (!ok) return;

  JsonDocument r;
  if (deserializeJson(r, resposta)) return;
  JsonVariant c = r["comando"];
  if (c.isNull()) return;

  Comando cmd;
  copiar(cmd.id, c["id"] | "", sizeof(cmd.id));
  copiar(cmd.acao, c["acao"] | "", sizeof(cmd.acao));
  copiar(cmd.sentido, c["sentido"] | "", sizeof(cmd.sentido));
  if (cmd.id[0]) xQueueSend(filaComandos, &cmd, 0);
}

void tarefaRede(void*) {
  unsigned long ultimoSync = 0;
  for (;;) {
    garantirWiFi();
    if (WiFi.status() == WL_CONNECTED) {
      enviarEventosPendentes();
      if (millis() - ultimoSync >= INTERVALO_SYNC_MS) {
        ultimoSync = millis();
        sincronizar();
      }
    }
    vTaskDelay(pdMS_TO_TICKS(20));
  }
}

// ════════════════════════════════════════════════════════════════════
//  LED de status e comandos pelo Serial (teste de bancada)
// ════════════════════════════════════════════════════════════════════
void atualizarLed(unsigned long agora) {
  // aceso = tudo ok | pisca devagar = Wi-Fi ok, servidor fora | pisca rápido = sem Wi-Fi
  if (servidorOk) { digitalWrite(PINO_LED, HIGH); return; }
  unsigned long periodo = WiFi.status() == WL_CONNECTED ? 1000 : 200;
  digitalWrite(PINO_LED, (agora / periodo) % 2);
}

void lerSerial() {
  if (!Serial.available()) return;
  char c = Serial.read();
  static unsigned long seq = 0;
  char id[24];
  snprintf(id, sizeof(id), "serial-%lu", ++seq);
  Comando cmd;
  copiar(cmd.id, id, sizeof(cmd.id));
  switch (c) {
    case 'e': copiar(cmd.acao, "ABRIR", 8); copiar(cmd.sentido, "ENTRADA", 8); executarComando(cmd); break;
    case 's': copiar(cmd.acao, "ABRIR", 8); copiar(cmd.sentido, "SAIDA", 8); executarComando(cmd); break;
    case 'f': copiar(cmd.acao, "FECHAR", 8); copiar(cmd.sentido, "ENTRADA", 8); executarComando(cmd); break;
    case 'd':
      Serial.printf("[sensores] entrada %.1f cm (%s) | saida %.1f cm (%s) | cancela %s | servidor %s\n",
        sensores[ENTRADA].distanciaCm, sensores[ENTRADA].presenca ? "carro" : "livre",
        sensores[SAIDA].distanciaCm, sensores[SAIDA].presenca ? "carro" : "livre",
        NOME_ESTADO[estado], servidorOk ? "ok" : "fora");
      break;
    default: break;
  }
}

// ════════════════════════════════════════════════════════════════════
//  setup / loop (núcleo 1): sensores, servo e máquina de estados
// ════════════════════════════════════════════════════════════════════
void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println("\n=== MY Parking — cancela ESP32 v" FIRMWARE_VERSAO " ===");
  Serial.println("Serial: e = abrir entrada | s = abrir saida | f = fechar | d = diagnostico");

  pinMode(PINO_LED, OUTPUT);
  for (auto& s : sensores) {
    pinMode(s.trig, OUTPUT);
    pinMode(s.echo, INPUT);
    digitalWrite(s.trig, LOW);
  }

  ESP32PWM::allocateTimer(0);
  servo.setPeriodHertz(50);
  servo.attach(PINO_SERVO, 500, 2400);
  servo.write(ANGULO_FECHADA);

  filaEventos = xQueueCreate(16, sizeof(Evento));
  filaComandos = xQueueCreate(4, sizeof(Comando));
  atualizarSnapshot();

  WiFi.mode(WIFI_STA);
  xTaskCreatePinnedToCore(tarefaRede, "rede", 8192, nullptr, 1, nullptr, 0);
}

void loop() {
  static unsigned long ultimoSensor = 0;
  static int proximoSensor = ENTRADA;
  unsigned long agora = millis();

  if (agora - ultimoSensor >= INTERVALO_SENSOR_MS) {
    ultimoSensor = agora;
    processarSensor(proximoSensor, agora);
    proximoSensor = proximoSensor == ENTRADA ? SAIDA : ENTRADA;
  }

  Comando cmd;
  if (xQueueReceive(filaComandos, &cmd, 0) == pdTRUE) executarComando(cmd);

  atualizarCancela(agora);
  atualizarSnapshot();
  atualizarLed(agora);
  lerSerial();

#if DEBUG_SENSORES
  static unsigned long ultimoDebug = 0;
  if (agora - ultimoDebug > 1000) {
    ultimoDebug = agora;
    Serial.printf("[debug] entrada %.1f cm | saida %.1f cm\n", sensores[ENTRADA].distanciaCm, sensores[SAIDA].distanciaCm);
  }
#endif
}
