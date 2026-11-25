# Roteiro de Apresentação — Fase 2: Automação da Cancela (MY Service Parking)

> **Disciplina:** Projeto e Arquitetura de Software
> **Dupla:** Yan Carlos Farias (abertura, arquitetura e circuito) & Marcos Vinícius (código, API e demonstração)
> **Slides:** [MY Parking — Automação da Cancela](https://claude.ai/artifact/C7VgKx6CmD3Ko5ZM3b7Edi) (16 slides, com notas de fala)
> **Tempo total:** 10 a 12 minutos (Yan ~4 min · Marcos ~4 min · demonstração ~3 min)

---

## ✅ Antes de começar (10 minutos antes)

1. **Reiniciar o notebook.** O Bluetooth do Windows trava depois que o notebook suspende; reiniciando, ele volta limpo.
2. Ligar a maquete no **USB do notebook** (alimentação). A conversa com o sistema é por Bluetooth.
3. Terminal 1: `npm start` (sobe os microsserviços e o site).
4. Terminal 2: `npm run ponte` → esperar `ESP32 conectado em COMx` e `Sistema conectado`.
5. Abrir `http://localhost:5173/automacao` e entrar com `operador@myparking.com` / `op123`. O dispositivo deve aparecer **online**.
6. Testar uma vez: mão na frente de cada sensor (a distância muda na tela) e botão **Abrir** (a cancela mexe).
7. **Não fechar a tampa do notebook** durante a apresentação.

**Plano B (se o Bluetooth falhar):** gravar o firmware com `#define CONEXAO CONEXAO_USB` no `config.h` e rodar `npm run ponte -- --usb`. Já foi testado e funciona igual.

---

## 🎤 PARTE 1: YAN — Abertura, arquitetura e circuito (~4 minutos)

### Slide 1 — Capa
> *"Boa noite, professor e pessoal. Na N2 a gente entregou a Fase 1 do **MY Service Parking**: o sistema web completo, com microsserviços e S.O.L.I.D. Hoje a gente traz a **Fase 2: a cancela física**. Montamos uma maquete com um ESP32, dois sensores ultrassônicos e um servo motor, conversando com o sistema por **Bluetooth**."*

### Slide 2 — O que a Fase 2 entrega
> *"O fluxo é este: o carro para na faixa e o **sensor detecta** a menos de 10 centímetros. A tela do operador mostra que tem **veículo aguardando**. O operador registra a placa, ou conclui a saída com o pagamento, e **só então o sistema manda abrir**. O ESP32 nunca abre a cancela por conta própria: quem decide é o sistema, ele só executa."*

### Slide 3 — Arquitetura
> *"A arquitetura de microsserviços continua a mesma. Criamos um serviço novo, o **dispositivos-service**, que guarda o estado da cancela e uma **fila de comandos**. O ESP32 fala Bluetooth com o notebook, e um programa nosso, a **ponte**, transforma isso nas mesmas chamadas HTTP que o ESP32 faria por Wi-Fi, passando pelo **API Gateway** com uma chave própria do dispositivo. Quando o operador registra uma entrada, o **estacionamento-service** cria o comando ABRIR. Ou seja: o backend não precisou mudar para receber o hardware."*

### Slide 4 — Peças da maquete
> *"As peças: o **ESP32** é o cérebro, lê os sensores e move o servo. Os dois **HC-SR04** ficam um em cada faixa e medem distância pelo eco do som. O **servo SG90** é o braço da cancela, de 0 a 90 graus. Os **resistores** formam um divisor de tensão, que eu explico em seguida. Na demonstração alimentamos pelo USB; a **MB102** é a fonte para a maquete funcionar na tomada."*

### Slide 5 — Montagem na protoboard
> *"Essa é a montagem real. O ESP32 é largo e não cabe numa placa só, então ele **atravessa as duas metades** da protoboard. Do lado esquerdo ficam a alimentação e o servo, no pino D13. Do lado direito ficam os dois sensores, cada um com o seu divisor. Como a energia chega só numa das placas, **duas pontes** levam 5 V e GND para a outra. Esse esquema completo, com checklist de montagem, está no repositório."*

### Slide 6 — Esquema elétrico
> *"No esquema elétrico fica mais fácil de ler. O **TRIG** de cada sensor vai direto no ESP32, porque é o ESP32 que manda o pulso. Já o **ECHO** volta do sensor com 5 V, por isso passa pelo divisor antes de chegar no pino. O capacitor perto do servo segura os picos de corrente quando ele se move."*

### Slide 7 — Divisor de tensão
> *"Esse é o detalhe mais importante do circuito. O sensor responde com **5 volts** e o pino do ESP32 aguenta só **3,3**. Com 1 kΩ do lado do sensor e 2 kΩ indo para o GND, o ponto do meio fica em dois terços de 5 volts: **uns 3,3 volts**. Sem isso, o pino pode queimar. E uma curiosidade da montagem: na primeira versão a gente esqueceu de ligar esse ponto do meio, e o ESP32 simplesmente não recebia eco nenhum."*
>
> *"Agora o Marcos mostra como isso funciona no código."*

---

## 💻 PARTE 2: MARCOS — Código, protocolo e API (~4 minutos)

### Slide 8 — Máquina de estados da cancela
> *"No firmware, a cancela é uma **máquina de quatro estados**: fechada, abrindo, aberta e fechando. Recebeu o comando, começa a abrir; o servo chegou em 90 graus, está aberta. Quando o carro passa, ou seja, sai da frente do sensor, ela espera **2 segundos** e fecha. E as três regras de segurança: **só abre por ordem do sistema**, **nunca fecha com carro na frente**, e **sem rede ela continua segura**, fechando sozinha depois de 20 segundos sem carro."*

### Slide 9 — A regra de segurança no código
> *"Esse é o trecho que implementa as setas do slide anterior. No estado ABERTA, quando o carro aparece e depois some, passados 2 segundos muda para FECHANDO. E aqui embaixo está a regra de segurança: se o sensor vê um carro **enquanto o braço desce**, a cancela volta a abrir. O sensor também tem filtro: são **três leituras seguidas** abaixo de 10 cm para contar como carro, o que evita alarme falso."*

### Slide 10 — Protocolo Bluetooth
> *"Pelo Bluetooth, o ESP32 aparece no Windows como uma porta serial. Definimos um protocolo simples: **uma mensagem JSON por linha**. O ESP32 manda o **estado a cada meio segundo** e um **evento** quando algo muda. Cada evento tem um número de sequência e é **reenviado até a ponte confirmar** com um ack, então nada se perde. No sentido contrário, a ponte entrega os **comandos** e avisa se o sistema está no ar, o que acende o LED da placa."*

### Slide 11 — A ponte repassa tudo para a API
> *"A ponte é um programa **Node.js** que roda no notebook. A cada meio segundo ela pega o último estado do ESP32 e faz o **POST de sync** no API Gateway. Se a resposta traz um comando, ela entrega para o ESP32. Ela encontra a porta certa sozinha pelo **nome do Bluetooth** e **reconecta se a conexão cair**. Isso a gente teve que tratar na prática, porque o Windows deixa a porta aberta mesmo quando o ESP32 desliga."*

### Slide 12 — Rotas da cancela no API Gateway
> *"Na API são quatro rotas. O **sync** e os **eventos** são do dispositivo e usam uma chave própria, o **X-Device-Key**, que só abre essas duas rotas. Os **comandos** e a **listagem** são das telas e usam o login normal com **JWT**. Embaixo, um exemplo real: o ESP32 manda o estado e, se tem comando na fila, ele volta na resposta."*

### Slide 13 — Registrar a entrada já abre a cancela
> *"No backend, a integração seguiu o S.O.L.I.D. da N2. O estacionamento-service depende de uma **interface**, a `IDispositivosClient`, e essa é a implementação HTTP dela: **inversão de dependência**. Depois de registrar a entrada, ele chama `abrirCancela`, que cria o comando ABRIR. Reparem no **timeout de 1,5 segundo** e no `catch`: se a cancela estiver fora do ar, a entrada é registrada normalmente. **O hardware nunca trava o sistema.**"*

### Slide 14 — O que acontece quando algo falha
> *"Pensamos nos casos de falha. **Bluetooth caiu:** a ponte reconecta sozinha e a cancela continua segura. **Evento perdido:** é reenviado até a confirmação. **Comando repetido:** o ESP32 reconhece o id e não executa duas vezes. **Chave do dispositivo vazada:** ela só serve para as duas rotas do ESP32, não registra entrada nem lê dados."*

---

## 🚗 PARTE 3: MARCOS — Demonstração ao vivo (~3 minutos)

### Slide 15 — Demonstração
Deixar o navegador lado a lado com a maquete. Tela **Automação** aberta em uma aba e **Entrada** em outra.

1. **Sensor de entrada:** aproximar a mão do sensor de entrada.
   > *"O sensor detectou: a tela de Entrada já mostra que tem veículo aguardando."*
2. **Registrar a placa:** em **Entrada**, digitar uma placa (ex.: `BRA2E19`), escolher a vaga e confirmar.
   > *"Registrei a entrada e o sistema mandou abrir: a cancela levantou."*
3. **Passagem:** tirar a mão da frente do sensor.
   > *"O carro passou; 2 segundos depois ela fecha sozinha."*
4. **Saída:** mão no sensor de saída, ir em **Saída**, escolher o veículo e concluir com pagamento.
   > *"Na saída é igual, mas só abre depois do pagamento confirmado."*
5. **Tela Automação:** mostrar o dispositivo online, as distâncias mudando ao vivo e os botões de abrir e fechar.
   > *"E aqui o operador acompanha tudo em tempo real e pode abrir manualmente, se precisar."*

**Se algo der errado na hora:** a tela Automação mostra se o dispositivo está offline. Conferir o terminal da ponte; se ela não reconectar em 10 segundos, apertar o botão **EN** do ESP32. Último caso: plano B por USB.

### Slide 16 — Obrigado
> *"É isso, pessoal. Obrigado! Ficamos à disposição para perguntas."*

---

## ❓ Perguntas prováveis

| Pergunta | Resposta curta |
| :--- | :--- |
| **Por que Bluetooth e não Wi-Fi?** | Na sala não dependemos da rede da faculdade nem de liberar porta no firewall. O firmware continua suportando Wi-Fi: é só trocar uma linha no `config.h`. |
| **E se dois comandos chegarem juntos?** | A fila do dispositivos-service entrega um por vez. Um pedido igual ainda na fila devolve o mesmo comando; um oposto cancela o anterior. |
| **O ESP32 guarda alguma regra de negócio?** | Não. Ele só tem as regras de segurança da cancela. Quem decide quem entra é o sistema (mensalista, pagamento, vaga). |
| **Por que um serviço novo e não colocar no estacionamento-service?** | Responsabilidade única: o estacionamento cuida de entradas e saídas; o dispositivos-service cuida do hardware. Dá para trocar a cancela sem mexer no resto. |
| **Como o sensor não confunde ruído com carro?** | Filtro no firmware: três leituras seguidas abaixo de 10 cm para entrar, cinco acima de 14 cm para sair (histerese). |
| **E sem a ponte rodando?** | O dispositivo aparece offline na tela Automação, a cancela fecha sozinha e não abre. A entrada continua sendo registrada normalmente. |
