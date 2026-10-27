# Roteiro de Apresentação N2 (Humanizado e Direto) — MY Service Parking

> **Disciplina:** Projeto e Arquitetura de Software | **Avaliação:** N2
> **Dupla:** Yan Carlos Farias (Slides + Modelo C4 + S.O.L.I.D.) & Marcos Vinícius (Código + Demonstração ao Vivo)
> **Como ligar tudo antes de começar (1 clique):** Rodar `node iniciar.js` (ou dar dois cliques em `INICIAR_PROJETO.bat`).

---

## 🎤 PARTE 1: YAN — Slides e Arquitetura (3 a 4 minutos)

### Slide 1 e 2 — Abertura e Onde Estamos (Status)
> *"Boa noite, professor e pessoal. Na N1 a gente mostrou o planejamento do **MY Service Parking**, que ainda estava no começo. Hoje, aqui na N2, a gente traz a **Fase 1 (nosso MVP) 100% pronta e funcionando**, além de toda a refatoração do código seguindo os **5 princípios do S.O.L.I.D.** e os diagramas C4."*

### Slide 3 — Arquitetura em Funcionamento
> *"Nossa arquitetura continua dividida de forma bem organizada: o Front-end em Vue conversa apenas com o **API Gateway na porta 3000**. O Gateway valida o login e distribui para os nossos **5 microsserviços independentes** (Autenticação, Estacionamento, Mensalista, Pagamento e Vagas). Cada um tem a sua própria base isolada."*

### Slide 4 e 5 — Fluxo de Entrada/Saída Hoje e Fase 2 (IoT)
> *"No Slide 4 está o que já funciona hoje: o atendente digita a placa, escolhe a vaga no mapa visual e o sistema já checa sozinho se é mensalista em dia, atrasado ou bloqueado. Na saída, ele calcula o tempo e gera o pagamento por **PIX com QR Code de verdade**, Cartão ou Dinheiro com troco.*
> *E no Slide 5 deixamos mapeada a **Fase 2 com Arduino/ESP32**, onde sensores ultrassônicos e cancelas vão chamar exatamente essas mesmas rotas que já estão prontas."*

### Slide 6, 7, 8 e 9 — Regras, S.O.L.I.D. e Fechamento dos Slides
> *"Para atender o que foi pedido na N2, aplicamos os **5 princípios S.O.L.I.D.** (Slide 7):*
> - **S (Responsabilidade Única):** Tiramos os cálculos pesados de dentro dos serviços e criamos calculadores separados (financeiro, vagas e validador de CPF).
> - **O e L (Aberto/Fechado e Liskov):** Usamos o padrão *Strategy* para tarifas e pagamentos. Inclusive criamos a **Tarifa Noturna (Pernoite)** sem precisar alterar uma única linha das tarifas que já existiam.
> - **I e D (Segregação de Interfaces e Inversão de Dependência):** Criamos interfaces enxutas e injetamos tudo pelo construtor nas rotas.*
>
> *Agora vou passar para o Marcos mostrar isso direto no código e funcionando no navegador!"*

---

## 💻 PARTE 2: MARCOS — Código S.O.L.I.D. + Live Demo (5 a 6 minutos)

### Passo 1: Mostrar o S.O.L.I.D. no VS Code (2 minutos)
Deixe apenas **3 arquivos abertos** no VS Code para mostrar rápido e sem enrolação:

1. **`services/pagamento-service/src/domain/strategies/TarifaStrategy.js`** (Princípios **O** e **L**)
   > *"Pessoal, aqui no código fica muito fácil ver o **Open/Closed (OCP)**. Nós tínhamos a tarifa padrão e a diferenciada. Para a N2, adicionamos a `TarifaNoturnaStrategy` apenas criando uma classe nova que segue o mesmo contrato `ITarifaStrategy`, sem mexer no código antigo."*

2. **`services/estacionamento-service/src/domain/services/ResumoEstacionamentoCalculator.js`** (Princípio **S**)
   > *"Aqui aplicamos o **Single Responsibility (SRP)**: antes o `EstacionamentoService` fazia conta de faturamento e ocupação misturado com regra de entrada. Agora essa classe cuida só de calcular o resumo financeiro."*

3. **`services/estacionamento-service/src/routes/index.js`** (Princípios **I** e **D**)
   > *"E aqui no arquivo de rotas temos o nosso **Composition Root (Inversão de Dependência - DIP)**: nós montamos os repositórios, os clientes HTTP enxutos e os calculadores aqui fora e injetamos prontos dentro do construtor do `EstacionamentoService`."*

---

### Passo 2: Demonstração ao Vivo no Navegador (`http://localhost:5173`) (3 a 4 minutos)

1. **Login e Mapa de Vagas:**
   - Entre com `admin@myparking.com` / `admin123`.
   - Mostre o **Dashboard** e clique em **Vagas** (mostre os 2 andares e os tipos Comum, PCD, Idoso, Gestante e Elétrico).
   > *"Ao entrar, vemos o painel em tempo real e o mapa de vagas dividido em 2 andares."*

2. **Entrada de Veículo (Mostrando a Regra de Acesso S.O.L.I.D.):**
   - Vá em **Entrada**, digite uma placa nova (ex: `BRA2E19`), escolha uma vaga no mapa e confirme.
   > *"Quando registramos a entrada escolhendo a vaga no mapa, o serviço de estacionamento valida as regras de acesso, ocupa a vaga escolhida e já gera o comprovante."*

3. **Saída com Pagamento PIX Real / Dinheiro:**
   - Vá em **Saída**, clique no veículo no pátio, mostre o cálculo automático do valor.
   - Clique em **PIX** (mostre o **QR Code real** gerado na tela!) ou **Dinheiro** (mostre o cálculo de troco) e finalize.
   > *"Na saída, o `pagamento-service` calcula o valor. Se escolhermos PIX, ele gera um QR Code real no padrão do Banco Central; se for dinheiro, calcula o troco na hora. Confirmando, a cancela abre e a vaga já volta a ficar livre."*

4. **Relatórios com Filtro de Período e Exportação PDF / Excel:**
   - Vá em **Relatórios**, mostre o filtro de período/datas e clique em **Exportar PDF** e **Exportar Excel**.
   > *"Por fim, aqui em Relatórios temos filtros por período e exportação completa tanto em **PDF** quanto em **Excel formatado**. Com isso fechamos 100% do nosso MVP e da arquitetura S.O.L.I.D. Obrigado!"*

