# Documentação e Evidências dos Princípios S.O.L.I.D. — MY Service Parking

> **Avaliação N2 / Entrega de 06/11**  
> **Aluno:** Yan Carlos Farias  
> **Tema:** Refatoração de Arquitetura Limpa, Padrões de Projeto e Conformidade S.O.L.I.D. com o Modelo C4

---

## 1. Requisitos Originais da Atividade

1. **Single Responsibility Principle (SRP):** Evitar classes que fazem "de tudo um pouco"; serviços não devem conter lógica de formatação JSON ou acesso direto a SQL; cálculo e validação delegados a componentes especialistas.
2. **Open/Closed Principle (OCP):** Evitar `if/else` extensos que travam a evolução do código; novas regras (tarifas, meios de pagamento, acessos) adicionadas via novas classes sem alterar o código existente.
3. **Liskov Substitution Principle (LSP):** Subclasses ou implementações de interfaces não lançam exceções inesperadas para métodos da classe pai; contratos e tipos de retorno uniformes.
4. **Interface Segregation Principle (ISP):** Evitar interfaces gigantescas com métodos que ninguém usa; clientes dependem apenas de métodos específicos para o seu papel.
5. **Dependency Inversion Principle (DIP):** Classes de alto nível dependem de interfaces (`IRepository`, `IMensalistaClient`, `ITarifaStrategy`), e não de classes concretas; injeção via construtor com Composition Root no ponto de entrada.

---

## 2. Relatório de Aplicação dos 5 Princípios no Projeto

### S — Single Responsibility Principle (SRP)
- **Controllers:** Lidam apenas com o protocolo HTTP (headers, status codes, serialização JSON).
- **Application Services:** Orquestram apenas o fluxo do caso de uso.
- **Calculadores Especialistas Criados:**
  - `ResumoEstacionamentoCalculator`: Extraído de `EstacionamentoService`. Responsável exclusivamente por consolidar entradas, saídas, faturamento e ocupação.
  - `DisponibilidadeCalculator`: Responsável exclusivamente por métricas de ocupação de vagas.
  - `ValidadorCpf`: Extraído de `MensalistaService`. Responsável exclusivamente por validar formato e dígitos verificadores de CPF.
- **Entidades de Domínio:** `Movimentacao`, `Mensalista`, `Usuario`, `Pagamento`, `Vaga` encapsulam apenas validações intrínsecas e transições de estado.

---

### O — Open/Closed Principle (OCP)
- **Estratégias de Tarifação (`TarifaStrategy.js`):**
  - Interface: `ITarifaStrategy`.
  - Estratégias: `TarifaPadraoStrategy` (R$ 8/h), `TarifaDiferenciadaStrategy` (R$ 10 na 1ª hora + R$ 5 adicionais) e a nova `TarifaNoturnaStrategy` (pernoite fechado de R$ 35).
  - Contexto: `TarifaEngine.setStrategy()` permite alternar tabelas em tempo de execução sem alterar serviços.
- **Estratégias de Pagamento (`PaymentProcessors.js`):**
  - Interface: `IPagamentoProcessor`.
  - Processadores: `PixProcessor` (QR Code EMVCo oficial), `CartaoProcessor` (algoritmo de Luhn/TEF) e `DinheiroProcessor` (cálculo de troco).
  - Novos meios de pagamento podem ser adicionados sem alterar o `PagamentoService`.
- **Estratégias de Regras de Acesso (`RegrasAcesso.js`):**
  - Interface: `IRegraAcessoStrategy`.
  - Estratégias: `RegraAcessoMensalista` e `RegraAcessoRotativo`, orquestradas por `AvaliadorAcessoContext`.
  - Novas regras (ex: "VIP", "Frota", "Bloqueio") são adicionadas como classes sem alterar `EstacionamentoService.registrarEntrada`.
- **Estratégias de Vagas (`CompatibilidadeVagaStrategy.js`):**
  - Interface: `ICompatibilidadeVagaStrategy`.
  - Estratégia `CompatibilidadePadraoStrategy` e `AlocadorVagasEngine` isolam regras de compatibilidade entre veículos (Moto, Carro, Caminhão) e vagas.

---

### L — Liskov Substitution Principle (LSP)
- Todas as estratégias derivadas de `ITarifaStrategy` retornam exatamente o mesmo payload `{ valorCalculado, dentroCarencia, tabelaAplicada }`.
- Todas as estratégias de `IPagamentoProcessor` implementam `processar()` retornando `{ status, troco, detalhes }`.
- Todas as implementações de repositório (`InMemory...Repository`) implementam rigorosamente as assinaturas de suas interfaces `I...Repository`, garantindo que qualquer futura implementação em banco relacional seja drop-in replacement sem impacto nas regras de negócio.

---

### I — Interface Segregation Principle (ISP)
- `IMensalistaClient`: Segregado com apenas o método `verificarMensalistaPorPlaca(placa)`, evitando acoplar o serviço de estacionamento a métodos administrativos de mensalistas.
- `IPagamentoClient`: Segregado com apenas `listarPagamentos()` e `buscarPagamentoPorMovimentacao(id)`.
- `SecurityServices.js`: `IJwtService` é segregado de `IPasswordHasher`, permitindo que classes usem apenas autenticação por token ou apenas hash de senha.

---

### D — Dependency Inversion Principle (DIP)
- Todos os serviços de aplicação recebem suas dependências no construtor (**Constructor Injection**):
  - `AuthService(usuarioRepository, jwtService, passwordHasher)`
  - `EstacionamentoService(movimentacaoRepository, mensalistaClient, pagamentoClient, resumoCalculator, avaliadorAcesso)`
  - `MensalistaService(mensalistaRepository, validadorCpf)`
  - `PagamentoService(pagamentoRepository, tarifaEngine)`
  - `VagaService(vagaRepository, disponibilidadeCalculator, alocadorEngine)`
- O ponto de entrada de rotas (`routes/index.js` ou `routes/auth.js`) de cada microsserviço funciona como o **Composition Root**, instanciando e injetando as classes concretas nas abstrações.

---

## 3. Conformidade com os Diagramas do Modelo C4

- **C4 Nível 1 (Contexto):** Mapeia atendentes e administradores interagindo com o sistema através da interface.
- **C4 Nível 2 (Containers):** 5 Microsserviços independentes (`auth`, `estacionamento`, `mensalista`, `pagamento`, `vaga`), API Gateway e Front-end SPA.
- **C4 Nível 3 (Componentes):** Mapeamento 1:1 de cada Controller, Service, Strategy, Repository e Client no arquivo `DIAGRAMA-C4/c4-componentes.puml`.
- **C4 Nível 4 (Código / Classes):** Mapeamento completo de classes, interfaces, heranças e enums no arquivo `DIAGRAMA-C4/c4-codigo.puml`.

---

> 📄 **Relatório completo gerado na Área de Trabalho:**  
> `C:\Users\yanca\OneDrive\Área de Trabalho\RELATORIO_SOLID_MY_PARKING.md`
