# Contratos de API — MY Service Parking

> Combinados antes da implementacao paralela. Qualquer alteracao deve ser registrada aqui e comunicada ao outro dev.

---

## Autenticacao

### POST /api/auth/login
**Request:**
```json
{ "email": "string", "senha": "string" }
```
**Response 200:**
```json
{
  "token": "eyJ...",
  "usuario": { "id": 1, "nome": "string", "email": "string", "perfil": "ADMIN|OPERADOR" }
}
```
**Errors:** `400` campos obrigatorios | `401` credenciais invalidas

---

### GET /api/auth/me
**Headers:** `Authorization: Bearer <token>`
**Response 200:**
```json
{ "usuario": { "id": 1, "nome": "string", "email": "string", "perfil": "string" } }
```
**Errors:** `401` token nao fornecido ou invalido

---

## Entradas

### POST /api/entradas
**Headers:** `Authorization: Bearer <token>`
**Request:**
```json
{ "placa": "ABC1D23", "origem": "OPERADOR" }
```
**Response 201:**
```json
{
  "id": "uuid",
  "placa": "ABC1D23",
  "tipo": "ROTATIVO|MENSALISTA",
  "dataHoraEntrada": "2026-08-24T10:00:00Z",
  "status": "ABERTA",
  "autorizado": true
}
```
**Errors:** `400` placa invalida | `409` veiculo ja possui entrada aberta

---

## Movimentacoes

### GET /api/movimentacoes/aberta?placa={placa}
**Headers:** `Authorization: Bearer <token>`
**Response 200:**
```json
{
  "id": "uuid",
  "placa": "ABC1D23",
  "tipo": "ROTATIVO",
  "dataHoraEntrada": "2026-08-24T10:00:00Z",
  "status": "ABERTA"
}
```
**Errors:** `404` nenhuma entrada aberta para essa placa

---

## Saidas

### POST /api/saidas
**Headers:** `Authorization: Bearer <token>`
**Request:**
```json
{ "placa": "ABC1D23" }
```
**Response 200:**
```json
{
  "movimentacaoId": "uuid",
  "placa": "ABC1D23",
  "dataHoraEntrada": "2026-08-24T10:00:00Z",
  "dataHoraSaida": "2026-08-24T12:30:00Z",
  "permanenciaMinutos": 150,
  "valorCobrado": 25.00,
  "status": "FINALIZADA"
}
```
**Errors:** `404` entrada nao encontrada | `402` pagamento pendente

---

## Mensalistas

### GET /api/mensalistas/placa/{placa}
**Response 200:**
```json
{
  "id": "uuid",
  "nome": "string",
  "placa": "ABC1D23",
  "status": "EM_DIA|INADIMPLENTE|BLOQUEADO|INATIVO",
  "vencimento": "2026-09-01"
}
```
**Errors:** `404` placa nao cadastrada como mensalista

### POST /api/mensalistas
**Request:**
```json
{ "nome": "string", "cpf": "string", "email": "string", "placa": "ABC1D23", "vencimento": "2026-09-01" }
```
**Response 201:** objeto mensalista criado

### PATCH /api/mensalistas/{id}
**Request:** campos a atualizar (parcial)
**Response 200:** objeto mensalista atualizado

---

## Pagamentos

### POST /api/pagamentos/calcular
**Request:**
```json
{ "movimentacaoId": "uuid" }
```
**Response 200:**
```json
{ "permanenciaMinutos": 150, "valorCalculado": 25.00, "dentroCarencia": false }
```

### POST /api/pagamentos
**Request:**
```json
{ "movimentacaoId": "uuid", "forma": "DINHEIRO|CARTAO|PIX", "valorPago": 25.00 }
```
**Response 201:**
```json
{ "id": "uuid", "status": "CONFIRMADO", "troco": 0.00 }
```

---

## Vagas

### GET /api/vagas
**Query params opcionais:** `?andar=1&tipo=COMUM&status=LIVRE`
**Response 200:**
```json
[{ "id": "uuid", "codigo": "A01", "andar": 1, "tipo": "COMUM", "status": "LIVRE" }]
```

### PATCH /api/vagas/{id}/status
**Request:**
```json
{ "status": "LIVRE|OCUPADA|INDISPONIVEL" }
```
**Response 200:** objeto vaga atualizado

---

## Relatorios

### GET /api/relatorios/resumo
**Query params:** `?dataInicio=2026-08-01&dataFim=2026-08-24`
**Response 200:**
```json
{
  "totalEntradas": 120,
  "totalSaidas": 118,
  "faturamento": 1540.00,
  "ocupacaoMedia": 0.75
}
```

---

## Padroes de erro

Todos os erros retornam:
```json
{ "error": "Mensagem descritiva do erro" }
```

| Status | Significado |
|--------|-------------|
| 400 | Dados invalidos / campos obrigatorios ausentes |
| 401 | Nao autenticado |
| 403 | Sem permissao (perfil insuficiente) |
| 404 | Recurso nao encontrado |
| 409 | Conflito (ex.: veiculo ja tem entrada aberta) |
| 502 | Servico downstream indisponivel |
