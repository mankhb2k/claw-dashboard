#!/usr/bin/env node
/**
 * Standalone onboard server
 * Chạy UI onboarding + handle CLI calls với đúng cách cho Windows
 * Sau setup xong, tự động start gateway
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import os from 'os';

// Load .env file if exists
function loadEnv() {
  const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=');
        if (key && value && !process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '18788', 10);
const GATEWAY_PORT = parseInt(process.env.GATEWAY_PORT || '18789', 10);
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || 'dev-openclaw-token-18789';
const PUBLIC_DIR = path.join(__dirname, 'public');
const ONBOARD_DIR = path.join(PUBLIC_DIR, 'onboard');

// Find openclaw CLI path
function findOpenclawCli() {
  const localPath = path.join(__dirname, 'node_modules', 'openclaw', 'openclaw.mjs');
  if (fs.existsSync(localPath)) {
    return localPath;
  }

  // Fallback to global or PATH
  return 'openclaw';
}

/**
 * Serve static file
 */
function serveFile(filePath, res) {
  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'File not found' }));
    return;
  }

  const content = fs.readFileSync(filePath);
  const ext = path.extname(filePath);
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
  };

  res.writeHead(200, {
    'Content-Type': mimeTypes[ext] || 'text/plain',
  });
  res.end(content);
}

/**
 * Run OpenClaw onboard CLI
 */
function runOnboardCli(params) {
  return new Promise((resolve) => {
    const args = [
      'onboard',
      '--non-interactive',
      '--accept-risk',
      '--mode',
      'local',
      '--flow',
      'quickstart',
      '--skip-ui',
      '--skip-daemon',    // Don't install daemon service
      '--skip-health',    // Don't wait for gateway health check
    ];

    if (params.kind === 'api') {
      args.push('--auth-choice', 'apiKey');

      if (params.provider === 'anthropic') {
        args.push('--anthropic-api-key', params.apiKey);
      } else if (params.provider === 'gemini') {
        args.push('--auth-choice', 'gemini-api-key', '--gemini-api-key', params.apiKey);
      } else if (params.provider === 'openai') {
        args.push('--auth-choice', 'openai-api-key', '--openai-api-key', params.apiKey);
      }
    } else if (params.kind === 'ollama') {
      args.push('--auth-choice', 'ollama', '--custom-model-id', params.ollamaModelId);
    }

    let output = '';
    const env = { ...process.env };
    const cliPath = findOpenclawCli();

    // Determine how to spawn based on CLI path
    let command = cliPath;
    let spawnArgs = args;

    if (cliPath.endsWith('.mjs')) {
      // If it's a .mjs file, use node
      command = process.execPath;
      spawnArgs = [cliPath, ...args];
    }

    const child = spawn(command, spawnArgs, {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      env,
    });

    child.stdout?.on('data', (data) => {
      output += data.toString();
    });

    child.stderr?.on('data', (data) => {
      output += data.toString();
    });

    child.on('error', (err) => {
      resolve({
        ok: false,
        message: `Error: ${err.message}`,
        output,
      });
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({
          ok: true,
          message: 'Thiết lập thành công! Đang khởi động gateway...',
          output,
        });
      } else {
        resolve({
          ok: false,
          message: output || `Exit code: ${code}`,
          output,
        });
      }
    });
  });
}

/**
 * Start gateway server
 */
function startGateway() {
  const cliPath = findOpenclawCli();
  const args = [
    'gateway',
    'run',
    '--bind',
    'loopback',
    '--port',
    String(GATEWAY_PORT),
  ];

  let command = cliPath;
  let spawnArgs = args;

  if (cliPath.endsWith('.mjs')) {
    command = process.execPath;
    spawnArgs = [cliPath, ...args];
  }

  console.log(`\n🚀 Khởi động gateway trên port ${GATEWAY_PORT}...\n`);

  const child = spawn(command, spawnArgs, {
    stdio: 'inherit',
    windowsHide: false,
  });

  child.on('error', (err) => {
    console.error(`❌ Lỗi khởi động gateway: ${err.message}`);
  });

  // Don't exit parent process
  child.unref();
}

/**
 * Create marker file to indicate onboarding is done
 */
function markOnboardingDone() {
  const home = process.env.HOME || process.env.USERPROFILE || os.homedir();
  const markerFile = path.join(home, '.openclaw', '.onboard-completed');
  const dir = path.dirname(markerFile);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(markerFile, new Date().toISOString());
}

/**
 * HTTP Server
 */
const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // GET /
  if (req.method === 'GET' && req.url === '/') {
    serveFile(path.join(ONBOARD_DIR, 'index.html'), res);
    return;
  }

  // GET /style.css, /script.js, etc
  if (req.method === 'GET' && req.url.startsWith('/')) {
    const filePath = path.join(ONBOARD_DIR, req.url);
    // Prevent path traversal
    if (filePath.startsWith(ONBOARD_DIR)) {
      serveFile(filePath, res);
      return;
    }
  }

  // POST /api/onboard/run
  if (req.method === 'POST' && req.url === '/api/onboard/run') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const params = JSON.parse(body);
        const result = await runOnboardCli(params);

        if (result.ok) {
          markOnboardingDone();
          // Start gateway automatically in the background
          setTimeout(() => {
            startGateway();
          }, 1000);
        }

        res.writeHead(result.ok ? 200 : 400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, message: e.message }));
      }
    });
    return;
  }

  // POST /api/onboard/skip
  if (req.method === 'POST' && req.url === '/api/onboard/skip') {
    markOnboardingDone();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  🦞 OpenClaw Onboard Server                                  ║
╚══════════════════════════════════════════════════════════════╝

📍 Bước 1: Mở trình duyệt
   → http://localhost:${PORT}

📋 Bước 2: Điền thông tin
   • API key (Anthropic/Gemini/OpenAI), hoặc
   • Ollama (DeepSeek-R1 cục bộ)

✅ Bước 3: Nhấn "Chạy thiết lập"
   • Onboard sẽ chạy tự động
   • Gateway sẽ khởi động ở port ${GATEWAY_PORT}
   • Tự động redirect đến dashboard

💡 Tips:
   • Không cần chạy lệnh thêm
   • Gateway sẽ start tự động sau onboard
   • Đóng cửa sổ này sẽ dừng gateway

Ctrl+C để thoát.
  `);
});

// Check if openclaw CLI is available on startup
const cliPath = findOpenclawCli();
if (!fs.existsSync(cliPath) && cliPath !== 'openclaw') {
  console.error(`
⚠️  Cảnh báo: Không tìm thấy OpenClaw CLI

Đường dẫn tìm kiếm: ${cliPath}

💡 Giải pháp:
   1. Chạy: npm install
   2. Kiểm tra node_modules/openclaw tồn tại
   3. Hoặc install global: npm install -g openclaw
  `);
}

process.on('SIGINT', () => {
  console.log('\n👋 Tạm biệt!');
  process.exit(0);
});
