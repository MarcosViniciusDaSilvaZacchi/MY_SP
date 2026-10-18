#!/usr/bin/env node
/**
 * Orquestrador Centralizado — MY Service Parking
 * Inicia todos os 5 microserviços, o API Gateway e o Frontend Vue.js
 * em um ÚNICO terminal/prompt, com logs coloridos e encerramento limpo.
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const args = process.argv.slice(2);
const installOnly = args.includes('--install-only');
const noKillPorts = args.includes('--no-kill-ports');

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  brightCyan: '\x1b[96m',
  brightGreen: '\x1b[92m',
};

const SERVICOS = [
  {
    name: 'AUTH :3001',
    dir: 'services/auth-service',
    entry: 'src/app.js',
    port: 3001,
    color: COLORS.cyan,
    env: { PORT: '3001', JWT_SECRET: 'my-parking-secret', JWT_EXPIRES_IN: '8h' },
  },
  {
    name: 'ESTAC :3002',
    dir: 'services/estacionamento-service',
    entry: 'src/app.js',
    port: 3002,
    color: COLORS.green,
    env: {
      PORT: '3002',
      MENSALISTA_SERVICE_URL: 'http://localhost:3003',
      PAGAMENTO_SERVICE_URL: 'http://localhost:3004',
    },
  },
  {
    name: 'MENSAL :3003',
    dir: 'services/mensalista-service',
    entry: 'src/app.js',
    port: 3003,
    color: COLORS.magenta,
    env: { PORT: '3003' },
  },
  {
    name: 'PAGAM :3004',
    dir: 'services/pagamento-service',
    entry: 'src/app.js',
    port: 3004,
    color: COLORS.yellow,
    env: {
      PORT: '3004',
      PIX_CHAVE: '4654f72d-b238-462d-b863-35d0c67640b6',
      PIX_BENEFICIARIO: 'Yan Carlos Farias',
      PIX_CIDADE: 'SAO PAULO',
    },
  },
  {
    name: 'VAGA :3005',
    dir: 'services/vaga-service',
    entry: 'src/app.js',
    port: 3005,
    color: COLORS.blue,
    env: { PORT: '3005' },
  },
  {
    name: 'GATEWAY :3000',
    dir: 'gateway',
    entry: 'src/app.js',
    port: 3000,
    color: COLORS.brightCyan,
    env: {
      PORT: '3000',
      JWT_SECRET: 'my-parking-secret',
      FRONTEND_URL: 'http://localhost:5173',
      AUTH_SERVICE_URL: 'http://localhost:3001',
      ESTACIONAMENTO_SERVICE_URL: 'http://localhost:3002',
      MENSALISTA_SERVICE_URL: 'http://localhost:3003',
      PAGAMENTO_SERVICE_URL: 'http://localhost:3004',
      VAGA_SERVICE_URL: 'http://localhost:3005',
    },
  },
  {
    name: 'FRONTEND :5173',
    dir: 'frontend',
    entry: 'node_modules/vite/bin/vite.js',
    args: ['--port', '5173', '--host'],
    port: 5173,
    color: COLORS.brightGreen,
    env: { VITE_API_URL: 'http://localhost:3000/api' },
  },
];

function banner() {
  console.log(`${COLORS.brightCyan}============================================================${COLORS.reset}`);
  console.log(`${COLORS.bold}${COLORS.brightCyan}   🅿️  MY Service Parking — Inicializador Centralizado${COLORS.reset}`);
  console.log(`${COLORS.brightCyan}============================================================${COLORS.reset}`);
}

function garantirArquivosEnv() {
  for (const s of SERVICOS) {
    const dirPath = path.join(ROOT, s.dir);
    const envPath = path.join(dirPath, '.env');
    const envExamplePath = path.join(dirPath, '.env.example');
    if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
    }
  }
}

function garantirDependencias() {
  const faltando = SERVICOS.filter((s) => {
    const nm = path.join(ROOT, s.dir, 'node_modules');
    return !fs.existsSync(nm);
  });

  if (faltando.length === 0) {
    return;
  }

  console.log(
    `\n${COLORS.yellow}📦 Instalando dependências ausentes em ${faltando.length} pacote(s)...${COLORS.reset}\n`
  );

  for (const s of faltando) {
    const dirPath = path.join(ROOT, s.dir);
    console.log(`${s.color}[${s.name}]${COLORS.reset} Instalando pacotes em ${s.dir}...`);
    execSync('npm install --no-audit --no-fund', {
      cwd: dirPath,
      stdio: 'inherit',
      windowsHide: true,
    });
  }

  console.log(`\n${COLORS.green}✅ Todas as dependências foram instaladas com sucesso!${COLORS.reset}\n`);
}

function liberarPortasEmUso() {
  if (noKillPorts || process.platform !== 'win32') return;
  const ports = SERVICOS.map((s) => s.port);
  for (const port of ports) {
    try {
      const out = execSync(`netstat -ano | findstr :${port}`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        windowsHide: true,
      });
      const lines = out.split(/\r?\n/).filter(Boolean);
      const pids = new Set();
      for (const line of lines) {
        if (line.includes('LISTENING')) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && Number(pid) > 0 && Number(pid) !== process.pid) {
            pids.add(pid);
          }
        }
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore', windowsHide: true });
        } catch {
          // ignora se já encerrou
        }
      }
    } catch {
      // porta livre
    }
  }
}

const processosAtivos = [];
let encerrando = false;

function prefixStream(stream, prefix, color) {
  let buffer = '';
  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (line.trim() !== '') {
        console.log(`${color}[${prefix.padEnd(14)}]${COLORS.reset} ${line}`);
      }
    }
  });
  stream.on('end', () => {
    if (buffer.trim() !== '') {
      console.log(`${color}[${prefix.padEnd(14)}]${COLORS.reset} ${buffer}`);
    }
  });
}

function encerrarTodos() {
  if (encerrando) return;
  encerrando = true;
  console.log(`\n${COLORS.yellow}🛑 Encerrando todos os serviços do MY Service Parking...${COLORS.reset}`);

  for (const proc of processosAtivos) {
    if (!proc || proc.killed) continue;
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /PID ${proc.pid} /T /F`, { stdio: 'ignore', windowsHide: true });
      } else {
        proc.kill('SIGTERM');
      }
    } catch {
      // processo já finalizado
    }
  }

  console.log(`${COLORS.green}✅ Todos os serviços foram encerrados.${COLORS.reset}`);
  process.exit(0);
}

process.on('SIGINT', encerrarTodos);
process.on('SIGTERM', encerrarTodos);

function iniciarTodos() {
  banner();
  garantirArquivosEnv();
  garantirDependencias();

  if (installOnly) {
    process.exit(0);
  }

  liberarPortasEmUso();

  console.log(`${COLORS.dim}Iniciando todos os serviços neste mesmo terminal...${COLORS.reset}\n`);

  for (const s of SERVICOS) {
    const cwd = path.join(ROOT, s.dir);
    const scriptPath = path.join(cwd, s.entry);
    const spawnArgs = [scriptPath, ...(s.args || [])];

    const child = spawn(process.execPath, spawnArgs, {
      cwd,
      env: { ...process.env, ...s.env },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    processosAtivos.push(child);
    prefixStream(child.stdout, s.name, s.color);
    prefixStream(child.stderr, s.name, s.color);

    child.on('exit', (code) => {
      if (!encerrando && code !== 0 && code !== null) {
        console.log(
          `${COLORS.red}[${s.name.padEnd(14)}] Processo encerrou com código ${code}${COLORS.reset}`
        );
      }
    });
  }

  setTimeout(() => {
    if (!encerrando) {
      console.log(`\n${COLORS.brightGreen}============================================================${COLORS.reset}`);
      console.log(`${COLORS.bold}${COLORS.brightGreen}  ✅ Todos os 7 serviços estão ativos neste terminal!${COLORS.reset}`);
      console.log(`${COLORS.brightGreen}  🌐 Front-end SPA:  http://localhost:5173${COLORS.reset}`);
      console.log(`${COLORS.brightCyan}  🔀 API Gateway:    http://localhost:3000${COLORS.reset}`);
      console.log(`${COLORS.yellow}  🔑 Login Admin:    admin@myparking.com / admin123${COLORS.reset}`);
      console.log(`${COLORS.yellow}  🔑 Login Operador: operador@myparking.com / op123${COLORS.reset}`);
      console.log(`${COLORS.dim}  (Pressione Ctrl+C a qualquer momento para parar tudo)${COLORS.reset}`);
      console.log(`${COLORS.brightGreen}============================================================${COLORS.reset}\n`);
    }
  }, 2500);
}

iniciarTodos();

