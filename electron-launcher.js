// Launcher that spawns Electron with ELECTRON_RUN_AS_NODE unset.
// Some environments (VS Code terminals, CI) set this variable
// which prevents Electron from initializing its app lifecycle.
const { spawn } = require('child_process');
const electronPath = require('electron');

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronPath, ['.'], {
  stdio: 'inherit',
  env,
  cwd: __dirname,
});

child.on('close', (code) => process.exit(code));
