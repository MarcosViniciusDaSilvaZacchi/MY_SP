# 🚀 READMEZERO — Como Abrir e Rodar o Projeto do Zero

> Guia completo para qualquer pessoa da equipe configurar o ambiente e rodar o **MY Service Parking** pela primeira vez.

---

## 📋 Índice

1. [Programas que precisam estar instalados](#1-programas-que-precisam-estar-instalados)
2. [Extensões do VS Code](#2-extensões-do-vs-code)
3. [Clonando o repositório](#3-clonando-o-repositório)
4. [Instalando as dependências](#4-instalando-as-dependências)
5. [Configurando as variáveis de ambiente](#5-configurando-as-variáveis-de-ambiente)
6. [Rodando o projeto](#6-rodando-o-projeto)
7. [Fluxo de trabalho Git](#7-fluxo-de-trabalho-git)
8. [Problemas comuns](#8-problemas-comuns)

---

## 1. Programas que precisam estar instalados

Instale tudo na ordem abaixo antes de qualquer coisa.

### 🟢 Node.js (versão 20 ou superior)

> O Node.js já inclui o `npm` automaticamente.

1. Acesse: https://nodejs.org
2. Baixe a versão **LTS** (Long Term Support)
3. Instale com as opções padrão
4. Verifique no terminal:

```bash
node --version   # deve aparecer v20.x.x ou superior
npm --version    # deve aparecer 10.x.x ou superior
```

---

### 🐙 Git

1. Acesse: https://git-scm.com/downloads
2. Baixe para Windows e instale com as opções padrão
3. Durante a instalação, deixe marcado **"Git Bash"** e **"Git from the command line"**
4. Verifique no terminal:

```bash
git --version    # deve aparecer git version 2.x.x
```

---

### 🐳 Docker Desktop *(necessário para rodar tudo junto com Docker)*

> Se quiser rodar apenas no modo manual (3 terminais), pode pular.

1. Acesse: https://www.docker.com/products/docker-desktop
2. Baixe e instale o Docker Desktop
3. Após instalar, **abra o Docker Desktop** e aguarde ele iniciar (ícone na bandeja do sistema)
4. Verifique no terminal:

```bash
docker --version          # deve aparecer Docker version 24.x ou superior
docker compose version    # deve aparecer Docker Compose version v2.x
```

---

### 💻 Visual Studio Code

1. Acesse: https://code.visualstudio.com
2. Baixe e instale normalmente
3. Na próxima seção estão as extensões necessárias

---

## 2. Extensões do VS Code

Abra o VS Code, pressione `Ctrl + Shift + X` para abrir a aba de extensões e instale cada uma:

### ✅ Obrigatórias

| Extensão | ID para buscar | Para que serve |
|----------|---------------|----------------|
| **Vue - Official** | `Vue.volar` | Suporte completo ao Vue 3: syntax highlight, autocomplete, IntelliSense |
| **ESLint** | `dbaeumer.vscode-eslint` | Aponta erros de código JavaScript/Vue em tempo real |
| **Prettier - Code formatter** | `esbenp.prettier-vscode` | Formata o código automaticamente ao salvar |
| **DotENV** | `mikestead.dotenv` | Destaca variáveis nos arquivos `.env` |
| **GitLens** | `eamodio.gitlens` | Mostra quem editou cada linha, histórico de commits inline |

### 💡 Recomendadas

| Extensão | ID para buscar | Para que serve |
|----------|---------------|----------------|
| **Thunder Client** | `rangav.vscode-thunder-client` | Testa APIs REST direto no VS Code (substitui Postman) |
| **Docker** | `ms-azuretools.vscode-docker` | Visualiza containers, imagens e logs Docker |
| **Path Intellisense** | `christian-kohler.path-intellisense` | Autocomplete de caminhos de arquivo nos imports |
| **Error Lens** | `usernamehw.errorlens` | Mostra erros e warnings inline no código |
| **Auto Rename Tag** | `formulahendry.auto-rename-tag` | Renomeia a tag de fechamento automaticamente ao editar a de abertura |
| **Bracket Pair Color DLW** | `BrackerPairColorDlw.bracket-pair-color-dlw` | Colore pares de chaves, colchetes e parênteses |

### ⚙️ Configuração recomendada do VS Code

Crie (ou edite) o arquivo `.vscode/settings.json` na raiz do projeto com:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.tabSize": 2,
  "files.eol": "\n",
  "[vue]": {
    "editor.defaultFormatter": "Vue.volar"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

---

## 3. Clonando o repositório

Abra o **terminal** (Git Bash, PowerShell ou CMD) na pasta onde quer salvar o projeto:

```bash
git clone https://github.com/MarcosViniciusDaSilvaZacchi/MY_SP.git
```

Acesse a pasta clonada:

```bash
cd MY_SP
```

Abra no VS Code:

```bash
code .
```

---

## 4. Instalando as dependências

O projeto tem **6 pacotes Node.js** separados (1 frontend + 1 gateway + 4 serviços).  
Você precisa rodar `npm install` em cada um deles.

### Opção A — Script automático (recomendado)

No terminal, na **raiz do projeto** (`MY_SP/`), rode:

**Windows (PowerShell):**
```powershell
foreach ($dir in @('frontend', 'gateway', 'services/auth-service', 'services/estacionamento-service', 'services/mensalista-service', 'services/pagamento-service', 'services/vaga-service')) {
    Write-Host "Instalando $dir..."
    npm install --prefix $dir
}
Write-Host "Todas as dependencias instaladas!"
```

**Mac / Linux (bash):**
```bash
for dir in frontend gateway services/auth-service services/estacionamento-service services/mensalista-service services/pagamento-service services/vaga-service; do
    echo "Instalando $dir..."
    npm install --prefix $dir
done
echo "Todas as dependencias instaladas!"
```

### Opção B — Manual (um por um)

```bash
# Frontend
cd frontend
npm install
cd ..

# Gateway
cd gateway
npm install
cd ..

# Serviços
cd services/auth-service && npm install && cd ../..
cd services/estacionamento-service && npm install && cd ../..
cd services/mensalista-service && npm install && cd ../..
cd services/pagamento-service && npm install && cd ../..
cd services/vaga-service && npm install && cd ../..
```

> ⚠️ **Nunca commite a pasta `node_modules/`!** Ela está no `.gitignore` e não vai para o GitHub.

---

## 5. Configurando as variáveis de ambiente

Cada serviço tem um arquivo `.env.example` com as variáveis necessárias.  
**Copie** esses arquivos para `.env` (sem o `.example`):

**Windows (PowerShell):**
```powershell
Copy-Item gateway/.env.example gateway/.env
Copy-Item services/auth-service/.env.example services/auth-service/.env
Copy-Item services/estacionamento-service/.env.example services/estacionamento-service/.env
Copy-Item services/mensalista-service/.env.example services/mensalista-service/.env
Copy-Item services/pagamento-service/.env.example services/pagamento-service/.env
Copy-Item services/vaga-service/.env.example services/vaga-service/.env
```

**Mac / Linux:**
```bash
cp gateway/.env.example gateway/.env
cp services/auth-service/.env.example services/auth-service/.env
cp services/estacionamento-service/.env.example services/estacionamento-service/.env
cp services/mensalista-service/.env.example services/mensalista-service/.env
cp services/pagamento-service/.env.example services/pagamento-service/.env
cp services/vaga-service/.env.example services/vaga-service/.env
```

> ⚠️ Os arquivos `.env` **não vão para o GitHub** (estão no `.gitignore`). Cada desenvolvedor mantém o seu local.

### Variáveis importantes do Gateway (`gateway/.env`)

```env
PORT=3000
JWT_SECRET=my-parking-secret-CHANGE-IN-PRODUCTION
FRONTEND_URL=http://localhost:5173
AUTH_SERVICE_URL=http://localhost:3001
ESTACIONAMENTO_SERVICE_URL=http://localhost:3002
MENSALISTA_SERVICE_URL=http://localhost:3003
PAGAMENTO_SERVICE_URL=http://localhost:3004
VAGA_SERVICE_URL=http://localhost:3005
```

---

## 6. Rodando o projeto

O projeto agora tem **7 processos** para rodar (5 microserviços + gateway + frontend).

---

### ⚡ Opção A — Script automático (recomendado)

Rode tudo com **um único comando** no PowerShell, na raiz do projeto:

```powershell
$ROOT = (Get-Location).Path
$servicos = @(
    @{dir="services\auth-service";           label="auth-service"},
    @{dir="services\estacionamento-service";  label="estacionamento-service"},
    @{dir="services\mensalista-service";      label="mensalista-service"},
    @{dir="services\pagamento-service";       label="pagamento-service"},
    @{dir="services\vaga-service";            label="vaga-service"},
    @{dir="gateway";                          label="gateway"}
)
foreach ($s in $servicos) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ROOT\$($s.dir)'; npm run dev" -WindowStyle Normal
}
Start-Sleep 4
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ROOT\frontend'; npm run dev" -WindowStyle Normal
Write-Host "Todos os servicos iniciados! Acesse: http://localhost:5173"
```

Isso abre **7 janelas PowerShell**, uma por serviço. Quando todas mostrarem "Rodando na porta X", acesse **http://localhost:5173**.

---

### 🖥️ Opção B — 7 Terminais no VS Code

No VS Code use `Ctrl + Shift + `` ` `` ` para abrir um novo terminal. Abra 7 e rode um comando em cada:

| Terminal | Comando | Porta | Sinal de sucesso |
|----------|---------|-------|-----------------|
| 1 | `cd services/auth-service; npm run dev` | 3001 | `[Auth Service] Rodando na porta 3001` |
| 2 | `cd services/estacionamento-service; npm run dev` | 3002 | `[estacionamento-service] Rodando na porta 3002` |
| 3 | `cd services/mensalista-service; npm run dev` | 3003 | `[mensalista-service] Rodando na porta 3003` |
| 4 | `cd services/pagamento-service; npm run dev` | 3004 | `[pagamento-service] Rodando na porta 3004` |
| 5 | `cd services/vaga-service; npm run dev` | 3005 | `[vaga-service] Rodando na porta 3005` |
| 6 | `cd gateway; npm run dev` | 3000 | `[Gateway] Rodando na porta 3000` |
| 7 | `cd frontend; npm run dev` | 5173 | `VITE ready → http://localhost:5173` |

> 💡 **Dica:** No painel de terminais do VS Code, clique no ícone `+` para abrir cada novo terminal.

Acesse **http://localhost:5173** no navegador.

---

### 🐳 Opção C — Docker Compose (tudo de uma vez)

> O **Docker Desktop** precisa estar instalado e aberto. Veja a seção 1 deste guia.

```bash
docker compose up --build
```

Aguarde o build (~2 min na primeira vez). Quando todos os containers subirem:

| Serviço | Endereço |
|---------|----------|
| 🖥️ Frontend | http://localhost |
| 🔀 Gateway | http://localhost:3000 |
| 🔐 auth-service | http://localhost:3001 |
| 🚗 estacionamento-service | http://localhost:3002 |
| 👤 mensalista-service | http://localhost:3003 |
| 💳 pagamento-service | http://localhost:3004 |
| 🅿️ vaga-service | http://localhost:3005 |

Para parar tudo:
```bash
Ctrl + C
docker compose down
```

---

### 🔑 Credenciais de teste

| Perfil | Email | Senha | Acesso |
|--------|-------|-------|--------|
| Administrador | `admin@myparking.com` | `admin123` | Todas as telas |
| Operador | `operador@myparking.com` | `op123` | Entrada, Saída, Mensalistas, Vagas |

---

### ✅ Verificando se está tudo funcionando

Abra o **Thunder Client** no VS Code e teste:

**1. Health check:**
```
GET http://localhost:3000/health
```
Esperado: `{ "status": "ok", "service": "gateway" }`

**2. Login:**
```
POST http://localhost:3000/api/auth/login
Body JSON: { "email": "admin@myparking.com", "senha": "admin123" }
```
Esperado: objeto com `token` JWT.

**3. Vagas (rota protegida):**
```
GET http://localhost:3000/api/vagas
Header: Authorization: Bearer <token-do-passo-2>
```
Esperado: array com 20 vagas.

Se tudo retornou corretamente — **todos os microserviços estão funcionando!** ✅

---

## 7. Fluxo de trabalho Git

> Leia antes de começar a codar para não ter conflito com o outro dev.

### Estrutura de branches

```
main        ← código estável, aprovado em PR
  └── feature/<nome>   ← uma branch por funcionalidade
  └── fix/<nome>       ← correções de bug
```

### Fluxo para uma nova funcionalidade

```bash
# 1. Certifique que está atualizado com o main
git checkout main
git pull origin main

# 2. Crie sua branch
git checkout -b feature/entrada-veiculo

# 3. Trabalhe, faça commits pequenos e descritivos
git add .
git commit -m "feat: adicionar EntradaView com formulario de placa"

# 4. Quando terminar, mande para o GitHub
git push origin feature/entrada-veiculo

# 5. Abra um Pull Request no GitHub para o outro dev revisar
# → Acesse: https://github.com/MarcosViniciusDaSilvaZacchi/MY_SP
# → Clique em "Compare & pull request"
```

> ⚠️ **Nunca commite diretamente na `main`!** Sempre via Pull Request.

### Formato dos commits

```
feat: descrição de nova funcionalidade
fix: descrição da correção
docs: atualização de documentação
style: formatação, sem alteração de lógica
refactor: refatoração sem nova feature
test: adição de testes
```

---

## 8. Problemas comuns

### ❌ `npm install` deu erro de permissão (Windows)

Abra o PowerShell como **Administrador** e rode:
```powershell
Set-ExecutionPolicy RemoteSigned
```

---

### ❌ Porta já está em uso (`EADDRINUSE`)

Algum processo está usando a porta. Para descobrir e matar:

```powershell
# Descubra o PID (ex: porta 3000)
netstat -ano | findstr :3000

# Mate o processo pelo PID
taskkill /PID <numero-do-pid> /F
```

---

### ❌ Frontend não consegue conectar no Gateway (`Network Error`)

Verifique se o gateway está rodando (`npm run dev` no terminal do gateway).  
Verifique se o arquivo `frontend/.env.development` existe e contém:
```env
VITE_API_URL=http://localhost:3000/api
```
Reinicie o servidor do Vite após alterar o `.env`.

---

### ❌ `Cannot find module` ao rodar um serviço

As dependências não foram instaladas naquela pasta. Entre na pasta do serviço e rode:
```bash
npm install
```

---

### ❌ Docker: `permission denied` ou `port already allocated`

Pare todos os containers:
```bash
docker compose down
```
Se a porta estiver ocupada, feche o serviço que está usando localmente antes de subir o Docker.

---

*MY Service Parking — T2ESOFT05NB | Projeto e Arquitetura de Software | 2026*
