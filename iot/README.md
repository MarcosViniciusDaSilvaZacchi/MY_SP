# Fase 2 — Automação da Cancela (ESP32)

Maquete da portaria do MY Service Parking:

| Peça | Qtd. | Papel |
| :--- | :---: | :--- |
| ESP32 DevKit (30 ou 38 pinos) | 1 | Controlador: lê os sensores, move a cancela e conversa com o sistema por Wi-Fi |
| Micro servo SG90 | 1 | Cancela |
| Sensor ultrassônico HC-SR04 | 2 | Um na faixa de **entrada**, outro na faixa de **saída**: detectam o carro parado |
| Resistores 1 kΩ e 2 kΩ | 2 de cada | Divisor de tensão do pino ECHO de cada sensor |
| Protoboard e jumpers | — | |

## 1. Como funciona

```
 Carro chega ──► HC-SR04 detecta (< 10 cm) ──► ESP32 envia VEICULO_DETECTADO
                                                      │
 Telas de Entrada/Saída mostram "Veículo detectado" ◄─┘
                                                      
 Operador registra a entrada (ou conclui a saída com pagamento)
        │
        ▼
 estacionamento-service ──► dispositivos-service: comando ABRIR
                                                      │
 ESP32 (sync a cada 500 ms) recebe o comando ◄────────┘
        │
        ▼
 Servo levanta a cancela ──► CANCELA_ABERTA
 Carro passa (sai da frente do sensor) + 2 s ──► servo baixa ──► CANCELA_FECHADA
```

Regras da cancela (firmware e simulador):

- Abre **só** por ordem do sistema: entrada registrada, saída liberada (com pagamento confirmado ou carência) ou botão manual na tela **Automação**.
- Fecha sozinha 2 s depois que o carro sai da frente do sensor, ou 20 s depois de abrir se nenhum carro passar.
- **Nunca fecha com carro na frente do sensor.** Se um carro aparecer durante o fechamento, ela reabre. Um pedido manual de FECHAR com carro presente é recusado (`COMANDO_RECUSADO`).
- Se o sistema ou o Wi-Fi caírem, a cancela continua fechando sozinha. Ela não abre sem ordem do sistema.

O ESP32 sempre inicia a conversa (HTTP, pelo API Gateway). Assim ele funciona atrás de qualquer roteador, sem abrir portas no ESP32.

## 2. Ligações

| Componente | Pino do componente | Liga em |
| :--- | :--- | :--- |
| HC-SR04 **entrada** | VCC | 5V (VIN) |
| | TRIG | GPIO 5 |
| | ECHO | **1 kΩ** → GPIO 18, e **2 kΩ** de GPIO 18 para o GND |
| | GND | GND |
| HC-SR04 **saída** | VCC | 5V (VIN) |
| | TRIG | GPIO 19 |
| | ECHO | **1 kΩ** → GPIO 21, e **2 kΩ** de GPIO 21 para o GND |
| | GND | GND |
| Servo SG90 | Sinal (laranja) | GPIO 13 |
| | V+ (vermelho) | 5V (VIN) |
| | GND (marrom) | GND |

- **Divisor de tensão:** o HC-SR04 devolve 5 V no ECHO e o ESP32 só aguenta 3,3 V. Com 1 kΩ em série e 2 kΩ até o GND, o pino recebe cerca de 3,3 V. Sem o divisor, o GPIO pode queimar.
- **Todos os GND juntos** (ESP32, sensores e servo).
- Se o servo tremer ou o ESP32 reiniciar quando a cancela se mexe, alimente o servo com uma fonte 5 V separada (com o GND em comum).
- Posicione cada sensor **antes** da cancela, de frente para onde o carro para. O limiar padrão é 10 cm (`LIMIAR_PRESENCA_CM`): ajuste-o ao tamanho da maquete.

## 3. Gravando o firmware (Arduino IDE)

1. Instale o pacote de placas **esp32** (Espressif) e escolha a placa **ESP32 Dev Module**.
2. Em *Gerenciar Bibliotecas*, instale **ArduinoJson** (v7) e **ESP32Servo**.
3. Abra `iot/esp32-cancela/esp32-cancela.ino`.
4. Copie `config.example.h` para `config.h` e preencha:
   - `WIFI_SSID` e `WIFI_PASS` (rede **2,4 GHz**);
   - `API_BASE`: `http://<IP do PC>:3000/api`. Veja o IP com `ipconfig` no Windows. Nunca use `localhost`, porque para o ESP32 isso é ele mesmo;
   - `DEVICE_KEY` igual à `DEVICE_API_KEY` do sistema (padrão: `my-parking-esp32-key`).
5. Grave e abra o Monitor Serial em **115200**.

O `config.h` está no `.gitignore` para a senha do Wi-Fi não ir para o GitHub.

**LED azul da placa:** aceso = conectado ao sistema · pisca devagar = Wi-Fi ok, sistema fora · pisca rápido = sem Wi-Fi.

**Teste de bancada pelo Monitor Serial:** `e` abre para a entrada, `s` abre para a saída, `f` fecha e `d` mostra as distâncias medidas. Use o `d` para calibrar o limiar.

**Se o ESP32 não conectar ao sistema:** o PC e o ESP32 precisam estar na mesma rede, e o Firewall do Windows precisa liberar a porta 3000 (Node.js) na rede privada.

### Teste de bancada sem o sistema

O sketch `iot/esp32-teste-local/esp32-teste-local.ino` usa os mesmos pinos e funciona sozinho: abre a cancela para qualquer carro que pare na frente de um sensor e conta 5 vagas no próprio ESP32. Serve para conferir sensores, servo e divisor de tensão **antes** de ligar o sistema. Para a demonstração com o MY Parking, grave o `esp32-cancela`.

## 4. Sem hardware: simulador

Com o sistema rodando (`npm start`), em outro terminal:

```bash
npm run simulador
```

O simulador usa o mesmo protocolo e a mesma lógica de cancela do firmware. Teclas: `e` põe ou tira um carro do sensor de entrada, `s` faz o mesmo no de saída, `f` fecha e `q` sai. Acompanhe tudo na tela **Automação (Cancela)** do sistema.

Roteiro de demonstração:

1. `e`: a tela de Entrada mostra "Veículo detectado no sensor de entrada".
2. Registre a placa: a cancela abre.
3. `e` de novo: o carro passou e a cancela fecha 2 s depois.
4. `s` e conclua a saída (com pagamento): a cancela abre para a saída. Aperte `s` de novo e ela fecha.

Teste automático do fluxo inteiro (com `npm start` rodando): `npm run test:e2e:iot`.

## 5. Simulação do circuito no Wokwi

A pasta `esp32-cancela/` tem `diagram.json` e `libraries.txt` no formato do [Wokwi](https://wokwi.com). Crie um projeto ESP32 lá, cole o `.ino`, o `diagram.json` e um `config.h`, e mude a distância dos sensores clicando neles.

O ESP32 simulado no Wokwi acessa a internet, mas não acessa o `localhost` do seu PC. Para ele conversar com o sistema local, veja a documentação do Wokwi sobre o gateway privado. Sem isso, use os comandos do Monitor Serial (`e`, `s`, `f`, `d`) para testar sensores e servo.

## 6. API usada pelo ESP32

Todas as chamadas passam pelo API Gateway, com o cabeçalho `X-Device-Key`. Essa chave **só** dá acesso a estas duas rotas:

| Método | Rota | Quando |
| :--- | :--- | :--- |
| `POST` | `/api/dispositivos/{id}/sync` | A cada 500 ms. Envia `{ firmware, ip, rssi, cancela, sensores: { ENTRADA: { distanciaCm, presenca }, SAIDA: {...} } }` e recebe `{ comando: { id, acao, sentido } \| null }` |
| `POST` | `/api/dispositivos/{id}/eventos` | Quando algo muda: `VEICULO_DETECTADO`, `VEICULO_SAIU`, `CANCELA_ABERTA`, `CANCELA_FECHADA`, `COMANDO_RECUSADO` (com `comandoId` quando confirma um comando) |

Detalhes do serviço: `docs/api-contracts.md` (seção Dispositivos).
