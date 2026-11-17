// ──────────────────────────────────────────────────────────────────
// Configuração do ESP32 da cancela — MY Service Parking (Fase 2)
//
// 1. Copie este arquivo para "config.h" (na mesma pasta do .ino).
// 2. Preencha o Wi-Fi e o IP do computador que roda o sistema (npm start).
// O config.h está no .gitignore: sua senha de Wi-Fi não vai para o GitHub.
// ──────────────────────────────────────────────────────────────────
#pragma once

// Rede Wi-Fi 2,4 GHz (o ESP32 não conecta em redes só 5 GHz)
#define WIFI_SSID "NOME_DA_REDE"
#define WIFI_PASS "SENHA_DA_REDE"

// API Gateway do MY Parking. Use o IP do PC na rede local, nunca "localhost"
// (no Windows: rode "ipconfig" e veja o "Endereço IPv4"). Libere a porta 3000
// no Firewall do Windows se o ESP32 não conseguir conectar.
#define API_BASE "http://192.168.0.10:3000/api"

// Identificação do dispositivo. A chave deve ser igual à DEVICE_API_KEY do
// gateway e do dispositivos-service (padrão do iniciar.js: my-parking-esp32-key).
#define DEVICE_ID  "esp32-cancela-01"
#define DEVICE_KEY "my-parking-esp32-key"
