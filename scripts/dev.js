const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

let tscProcess = null;
let viteProcess = null;
let electronProcess = null;

function cleanup() {
  console.log('\nCleaning up processes...');
  if (tscProcess) tscProcess.kill();
  if (viteProcess) viteProcess.kill();
  if (electronProcess) electronProcess.kill();
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

console.log('Starting compilation & dev server...');

// 1. Spawn tsc in watch mode
tscProcess = spawn('npx', ['tsc', '-p', 'tsconfig.main.json', '--watch'], { 
  shell: true,
  stdio: 'inherit' 
});

// 2. Spawn vite dev server
viteProcess = spawn('npx', ['vite'], { 
  shell: true,
  stdio: 'pipe' // Capture output to read server url if needed
});

viteProcess.stdout.on('data', (data) => {
  const str = data.toString();
  if (str.trim()) {
    console.log(`[Vite] ${str.trim()}`);
  }
});
viteProcess.stderr.on('data', (data) => {
  console.error(`[Vite Error] ${data.toString()}`);
});

// 3. Poll http://localhost:5173 until ready
function checkViteReady() {
  http.get('http://localhost:5173', (res) => {
    console.log('Vite server is ready! Launching Electron...');
    launchElectron();
  }).on('error', () => {
    setTimeout(checkViteReady, 300);
  });
}

function launchElectron() {
  electronProcess = spawn('npx', ['electron', '.'], { 
    shell: true,
    stdio: 'inherit' 
  });

  electronProcess.on('close', (code) => {
    console.log(`Electron closed with code ${code}`);
    cleanup();
  });
}

// Start checking Vite
checkViteReady();
