# 📋 Regras de Negócio — MY Service Parking

> Documento de referência das regras de negócio do sistema de estacionamento. Toda lógica aqui descrita deve residir nos **microserviços** de back-end, nunca no front-end.

---

## 1. Tipos de Usuário / Clientes

O sistema atende dois tipos de clientes:

| Tipo                 | Descrição                                                        |
| -------------------- | ------------------------------------------------------------------ |
| **Rotativo**   | Motorista avulso que paga a permanência por tempo de uso          |
| **Mensalista** | Motorista com plano mensal, acesso permitido conforme adimplência |

---

## 2. Fluxo de Entrada de Veículo

### RN-01 — Identificação por placa

- A entrada é registrada **sempre por placa** (informada pelo atendente com auxílio da câmera).
- Na Fase 2, a leitura pode ser automatizada por câmera OCR ou ticket físico.

### RN-02 — Verificação de mensalista

- Ao registrar uma entrada, o sistema **consulta automaticamente** se a placa pertence a um mensalista.
- Se for **mensalista ativo e adimplente** → entrada autorizada como mensalista.
- Se for **mensalista inadimplente ou bloqueado** → entrada negada ou tratada como rotativo (decisão a ser definida pela equipe).
- Se **não for mensalista** → entrada registrada como rotativo.

### RN-03 — Registro com data/hora exata

- A data e hora de entrada devem ser registradas com precisão no momento da confirmação.
- O sistema não permite retroagir ou antecipar o horário de entrada manualmente.

### RN-04 — Cancela (MVP vs. Fase 2)

- **MVP:** o atendente libera a cancela manualmente após o sistema confirmar a entrada.
- **Fase 2:** o comando de abertura da cancela pode ser disparado automaticamente pelo sistema.
- O tempo de abertura da cancela após confirmação deve ser **≤ 5 segundos**.

---

## 3. Fluxo de Saída de Veículo

### RN-05 — Localização da permanência

- A saída é iniciada pelo atendente informando a **placa** na tela de saída.
- O sistema localiza a movimentação com status `ABERTA` vinculada àquela placa.

### RN-06 — Cálculo de tarifa (rotativo)

- O cálculo é realizado pelo `pagamento-service` com base em:
  - Horário de entrada × horário de saída = tempo de permanência
  - Tabela de preços vigente (valor/hora e regras de fracionamento — **a definir**)
  - Carência de **10 minutos** (veículos que saem dentro da carência não são cobrados)
- O front-end **não realiza** o cálculo; ele apenas solicita ao back-end e exibe o resultado.

### RN-07 — Carência de 10 minutos

- Permanências de até 10 minutos desde a entrada são **isentas de cobrança**.

### RN-08 — Confirmação de pagamento

- O `pagamento-service` confirma o pagamento.
- **Somente após a confirmação do pagamento** o `estacionamento-service` encerra a movimentação.
- A saída não pode ser finalizada com pagamento pendente (rotativo).

### RN-09 — Saída de mensalista

- A autorização de saída do mensalista depende da **situação financeira** registrada no cadastro.
- Mensalista em dia → saída liberada sem cálculo de tarifa por tempo.
- Mensalista inadimplente → regra de tratamento a ser definida pela equipe.

---

## 4. Regras de Tarifa e Preços

- R$10 a primeira hora
- R$5 a hora seguinte sem fracionamento de hora
- R$200 mensalista

### RN-10 — Tabela de preços

- Deve existir uma tabela de preços com: descrição, valor (por hora ou regra), carência em minutos e período de vigência.
- A tabela deve ser configurável (não hardcoded no código).

## 5. Regras de Mensalistas

### RN-12 — Cadastro de mensalista

- Um mensalista possui: nome, CPF/identificador, placa(s) vinculada(s), plano/mensalidade e data de vencimento.
- O sistema deve permitir vincular mais de uma placa ao mesmo mensalista.

### RN-13 — Verificação de adimplência

- O status financeiro do mensalista determina se a entrada/saída é autorizada.
- Estados possíveis:

| Status           | Descrição                                     |
| ---------------- | ----------------------------------------------- |
| `EM_DIA`       | Mensalidade paga e dentro do prazo              |
| `INADIMPLENTE` | Mensalidade vencida e não paga                 |
| `BLOQUEADO`    | Acesso bloqueado manualmente pelo administrador |
| `INATIVO`      | Cadastro encerrado                              |

### RN-14 — Atualização de status financeiro

- O método de atualização (manual, simulado ou integração externa) é uma **decisão aberta** para o contexto acadêmico.

---

## 6. Regras de Vagas

### RN-15 — Tipos de vaga

- O sistema deve suportar os seguintes tipos:

| Tipo         | Descrição                         |
| ------------ | ----------------------------------- |
| `COMUM`    | Vaga padrão                        |
| `PCD`      | Pessoa com deficiência             |
| `IDOSO`    | Reservada para idosos               |
| `GESTANTE` | Reservada para gestantes            |
| `ELETRICO` | Reservada para veículos elétricos |

### RN-16 — Estados de vaga

- Cada vaga possui um dos seguintes estados:

| Estado           | Descrição                   |
| ---------------- | ----------------------------- |
| `LIVRE`        | Disponível para uso          |
| `OCUPADA`      | Veículo estacionado          |
| `INDISPONIVEL` | Fora de serviço/manutenção |

### RN-17 — Controle de ocupação

- O `vaga-service` é o único responsável pelo estado de cada vaga.
- O `estacionamento-service` controla a permanência do veículo; ele **não** altera diretamente o estado da vaga.
- **MVP:** estado atualizado manualmente pelo atendente.
- **Fase 2:** estado atualizado automaticamente via sensores.
- A atualização do painel de vagas deve ocorrer em **≤ 2 segundos** após o sensor registrar o evento.

### RN-18 — Modelagem de andares

- Vagas e andares devem ser modelados por **dados** (não por regras fixas no código), permitindo escalabilidade para novos andares e sensores.

---

## 7. Regras de Autenticação e Autorização

### RN-19 — Acesso autenticado

- Todas as áreas administrativas e operacionais exigem autenticação prévia.
- Senhas devem ser armazenadas com **hash** (nunca em texto puro).

### RN-20 — Perfis de acesso

- O sistema deve suportar ao menos dois perfis:
  - **Operador/Atendente:** registra entradas, saídas e pagamentos.
  - **Administrador:** acesso a relatórios, auditoria, cadastros e configurações.
- A autorização por perfil deve ser validada no back-end.

### RN-21 — Segredos fora do código

- Credenciais, chaves e segredos **não devem** estar no código-fonte; usar variáveis de ambiente. no dotenv

---

## 8. Regras de Auditoria e Logs

### RN-22 — Registro 100% das operações críticas

- O sistema deve registrar **100%** das entradas, saídas, ocupações e pagamentos.
- Nenhuma operação crítica pode ser perdida por falha de log.

### RN-23 — Trilha de auditoria

- Ações administrativas devem ser rastreáveis (quem fez, o quê, quando e em qual recurso).
- Estrutura mínima do log de auditoria: `id`, `usuario_id`, `operacao`, `recurso`, `referencia`, `data_hora`.

### RN-24 — Logger padronizado

- Todos os microserviços devem usar um logger padronizado com correlação de requisições, facilitando rastreamento de erros entre serviços.

---

## 9. Requisitos Funcionais × Serviços (Rastreabilidade)

| Requisito | Resumo                                                 | Serviço(s) responsável(is)               | Tela              |
| --------- | ------------------------------------------------------ | ------------------------------------------ | ----------------- |
| RF01      | Registro de entrada por placa/ticket                   | estacionamento + integração-dispositivos | EntradaView       |
| RF02      | Ocupação/desocupação por sensores                  | vaga + integração-dispositivos           | VagasView         |
| RF03      | Atualizar vagas nos painéis LED                       | vaga + integração-dispositivos           | Dashboard/Vagas   |
| RF04      | Direcionar para vagas disponíveis                     | vaga + integração-dispositivos           | Entrada/Vagas     |
| RF05      | Controlar cancelas                                     | estacionamento + integração-dispositivos | Entrada/Saída    |
| RF06      | Calcular valor da permanência                         | pagamento                                  | SaidaView         |
| RF07      | Registrar pagamentos                                   | pagamento                                  | SaidaView         |
| RF08      | Liberar saída após pagamento                         | pagamento + estacionamento                 | SaidaView         |
| RF09      | Relatórios de entradas/saídas/ocupação/faturamento | agregação/relatorios                     | RelatoriosView    |
| RF10      | Rotina de sincronização/inconsistências             | integração + serviços de domínio       | Relatorios/Admin  |
| RF11      | Vagas especiais                                        | vaga                                       | VagasView         |
| RF12      | Auditoria de operações                               | auth + logs/auditoria                      | Admin/Relatórios |

---

## 10. Requisitos Não Funcionais com Impacto nas Regras

| RNF                   | Meta                                         | Implicação prática                                           |
| --------------------- | -------------------------------------------- | --------------------------------------------------------------- |
| Disponibilidade       | 99,9% no horário 10h–23h                   | Health checks, reinicialização automática de serviços       |
| Desempenho – vagas   | Atualização ≤ 2s após sensor             | Processamento eficiente de eventos na Fase 2                    |
| Desempenho – cancela | Abertura ≤ 5s após confirmação           | Evitar cadeias longas de chamadas no fluxo crítico             |
| Confiabilidade        | 100% das transações registradas            | Transações locais, idempotência, logs e reconciliação      |
| Segurança            | Acesso autenticado e dados protegidos        | Hash de senha, autorização por perfil, validação de entrada |
| Escalabilidade        | Suportar novos andares/sensores              | Não fixar regras por andar no código; modelar por dados       |
| Usabilidade           | Operações principais em ≤ 3 cliques       | Fluxos curtos e telas focadas por tarefa                        |
| Manutenibilidade      | Logs de erros/eventos                        | Logger padronizado e correlação de requisições              |
| Compatibilidade       | Integrar sensores, cancelas, LED e pagamento | Adapters/contratos para dispositivos, isolados do domínio      |

---

## 11. Estados do Sistema (Padronização)

### Movimentação

```
ABERTA → AGUARDANDO_PAGAMENTO → FINALIZADA
                              → CANCELADA
```

### Pagamento

```
PENDENTE → CONFIRMADO
         → CANCELADO
```

### Mensalista

```
EM_DIA ←→ INADIMPLENTE → BLOQUEADO → INATIVO
```

### Vaga

```
LIVRE ←→ OCUPADA
LIVRE ←→ INDISPONIVEL
```

---

## 12. Separação de Responsabilidades (Regras de Arquitetura)

> Estas são **regras de negócio arquiteturais** que devem ser respeitadas durante todo o desenvolvimento:

- ❌ O **front-end não calcula** a tarifa final — solicita ao back-end.
- ❌ O **front-end não decide** se um mensalista pode entrar — exibe o resultado do `mensalista-service`.
- ✅ O `pagamento-service` **confirma** o pagamento; o `estacionamento-service` **registra** o encerramento.
- ✅ O `vaga-service` **controla** o estado da vaga; o `estacionamento-service` **controla** a permanência do veículo.
- ❌ **Nenhum serviço** acessa diretamente o banco de dados de outro serviço.

---

## 13. Decisões de Negócio Ainda Abertas

Estas decisões **devem ser fechadas antes** da implementação dos serviços afetados:

| #    | Decisão                                                                                      | Impacta                                            |
| ---- | --------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| D-01 | Regra completa da tabela de preços (valor 1ª hora, horas adicionais, arredondamento)        | `pagamento-service`                              |
| D-02 | Comportamento de mensalista inadimplente na entrada (negar ou cobrar como rotativo?)          | `mensalista-service`, `estacionamento-service` |
| D-03 | Como mensalidades e vencimentos serão atualizados (manual, simulado ou integração externa) | `mensalista-service`                             |
| D-04 | Como a câmera será representada no MVP (vídeo real, stream local ou placeholder)           | Front-end,`integração-dispositivos`            |
| D-05 | Quais sensores/cancelas serão simulados e quais terão hardware real na Fase 2               | `integração-dispositivos`                      |
| D-06 | Formato de autenticação: sessão ou JWT                                                     | `auth-service`, Gateway                          |
| D-07 | Relatórios: agregação via gateway ou`reporting-service` separado                         | Arquitetura geral                                  |
| D-08 | Banco SQL a ser utilizado: PostgreSQL, MySQL ou outro                                         | Todos os serviços                                 |
| D-09 | ORM/biblioteca de acesso a dados                                                              | Todos os serviços                                 |

> **Prioridade:** fechar primeiro D-01, D-06, D-08 e D-09 — eles bloqueiam contratos de API e o modelo de dados.
