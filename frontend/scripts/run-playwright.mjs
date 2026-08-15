import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const frontend = process.cwd();
const backend = path.resolve(frontend, '..', 'backend');
const children = [];
const fixturePath = path.join(frontend, 'test-results', 'e2e-fixture.json');

const envText = fs.readFileSync(path.join(backend, '.env'), 'utf8');
const envValue = (key) => envText.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1]?.trim().replace(/^['"]|['"]$/g, '');
const sourceMongoUri = envValue('MONGODB_URI');
if (!sourceMongoUri) throw new Error('MONGODB_URI is required in backend/.env.');
const mongoUrl = new URL(sourceMongoUri);
mongoUrl.pathname = '/national_training_week_e2e';
const e2eMongoUri = mongoUrl.toString();
const e2eEnv = {
  ...process.env,
  NODE_ENV: 'test',
  PORT: '5127',
  BACKEND_URL: 'http://127.0.0.1:5127',
  VITE_API_TARGET: 'http://127.0.0.1:5127',
  E2E_API_URL: 'http://127.0.0.1:5127',
  E2E_FRONTEND_URL: 'http://127.0.0.1:5187',
  MONGODB_URI: e2eMongoUri,
  EMAIL_DELIVERY_MODE: 'disabled',
  CERTIFICATE_WORKER_POLL_MS: '500',
  CERTIFICATE_RETRY_DELAY_MS: '5000',
  JWT_SECRET: 'isolated-e2e-jwt-secret-never-use-in-production-2026',
  E2E_FIXTURE_PATH: fixturePath,
};

const start = (command, args, options) => {
  const child = spawn(command, args, { stdio: 'inherit', windowsHide: true, ...options });
  children.push(child);
  return child;
};

const waitForUrl = async (url, timeoutMs = 30_000) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Timed out waiting for ${url}`);
};

const run = (command, args, options) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { stdio: 'inherit', windowsHide: true, ...options });
  child.once('error', reject);
  child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`${args.join(' ')} exited with code ${code}`)));
});

const stopTree = (child) => new Promise((resolve) => {
  if (!child?.pid || child.exitCode !== null) return resolve();
  const killer = spawn('taskkill.exe', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
  const fallback = setTimeout(resolve, 5_000);
  fallback.unref();
  const done = () => { clearTimeout(fallback); resolve(); };
  killer.once('exit', done);
  killer.once('error', done);
});

let exitCode = 1;
try {
  await run(process.execPath, ['test/e2e/database.mjs', 'setup'], { cwd: backend, env: e2eEnv });
  start(process.execPath, ['src/server.js'], {
    cwd: backend,
    env: e2eEnv,
  });
  start(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5187'], {
    cwd: frontend,
    env: e2eEnv,
  });
  await Promise.all([
    waitForUrl('http://127.0.0.1:5127/api/health'),
    waitForUrl('http://127.0.0.1:5187'),
  ]);
  await run(process.execPath, ['test/e2e/database.mjs', 'verify'], { cwd: backend, env: e2eEnv });

  const playwright = spawn(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', ...process.argv.slice(2)], {
    cwd: frontend,
    stdio: 'inherit',
    windowsHide: true,
    env: { ...e2eEnv, E2E_EXTERNAL_SERVERS: 'true' },
  });
  exitCode = await new Promise((resolve) => playwright.once('exit', (code) => resolve(code ?? 1)));
} catch (error) {
  console.error(error.message);
} finally {
  await Promise.all(children.map(stopTree));
  await run(process.execPath, ['test/e2e/database.mjs', 'cleanup'], { cwd: backend, env: e2eEnv }).catch((error) => {
    console.error(`E2E cleanup failed: ${error.message}`);
    exitCode = 1;
  });
  fs.rmSync(fixturePath, { force: true });
}

process.exit(exitCode);
