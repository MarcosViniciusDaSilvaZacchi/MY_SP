# Paramos aqui (arquivo temporário)

> Apague este arquivo quando a branch `correcoes-qualidade-n3` for incorporada à `main`.

**Data:** 16/11/2026, por volta das 21h.
**Onde está o código:** `Desktop/MY_SP` (clone deste repositório), branch **`correcoes-qualidade-n3`**, já enviada ao GitHub.
**Objetivo:** corrigir no MY Parking os bugs encontrados na N3 de Qualidade de Software (relatório no repositório `N3_Qualidade`) e criar testes automatizados.

## O que já foi feito

| Bug da N3 | Situação | Onde |
|---|---|---|
| BUG-01 (Crítico): pagar R$ 0,01 e sair | Corrigido: o valor é calculado só no `pagamento-service`, com a movimentação buscada no `estacionamento-service` (`GET /movimentacoes/:id`); PIX sempre nasce `PENDENTE` | `pagamento-service/src/services/PagamentoService.js`, `src/clients/EstacionamentoClient.js` |
| BUG-02 (Alto): tarifa errada | Corrigido: R$ 10,00 na 1ª hora + R$ 5,00 por hora ou fração, moto 0,5×, carência de 10 min; entrada com carro/moto; caminhão recusado | `pagamento-service/src/domain/strategies/TarifaStrategy.js` (`TarifaPorPorteStrategy`), tela `EntradaView.vue` |
| BUG-03: permanência negativa ou em texto | Corrigido: `400` | `TarifaPorPorteStrategy` |
| BUG-04: placa inválida aceita | Corrigido: validação no back-end | `estacionamento-service/src/domain/services/ValidadorPlaca.js` |
| BUG-05 (Crítico): dados sumiam ao reiniciar | Corrigido: os 5 serviços gravam em SQLite (Sequelize) | `services/*/src/infra/SqliteDocumentStore.js` e `services/*/src/repositories/Sqlite*Repository.js` |
| Extra: CPF com 10/12 dígitos aceito | Corrigido | `mensalista-service/src/services/MensalistaService.js` |

README (seção 13) e `docs/api-contracts.md` foram atualizados.

## Testes executados (todos passando)

- `npm test` na raiz: **91 testes, 8 suítes, todos passando** (Jest + Supertest, sem precisar subir o sistema).
- `npm run test:e2e` com o sistema rodando: **15 de 15 verificações passaram** (CT-01 a CT-12 da N3).
- `node tests/e2e/fluxo-completo.js --apos-reinicio` depois de reiniciar o sistema: **CT-13 passou** (dados continuam gravados).
- `vite build` do front-end: compila sem erros.

## De onde continuar

1. **Incorporar a branch à `main`:** no GitHub, abrir um Pull Request de `correcoes-qualidade-n3` para `main` e fazer o merge (ou, no terminal: `git checkout main && git merge correcoes-qualidade-n3 && git push`).
2. **Testar pela tela** (`npm start` → http://localhost:5173): entrada de carro e de moto, saída com pagamento em dinheiro, cartão e PIX. Os testes automáticos passaram, mas ninguém clicou nas telas depois das mudanças.
3. **Avisar o Yan** que agora é preciso rodar `npm install` na raiz (Jest/Supertest) e que os serviços ganharam as dependências `sequelize` e `sqlite3` (o `npm start` instala sozinho se faltar `node_modules`; se já existir, rodar `npm install` dentro de cada `services/*`).
4. **Docker (não testado):** as imagens usam `node:20-alpine`; conferir se o `sqlite3` instala dentro do container (`docker compose up --build`). Para os dados sobreviverem à recriação dos containers, ainda falta mapear um volume para os arquivos `database_*.sqlite`.
5. **Melhorias que ficaram de fora (opcionais):**
   - Tolerância depois do pagamento: hoje, se o carro pagar e demorar a sair, não há cobrança da diferença.
   - O `vaga-service` ainda tem regras de compatibilidade com vaga de caminhão (`CompatibilidadeVagaStrategy.js`), que o cliente não usa.
   - Validar placa também no cadastro de mensalistas.
6. **Apagar este arquivo** depois do merge.

## Lembretes

- Para zerar os dados de teste: pare o sistema e apague `services/*/database_*.sqlite` (são recriados com os dados de exemplo no próximo `npm start`).
- O repositório `N3_Qualidade` está **encerrado**: não precisa mexer nele.
