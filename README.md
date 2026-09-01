## 🅿️ MY Service Parking

> Sistema web de controle de estacionamento para motoristas **rotativos** e **mensalistas**, desenvolvido como projeto acadêmico de Arquitetura e Projeto de Software.

---

## 📋 Visão Geral

O **MY Service Parking** é um sistema assistido por atendente que realiza o controle completo de um estacionamento: registro de entrada e saída de veículos, cálculo automático de tarifas, gestão de mensalistas, administração de vagas e geração de relatórios.

O projeto é dividido em **duas fases**:

| Fase | Objetivo | O que inclui |
|------|----------|--------------|
| **Fase 1 – MVP** | Fluxo principal funcionando sem hardware | Login, entrada/saída por placa, cálculo de tarifa, pagamento, cadastro de mensalistas, vagas, relatórios e logs |
| **Fase 2 – IoT** | Automação e integração física | Sensores de vaga, leitura automática de placa/ticket, painéis LED, abertura automática de cancelas |

---

## 🏗️ Arquitetura

A aplicação adota uma arquitetura de **microserviços** com front-end SPA em Vue.js, comunicação HTTP/REST via API Gateway e banco de dados por serviço.

```
┌─────────────┐       ┌─────────────┐       ┌──────────────────────┐
│  Vue.js SPA │──────▶│ API Gateway │──────▶│   Microserviços      │
│ (Atendente/ │       │(Node+Express│       │ auth-service         │
│    Admin)   │       │             │       │ estacionamento-svc   │
└─────────────┘       └─────────────┘       │ mensalista-service   │
                                            │ pagamento-service    │
                                            │ vaga-service         │
                                            │ integração-dispositiv│
                                            └──────────────────────┘
```

### Princípios arquiteturais
- **Front-end único** em Vue.js (SPA) para atendentes e administradores
- **API Gateway** como ponto único de entrada
- **Banco por serviço** — sem tabelas compartilhadas entre serviços
- **Comunicação síncrona** via REST (inicial); eventos assíncronos na Fase 2
- **Camada de integração de hardware** isolada do domínio de negócio

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Responsabilidade |
|--------|------------|-----------------|
| Front-end | Vue.js + Vue Router + Axios | Views, componentes, navegação e consumo de APIs |
| Gateway | Node.js + Express | Roteamento, autenticação central, CORS |
| Microserviços | Node.js + Express | Regras de negócio e APIs REST por domínio |
| Banco de dados | SQL (PostgreSQL / MySQL) | Persistência por serviço |
| Ambiente | Docker + Docker Compose | Subir gateway, serviços e bancos padronizados |
| Versionamento | Git + repositório remoto | Branches, pull requests e histórico |

---

## 📁 Estrutura de Repositórios

```
my-service-parking/
├── frontend/                  # Vue.js SPA
│   ├── src/
│   │   ├── views/             # Telas principais
│   │   ├── components/        # Componentes reutilizáveis
│   │   └── services/          # Módulos de consumo de API (Axios)
│   └── ...
├── gateway/                   # API Gateway (Node.js + Express)
├── services/
│   ├── auth-service/
│   ├── estacionamento-service/
│   ├── mensalista-service/
│   ├── pagamento-service/
│   └── vaga-service/
├── docs/                      # Contratos de API, diagramas, decisões técnicas
└── docker-compose.yml
```

---

## 🖥️ Telas do Sistema (Views)

| View | Objetivo |
|------|----------|
| `LoginView.vue` | Autenticar operador/administrador |
| `DashboardView.vue` | Visão operacional rápida (vagas, veículos, movimentações) |
| `EntradaView.vue` | Registrar entrada de veículo por placa |
| `SaidaView.vue` | Processar saída, calcular tarifa e confirmar pagamento |
| `MensalistasView.vue` | Cadastrar, consultar e editar mensalistas |
| `VagasView.vue` | Visualizar e administrar vagas por andar/tipo/status |
| `RelatoriosView.vue` | Relatórios administrativos (entradas, saídas, faturamento) |
| `UsuariosView.vue` | Administração de acesso e perfis |

---

## 🔗 Endpoints da API (Contratos Iniciais)

| Método | Endpoint | Serviço | Uso |
|--------|----------|---------|-----|
| `POST` | `/api/auth/login` | auth | Autenticar usuário |
| `POST` | `/api/entradas` | estacionamento | Registrar entrada de veículo |
| `GET` | `/api/movimentacoes/aberta?placa={placa}` | estacionamento | Localizar permanência aberta |
| `POST` | `/api/saidas` | estacionamento | Finalizar saída |
| `GET` | `/api/mensalistas/placa/{placa}` | mensalista | Consultar mensalista/adimplência |
| `POST` | `/api/mensalistas` | mensalista | Cadastrar mensalista |
| `PATCH` | `/api/mensalistas/{id}` | mensalista | Atualizar cadastro/status |
| `POST` | `/api/pagamentos/calcular` | pagamento | Calcular valor de permanência |
| `POST` | `/api/pagamentos` | pagamento | Registrar/confirmar pagamento |
| `GET` | `/api/vagas` | vaga | Listar vagas com filtros |
| `PATCH` | `/api/vagas/{id}/status` | vaga | Atualizar status de vaga |
| `GET` | `/api/relatorios/resumo` | gateway/agregação | Resumo para dashboard/relatório |

> ⚠️ **Regra essencial:** antes de alterar um endpoint ou payload que o outro dev já está usando, atualizar o contrato em `docs/` e avisar a equipe.

---

## 🗺️ Roadmap de Implementação

| Etapa | Entrega | Critério de Conclusão |
|-------|---------|----------------------|
| 0 - Preparação | Repositórios, README, ambiente, branches, contratos | Ambos conseguem clonar e subir os projetos |
| 1 - Autenticação | Login funcional + proteção de rotas | Usuário autorizado entra; não autorizado é bloqueado |
| 2 - Entrada | Registrar placa e criar movimentação | Entrada rotativa e mensalista persistidas corretamente |
| 3 - Saída/Pagamento | Calcular permanência, tarifa/carência, pagar e finalizar | Fluxo completo de rotativo concluído |
| 4 - Mensalistas | CRUD e status financeiro | Consulta por placa responde estado corretamente |
| 5 - Vagas | Cadastro, estado e tipos especiais | Dashboard e VagasView refletem disponibilidade |
| 6 - Relatórios/Auditoria | Entradas, saídas, ocupação, faturamento e logs | Admin consulta dados e ações ficam registradas |
| 7 - Qualidade | Testes, segurança básica, documentação e Docker | Ambiente reproduzível e requisitos críticos validados |
| 8 - Automação IoT | Sensores, painéis, cancelas e sincronização | Requisitos físicos integrados e medidos |

---

## ✅ Definition of Done (DoD)

Uma funcionalidade só deve ser considerada **concluída** quando:

- [ ] Código executa sem erros no ambiente local dos dois devs
- [ ] Endpoint e payload estão documentados quando houver API
- [ ] Validações básicas e mensagens de erro foram tratadas
- [ ] Front-end **não** contém regra de negócio que deveria estar no serviço
- [ ] Dados persistidos foram testados com casos válidos e inválidos
- [ ] Permissões/autenticação foram consideradas para funções administrativas
- [ ] Logs relevantes existem no back-end
- [ ] Pull Request foi revisado pelo outro dev
- [ ] README/documentação foi atualizado se a forma de executar mudou
- [ ] Requisito relacionado foi marcado como coberto/testado

---

## 👥 Equipe

| Dev | Trilha principal |
|-----|-----------------|
| **Marcos** | Front-end Vue.js (Views, Router, layout base) |
| **Yan** | Back-end (Gateway, microserviços, configuração de ambiente) |

> Ambos revisam contratos, fazem code review via Pull Request e validam requisitos conjuntamente.

---

## 📚 Referências do Projeto

- `Estacionamento - MY Service Parking.docx` — visão do produto e fluxo operacional
- `Atributo Prioritário.docx` — requisitos funcionais (RF01–RF12) e não funcionais (RNF01–RNF10)
- `MY_Service_Parking_Arquitetura_e_Plano_de_Desenvolvimento.pdf` — decisões e propostas de arquitetura

---

## 🌿 Fluxo Git

```
main          ← somente código estável/integrado
  └── develop ← integração da versão em desenvolvimento (opcional)
        ├── feature/<nome>   ← uma branch por funcionalidade
        └── fix/<nome>       ← correções isoladas
```

**Pull Request obrigatório** para merge em `main/develop` — o outro dev revisa antes do merge.
