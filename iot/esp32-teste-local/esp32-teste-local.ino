// ════════════════════════════════════════════════════════════════════
//  TESTE DE BANCADA (sem servidor) — ESP32 + 2x HC-SR04 + SG90
//
//  Use este sketch só para conferir a montagem: ele abre a cancela para
//  qualquer carro que pare na frente de um sensor e conta as vagas no
//  próprio ESP32. NÃO conversa com o MY Parking.
//
//  O firmware da Fase 2 é o de iot/esp32-cancela/: lá a cancela só abre
//  por ordem do sistema (entrada registrada / saída paga), fecha sem
//  travar o ESP32 e reabre se um carro aparecer durante o fechamento.
//  Os pinos são os mesmos nos dois sketches.
//
//  Biblioteca necessária: ESP32Servo (Gerenciador de Bibliotecas da IDE Arduino)
// ════════════════════════════════════════════════════════════════════

#include <ESP32Servo.h>

// ---------- Pinos ----------
#define TRIG_ENTRADA 5
#define ECHO_ENTRADA 18
#define TRIG_SAIDA   19
#define ECHO_SAIDA   21
#define PINO_SERVO   13

// ---------- Ajustes ----------
const int   TOTAL_VAGAS     = 5;
const float DIST_DETECCAO   = 10.0;  // cm: abaixo disso = carro presente
const int   ANGULO_FECHADA  = 0;
const int   ANGULO_ABERTA   = 90;
const unsigned long TEMPO_ABERTA = 3000; // ms com a cancela aberta após o carro sair do sensor

Servo cancela;
int vagasLivres = TOTAL_VAGAS;

float medirDistancia(int trig, int echo) {
  digitalWrite(trig, LOW);
  delayMicroseconds(2);
  digitalWrite(trig, HIGH);
  delayMicroseconds(10);
  digitalWrite(trig, LOW);

  long duracao = pulseIn(echo, HIGH, 30000); // timeout 30 ms (~5 m)
  if (duracao == 0) return 999;              // nada detectado
  return duracao * 0.0343 / 2.0;             // cm
}

bool carroPresente(int trig, int echo) {
  // 3 leituras para evitar falso positivo
  int hits = 0;
  for (int i = 0; i < 3; i++) {
    if (medirDistancia(trig, echo) < DIST_DETECCAO) hits++;
    delay(20);
  }
  return hits >= 2;
}

void abrirCancela() {
  for (int a = ANGULO_FECHADA; a <= ANGULO_ABERTA; a += 2) {
    cancela.write(a);
    delay(15);
  }
}

void fecharCancela() {
  for (int a = ANGULO_ABERTA; a >= ANGULO_FECHADA; a -= 2) {
    cancela.write(a);
    delay(15);
  }
}

void passagem(int trig, int echo) {
  abrirCancela();
  // espera o carro sair da frente do sensor
  while (carroPresente(trig, echo)) delay(100);
  delay(TEMPO_ABERTA);
  fecharCancela();
}

void setup() {
  Serial.begin(115200);

  pinMode(TRIG_ENTRADA, OUTPUT);
  pinMode(ECHO_ENTRADA, INPUT);
  pinMode(TRIG_SAIDA, OUTPUT);
  pinMode(ECHO_SAIDA, INPUT);

  cancela.setPeriodHertz(50);
  cancela.attach(PINO_SERVO, 500, 2400);
  cancela.write(ANGULO_FECHADA);

  Serial.printf("Estacionamento pronto. Vagas: %d/%d\n", vagasLivres, TOTAL_VAGAS);
}

void loop() {
  if (carroPresente(TRIG_ENTRADA, ECHO_ENTRADA)) {
    if (vagasLivres > 0) {
      Serial.println("Entrada: carro detectado, abrindo...");
      passagem(TRIG_ENTRADA, ECHO_ENTRADA);
      vagasLivres--;
      Serial.printf("Vagas livres: %d\n", vagasLivres);
    } else {
      Serial.println("Entrada: LOTADO, cancela fechada.");
      delay(1000);
    }
  }

  if (carroPresente(TRIG_SAIDA, ECHO_SAIDA)) {
    Serial.println("Saida: carro detectado, abrindo...");
    passagem(TRIG_SAIDA, ECHO_SAIDA);
    if (vagasLivres < TOTAL_VAGAS) vagasLivres++;
    Serial.printf("Vagas livres: %d\n", vagasLivres);
  }

  delay(100);
}
