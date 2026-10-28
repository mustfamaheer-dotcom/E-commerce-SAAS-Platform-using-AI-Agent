// scripts/run-backend.js
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const rootDir = path.resolve(__dirname, '..');

const candidates = [
  path.join(rootDir, '.venv', 'Scripts', 'python.exe'),
  path.join(rootDir, '.venv', 'bin', 'python'),
  process.env.PYTHON_PATH,
  'C:\\Users\\Adel Ahmed\\AppData\\Local\\Programs\\Python\\Python314\\python.exe',
  'python',
  'python3',
  'py',
].filter(Boolean);

let pythonExe = null;
for (const cand of candidates) {
  if (fs.existsSync(cand)) {
    pythonExe = cand;
    break;
  }
}

if (!pythonExe) {
  pythonExe = process.platform === 'win32' ? 'python' : 'python3';
}

console.log(`[backend] Starting FastAPI with Python: ${pythonExe}`);

const env = {
  ...process.env,
  PORT: process.env.PORT || '8001',
  PYTHONUNBUFFERED: '1',
  PYTHONPATH: process.env.PYTHONPATH ? `${rootDir};${process.env.PYTHONPATH}` : rootDir,
};

const child = spawn(
  pythonExe,
  [
    '-m',
    'uvicorn',
    'backend.main:app',
    '--host',
    '0.0.0.0',
    '--port',
    env.PORT,
    '--reload',
    '--reload-dir',
    path.join(rootDir, 'backend'),
  ],
  {
    cwd: rootDir,
    stdio: 'inherit',
    env,
  }
);

child.on('error', (err) => {
  console.error('[backend] Failed to start process:', err);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

process.on('SIGINT', () => {
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  child.kill('SIGTERM');
});
