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
Tarifa: R$ 10,00 na 1ª hora + R$ 5,00 por hora ou fração excedente; moto paga metade (0,5×); até 10 min é carência.
A permanência e o tipo de veículo vêm da movimentação guardada no `estacionamento-service`.

**Request:**
```json
{ "movimentacaoId": "uuid" }
```
**Response 200 (carro, 150 min = 1ª hora + 2 frações):**
```json
{ "permanenciaMinutos": 150, "tipoVeiculo": "CARRO", "valorCalculado": 20.00, "dentroCarencia": false }
```
Sem `movimentacaoId`, faz uma simulação com `{ "permanenciaMinutos": 61, "tipoVeiculo": "MOTO" }` (→ R$ 7,50).
**Errors:** `400` permanência negativa ou não numérica | `404` movimentação não encontrada | `503` estacionamento-service indisponível

### POST /api/pagamentos
O valor devido é calculado no servidor; `valor` e `permanenciaMinutos` enviados no corpo são ignorados.
`valorPago` só é usado no dinheiro (valor recebido no caixa, para o troco). PIX sempre nasce `PENDENTE`.

**Request:**
```json
{ "movimentacaoId": "uuid", "forma": "DINHEIRO|CARTAO|PIX", "valorPago": 25.00 }
```
**Response 201 (dinheiro, devido R$ 20,00):**
```json
{ "id": "uuid", "status": "CONFIRMADO", "valorCalculado": 20.00, "troco": 5.00 }
```
**Errors:** `400` valor em dinheiro insuficiente | `404` movimentação não encontrada | `409` movimentação já encerrada

### Tolerância após o pagamento
Depois de pago, o veículo tem **15 min** para sair (`TOLERANCIA_POS_PAGAMENTO_MINUTOS`). Passado o prazo:
- `POST /api/pagamentos/calcular` devolve em `valorCalculado` **só a diferença** a pagar, com `complementar: true`, `valorTotal` e `valorJaPago`;
- `POST /api/pagamentos` cria um pagamento complementar (`detalhes.complementar: true`) com essa diferença;
- `POST /api/saidas` responde `402` até a diferença ser paga.

Dentro da tolerância, um novo `POST /api/pagamentos` devolve o pagamento já feito (não cobra de novo).

### GET /api/pagamentos/movimentacao/{movimentacaoId}
Devolve o pagamento mais relevante (PIX pendente ou o último confirmado), mais:
```json
{ "valorTotalPago": 15.00,
  "situacaoSaida": { "quitado": false, "saldoDevido": 5.00, "valorTotal": 20.00, "valorJaPago": 15.00,
                     "toleranciaExpirada": true, "toleranciaMinutos": 15, "pagamentoPendenteId": null } }
```
`situacaoSaida` só aparece enquanto a movimentação está aberta.

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
