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

### 🖥️ Modo Manual — 3 Terminais (desenvolvimento do dia a dia)

Abra **3 terminais separados** no VS Code (`Ctrl + Shift + `` ` ```) e rode cada comando em um:

**Terminal 1 — Auth Service:**
```bash
cd services/auth-service
npm run dev
```
> Deve aparecer: `[Auth Service] Rodando na porta 3001`

**Terminal 2 — API Gateway:**
```bash
cd gateway
npm run dev
```
> Deve aparecer: `[Gateway] Rodando na porta 3000`

**Terminal 3 — Frontend:**
```bash
cd frontend
npm run dev
```
> Deve aparecer algo como: `VITE v6.x.x ready in xxx ms` e a URL `http://localhost:5173`

Abra o navegador em **http://localhost:5173**

**Credenciais de teste:**

| Perfil | Email | Senha |
|--------|-------|-------|
| Administrador | `admin@myparking.com` | `admin123` |
| Operador | `operador@myparking.com` | `op123` |

---

### 🐳 Modo Docker — Tudo de uma vez

> Certifique-se que o **Docker Desktop está aberto e rodando**.

Na raiz do projeto:

```bash
docker compose up --build
```

Aguarde o build (pode demorar ~2 min na primeira vez). Quando aparecer que todos os serviços subiram:

| Serviço | Endereço |
|---------|----------|
| 🖥️ Frontend | http://localhost |
| 🔀 Gateway | http://localhost:3000 |
| 🔐 auth-service | http://localhost:3001 |
| 🚗 estacionamento-service | http://localhost:3002 |
| 👤 mensalista-service | http://localhost:3003 |
| 💳 pagamento-service | http://localhost:3004 |
| 🅿️ vaga-service | http://localhost:3005 |

Para parar:
```bash
Ctrl + C
docker compose down
```

---

### ✅ Verificando se está tudo funcionando

Abra o **Thunder Client** (ou qualquer navegador) e teste:

```
GET http://localhost:3000/health
```

Deve retornar:
```json
{ "status": "ok", "service": "gateway" }
```

```
POST http://localhost:3000/api/auth/login
Body: { "email": "admin@myparking.com", "senha": "admin123" }
```

Deve retornar um `token` JWT. Se retornou — **tudo funcionando!** ✅

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
