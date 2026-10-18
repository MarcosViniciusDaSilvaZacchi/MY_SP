
Vamos continuar trabalhando o projeto que está em andamento. Cada um com a proposta que foi apresentada na N1. Agora nos certificaremos que o código atende os 5 princípios S.O.L.I.D.:

- Single Responsibility Principle (SRP)
- Open/Closed Principle (OCP)
- Liskov Substitution Principle (LSP)
- Interface Segregation Principle (ISP)
- Dependency Inversion Principle (DIP)

O primeiro ponto da noite será pesquisar e entender o princípio SOLID e o que cada sigla significa para um código limpo. Após isso vocês deverão refatorar o projeto de código, identificando as violações e aplicando as abstrações corretas para cada princípio para transformar um código rígido em uma arquitetura limpa e desacoplada evitando:

Classes que fazem "de tudo um pouco";

if/else extensos que travam a evolução do código;

Interfaces gigantescas com métodos que ninguém usa;

O que vocês devem avaliar? A aderência dos princípios S.O.L.I.D. no código-fonte, garantindo consistência com os diagramas do Modelo C4 (principalmente os Containers e os Componentes) definidos e entregues na N1.

Cada componente mapeado no diagrama Nível 3 (Componentes) possui um módulo/pacote/namespace correspondente no código?

A camada de Domínio/Regra de Negócio está isolada dos detalhes de Infraestrutura (Banco de Dados, APIs Externas, Frameworks)?

As relações e dependências desenhadas no C4 coincidem com as injeções/interfaces utilizadas no código?

A classe possui uma única responsabilidade no contexto do negócio (ex: serviços de domínio não contêm lógica de formatação de JSON ou acesso direto a SQL).

Evitou-se o surgimento de "God Classes" (classes gigantes que centralizam regras e fluxos de todo o caso de uso).

Lógicas de validação, envio de notificações e persistência estão delegadas a componentes específicos.

Novas regras ou comportamentos (ex: novos métodos de pagamento, novas estratégias de desconto) podem ser adicionados criando novas classes sem alterar o código existente?

Mudanças de requisitos não exigem edição nas classes centrais de regras de negócio?

 Subclasses ou implementações de interfaces não lançam exceções inesperadas (como NotImplementedException) para métodos declarados na interface/classe pai?

As interfaces são coesas e específicas para papéis determinados, em vez de uma única interface genérica (Fat Interface)?

Nenhuma classe implementadora é forçada a deixar métodos vazios ou com retorno null por não utilizá-los?

Classes de alto nível (ex: UseCase, Service) dependem de interfaces (IRepository, INotificationService), e não de classes concretas (SqlRepository, EmailSender)?

O framework ou container configura a instância das dependências no ponto de entrada da aplicação.

Na aula do dia 06/11 vocês devem me mostrar o que identificaram e o que mudaram para atender os princípio SOLID
