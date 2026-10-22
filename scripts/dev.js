// scripts/dev.js
const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

console.log('🚀 Starting TechZone Platform (Frontend + Backend)...');

// 1. Start Backend
const backend = spawn('node', [path.join(__dirname, 'run-backend.js')], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
});

// 2. Start Frontend (Vite)
const frontend = spawn('npm', ['--prefix', 'apps/web', 'run', 'dev'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
});

const cleanup = () => {
  console.log('\n🛑 Shutting down development services...');
  try {
    backend.kill();
  } catch {}
  try {
    frontend.kill();
  } catch {}
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

backend.on('error', (err) => console.error('[backend error]', err));
frontend.on('error', (err) => console.error('[frontend error]', err));
