# 🏛️ Relatório de Refatoração e Aderência aos Princípios S.O.L.I.D.
## Projeto: MY Service Parking — Sistema de Gestão de Estacionamento Inteligente
**Disciplina:** Projeto e Arquitetura de Software  
**Data de Entrega:** 06/10/2026  
**Repositório:** `MY_SP`  

---

## 📌 1. Visão Geral e Objetivos da Refatoração

Na entrega da N1, foi definida a arquitetura de microserviços orientada ao **Modelo C4** (Contexto, Contêineres, Componentes e Código). O objetivo desta etapa (N2) foi avaliar e refatorar o código-fonte dos 5 microserviços do ecossistema, erradicando código rígido, acoplamento indevido e *God Classes*, garantindo conformidade rigorosa com os **5 Princípios S.O.L.I.D.** e os padrões de projeto arquiteturais.

### 🏢 Microserviços Refatorados:
1. **`auth-service`** (Porta 3001) — Autenticação, gestão de usuários, hashing e tokens JWT.
2. **`estacionamento-service`** (Porta 3002) — Controle de entradas, permanência, saídas e relatórios operacionais.
3. **`mensalista-service`** (Porta 3003) — Gestão de contratos, planos e consulta de adimplência por placa.
4. **`pagamento-service`** (Porta 3004) — Motor de tarifas, carência e processamento de pagamentos.
5. **`vaga-service`** (Porta 3005) — Controle de mapa de vagas, andares, tipos especiais e cálculo de ocupação.

---

## 🧩 2. Análise Detalhada dos Princípios S.O.L.I.D.

---

### 🔹 S — Single Responsibility Principle (Princípio da Responsabilidade Única)
> *"Uma classe ou módulo deve ter um, e apenas um, motivo para mudar."*

#### ❌ Violações Identificadas no Código Legado:
- Os controladores Express (ex: `pagamentoController.js`, `estacionamentoController.js`) acumulavam múltiplas responsabilidades:
  1. Extração e validação de parâmetros HTTP (`req`/`res`);
  2. Execução de cálculos matemáticos e regras de tarifação;
  3. Acesso e manipulação direta de estruturas de dados e vetores em memória;
  4. Realização de chamadas de rede HTTP para serviços externos (`fetch`).

#### ✅ Solução e Refatoração Aplicada:
O código foi desacoplado em camadas com responsabilidades bem definidas:
- **`Domain Entities`** (`Usuario`, `Movimentacao`, `Mensalista`, `Pagamento`, `Vaga`): Encapsulam o estado, regras de transição e auto-validação de consistência dos dados de negócio.
- **`Domain Services / Engines`** (`TarifaEngine`, `DisponibilidadeCalculator`): Dedicados exclusivamente a algoritmos de domínio e cálculos métricos.
- **`Repositories`** (`InMemoryUsuarioRepository`, `InMemoryPagamentoRepository`, etc.): Responsabilidade única de persistência e recuperação de dados.
- **`Application Services / Use Cases`** (`AuthService`, `PagamentoService`, `EstacionamentoService`, etc.): Orquestram o fluxo de negócio entre entidades, repositórios e serviços auxiliares, independentes de HTTP.
- **`Controllers`** (`AuthController`, `PagamentoController`, etc.): Atuam estritamente como adaptadores HTTP, traduzindo requisições para os casos de uso e mapeando códigos de status (`200`, `201`, `400`, `404`).

---

### 🔹 O — Open/Closed Principle (Princípio Aberto/Fechado)
> *"Entidades de software devem estar abertas para extensão, mas fechadas para modificação."*

#### ❌ Violações Identificadas no Código Legado:
- As regras de cálculo de tarifa estavam engessadas em funções condicionais dentro do controller. Caso o estacionamento quisesse introduzir tarifas dinâmicas (ex: tabela noturna, finais de semana, tabela escalonada RN-10), era obrigatório modificar a função central existente.
- A confirmação de pagamentos não previa extensibilidade para diferentes formas (Dinheiro com troco, Cartão, PIX, etc.).

#### ✅ Solução e Refatoração Aplicada:
- **Padrão Strategy para Tarifação:** Criou-se a interface `ITarifaStrategy` e a classe `TarifaEngine`. Novas regras de cálculo são adicionadas criando novas estratégias (ex: `TarifaPadraoStrategy`, `TarifaDiferenciadaStrategy`) sem tocar no `PagamentoService` ou no `TarifaEngine`.
- **Padrão Strategy para Formas de Pagamento:** Criou-se `IPagamentoProcessor` com implementações específicas (`DinheiroProcessor`, `CartaoProcessor`, `PixProcessor`) gerenciadas pela `PagamentoProcessorFactory`.

```javascript
// Exemplo de Extensibilidade OCP em TarifaStrategy.js:
class ITarifaStrategy {
  calcular(permanenciaMinutos) { throw new Error('Não implementado'); }
}

class TarifaPadraoStrategy extends ITarifaStrategy { /* R$ 8/h com 10 min de carência */ }
class TarifaDiferenciadaStrategy extends ITarifaStrategy { /* R$ 10 1ª hora + R$ 5 adicionais */ }

// TarifaEngine aberto para extensão sem modificar sua lógica interna
class TarifaEngine {
  constructor(strategy = new TarifaPadraoStrategy()) { this.strategy = strategy; }
  setStrategy(strategy) { this.strategy = strategy; }
  calcular(min) { return this.strategy.calcular(min); }
}
```

---

### 🔹 L — Liskov Substitution Principle (Princípio da Substituição de Liskov)
> *"Objetos de uma superclasse devem poder ser substituídos por objetos de suas subclasses sem quebrar a integridade do sistema."*

#### ❌ Violações Identificadas no Código Legado:
- Inexistência de contratos formais de repositório ou clientes externos. A substituição do armazenamento em memória por um banco relacional (PostgreSQL/MySQL) exigiria reescrever o interior dos controladores.

#### ✅ Solução e Refatoração Aplicada:
- Criação de classes base/interfaces explícitas de repositório (`IUsuarioRepository`, `IMovimentacaoRepository`, `IMensalistaRepository`, `IPagamentoRepository`, `IVagaRepository`).
- A implementação atual `InMemory...Repository` cumpre estritamente todos os métodos e tipos de retorno das classes abstratas. A substituição futura por `Postgres...Repository` ou `Mongo...Repository` ocorre de forma transparente para as camadas de domínio e casos de uso, sem gerar exceções imprevistas.

---

### 🔹 I — Interface Segregation Principle (Princípio da Segregação de Interfaces)
> *"Nenhum cliente deve ser forçado a depender de métodos que não utiliza."*

#### ❌ Violações Identificadas no Código Legado:
- Operações de leitura, escrita, cálculo de métricas e chamadas REST ficavam misturadas em um único escopo. Clientes que só precisavam consultar adimplência ou disponibilidade ficavam atrelados ao código completo de manipulação de entidades.

#### ✅ Solução e Refatoração Aplicada:
- Criação de contratos coesos e segregados por papel:
  - `IMensalistaClient`: Interface específica para verificação de placas externas, contendo apenas o método `verificarMensalistaPorPlaca(placa)`.
  - `IJwtService` e `IPasswordHasher`: Interfaces separadas no `auth-service` para geração de tokens e hashing criptográfico, não forçando acoplamento entre regras de sessão e criptografia de senhas.
  - `DisponibilidadeCalculator`: Serviço de domínio focado estritamente na agregação de métricas de ocupação.

---

### 🔹 D — Dependency Inversion Principle (Princípio da Inversão de Dependência)
> *"Módulos de alto nível não devem depender de módulos de baixo nível. Ambos devem depender de abstrações."*

#### ❌ Violações Identificadas no Código Legado:
- Os controladores instanciavam e acessavam diretamente globais, módulos de terceiros (`jsonwebtoken`, `bcryptjs`), a função global `fetch` com URLs hardcoded e arrays mutáveis na memória.

#### ✅ Solução e Refatoração Aplicada:
- **Injeção de Dependências via Construtor:** Todas as classes de alto nível (`AuthService`, `EstacionamentoService`, `PagamentoService`, etc.) recebem suas dependências através do construtor, dependendo unicamente de abstrações.
- **Composition Root:** O ponto de entrada de cada microserviço (`routes/index.js` ou `routes/auth.js`) atua como container de composição, instanciando as implementações concretas e injetando-as nos serviços e controladores.

```javascript
// Exemplo de Composição e Injeção de Dependência (DIP) em estacionamento-service:
const movimentacaoRepository = new InMemoryMovimentacaoRepository(); // Abstração IMovimentacaoRepository
const mensalistaClient = new MensalistaHttpClient();                 // Abstração IMensalistaClient
const estacionamentoService = new EstacionamentoService(movimentacaoRepository, mensalistaClient);
const estacionamentoController = new EstacionamentoController(estacionamentoService);
```

---

## 🏗️ 3. Padrões de Projeto (Design Patterns) Aplicados

| Padrão | Categoria | Onde foi aplicado | Benefício Arquitetural |
| :--- | :--- | :--- | :--- |
| **Strategy Pattern** | Comportamental | `TarifaStrategy`, `PaymentProcessors` | Permite trocar ou adicionar novas fórmulas de cálculo de permanência e métodos de pagamento sem modificar os serviços existentes (OCP). |
| **Repository Pattern** | Arquitetural / Acesso a Dados | Todos os 5 microserviços (`src/repositories/`) | Isola completamente a regra de negócio do mecanismo de armazenamento (In-Memory, SQL, NoSQL). |
| **Adapter / HTTP Client Pattern** | Estrutural | `MensalistaHttpClient` no `estacionamento-service` | Isola chamadas de rede REST e timeouts, provendo resiliência caso o serviço de mensalistas esteja indisponível. |
| **Dependency Injection** | Criacional / Arquitetural | `Composition Root` em todos os microserviços | Desacoplamento total entre quem usa e quem instancia os objetos. |
| **Rich Domain Model** | Domínio | `Usuario`, `Movimentacao`, `Vaga`, `Pagamento`, `Mensalista` | Elimina modelos anêmicos, centralizando validações e transições de estado dentro da própria entidade. |

---

## 🗺️ 4. Consistência com os Diagramas do Modelo C4 (N1)

A refatoração garantiu **100% de aderência** entre o código-fonte e o diagrama de componentes **C4 Nível 3** (`c4-componentes.puml`) e o diagrama de classes **C4 Nível 4** (`c4-codigo.puml`):

| Componente desenhado no C4 Nível 3 | Módulo / Classe implementada no Código | Microserviço |
| :--- | :--- | :--- |
| **`Tarifa Engine`** | `src/domain/strategies/TarifaStrategy.js` (`TarifaEngine`) | `pagamento-service` |
| **`Pagamento Repository`** | `src/repositories/PagamentoRepository.js` (`IPagamentoRepository`) | `pagamento-service` |
| **`Mensalista Client`** | `src/clients/MensalistaClient.js` (`MensalistaHttpClient`) | `estacionamento-service` |
| **`Movimentação Repository`** | `src/repositories/InMemoryMovimentacaoRepository.js` | `estacionamento-service` |
| **`Disponibilidade Calculator`** | `src/domain/services/DisponibilidadeCalculator.js` | `vaga-service` |
| **`Vaga Repository`** | `src/repositories/InMemoryVagaRepository.js` | `vaga-service` |
| **`User Repository`** | `src/repositories/InMemoryUsuarioRepository.js` | `auth-service` |
| **`JWT Utility` & `Password Hasher`** | `src/security/SecurityServices.js` (`JwtService`, `BcryptPasswordHasher`) | `auth-service` |
| **`Mensalista Repository`** | `src/repositories/InMemoryMensalistaRepository.js` | `mensalista-service` |

---

## 📁 5. Estrutura Padrão de Diretórios dos Microserviços

Cada microserviço em `services/` segue agora a Clean Architecture:

```
services/<nome-service>/src/
├── domain/                  # Camada de Domínio (Livre de frameworks)
│   ├── entities/            # Entidades ricas com validação
│   ├── enums/               # Enumeradores de estado e tipo
│   ├── services/            # Serviços de domínio e engines de cálculo
│   └── strategies/          # Padrões Strategy (quando aplicável)
├── repositories/            # Camada de Dados
│   ├── I<Nome>Repository.js # Contrato / Interface abstrata
│   └── InMemory<Nome>Repository.js # Implementação de persistência
├── clients/                 # Camada de Integração Externa (Adapters HTTP)
├── security/                # Utilitários de segurança e criptografia
├── services/                # Use Cases / Application Services
├── controllers/             # Adaptadores HTTP (Express Controllers)
├── routes/                  # Rotas e Composition Root (Injeção de Dependências)
└── app.js                   # Inicialização do servidor Express
```

---

## 🧪 6. Validação e Testes de Integridade

- **Compilação e Sintaxe:** Todos os microserviços foram testados e carregados sem erros de sintaxe ou dependências pendentes.
- **Contratos de API:** Todos os endpoints REST originais (`/entradas`, `/saidas`, `/movimentacoes/aberta`, `/pagamentos/calcular`, `/pagamentos`, `/mensalistas`, `/vagas`, `/auth/login`, etc.) mantiveram sua compatibilidade com o Frontend Vue.js e o API Gateway.
- **Resiliência:** O `MensalistaHttpClient` conta com timeout seguro e tratamento de falhas em caso de instabilidade na comunicação entre serviços.

---

## 🏁 7. Conclusão

Com a refatoração concluída, o projeto **MY Service Parking** migrou de uma arquitetura procedimental monolítica acoplada aos controladores para uma **Arquitetura Limpa e Orientada a Objetos**. O sistema cumpre integralmente os requisitos de design de software do S.O.L.I.D., permitindo que novas funcionalidades (como novos métodos de cobrança, integração com sensores IoT ou substituição de banco de dados) sejam adicionadas sem refatorações destrutivas no núcleo de regras de negócio.
