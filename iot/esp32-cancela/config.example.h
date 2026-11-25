// ──────────────────────────────────────────────────────────────────
// Configuração do ESP32 da cancela — MY Service Parking (Fase 2)
//
// 1. Copie este arquivo para "config.h" (na mesma pasta do .ino).
// 2. Escolha a CONEXAO e preencha só a parte dela.
// O config.h está no .gitignore: sua senha de Wi-Fi não vai para o GitHub.
// ──────────────────────────────────────────────────────────────────
#pragma once

// Como o ESP32 conversa com o sistema:
//   CONEXAO_BLUETOOTH → pareia com o notebook; a ponte (npm run ponte) repassa
//                       para a API. Não precisa de rede Wi-Fi.
//   CONEXAO_USB       → igual ao Bluetooth, mas pelo cabo USB (plano B).
//   CONEXAO_WIFI      → HTTP direto no API Gateway pela rede Wi-Fi.
#define CONEXAO CONEXAO_BLUETOOTH

// ── Bluetooth ──────────────────────────────────────────────────────
// Nome que aparece na lista de dispositivos Bluetooth do Windows.
#define BT_NOME "MY-Parking-Cancela"

// ── Wi-Fi (só para CONEXAO_WIFI) ───────────────────────────────────
// Rede 2,4 GHz (o ESP32 não conecta em redes só 5 GHz)
#define WIFI_SSID "NOME_DA_REDE"
#define WIFI_PASS "SENHA_DA_REDE"

// API Gateway do MY Parking. Use o IP do PC na rede local, nunca "localhost"
// (no Windows: rode "ipconfig" e veja o "Endereço IPv4"). Libere a porta 3000
// no Firewall do Windows se o ESP32 não conseguir conectar.
#define API_BASE "http://192.168.0.10:3000/api"

// Identificação do dispositivo (Wi-Fi). Nos modos Bluetooth/USB quem usa o
// id e a chave é a ponte (--id / --chave). A chave deve ser igual à
// DEVICE_API_KEY do sistema (padrão do iniciar.js: my-parking-esp32-key).
#define DEVICE_ID  "esp32-cancela-01"
#define DEVICE_KEY "my-parking-esp32-key"
