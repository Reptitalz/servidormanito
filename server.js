const { spawn } = require('child_process');
const path = require('path');

// The entrypoint for the Next.js standalone server is server.js inside .next/standalone
// We need to execute that file, not this one.
const nextServerPath = path.join(__dirname, 'server.js');

// Start the Next.js server process
const nextServer = spawn('node', [nextServerPath], {
  stdio: 'inherit',
  env: { ...process.env } // Pass environment variables
});

nextServer.on('close', (code) => {
  console.log(`Next.js server exited with code ${code}`);
  if (code !== 0) {
    process.exit(code); // Exit if Next.js server fails
  }
});

// Start the Baileys gateway process
const waGatewayPath = path.join(__dirname, 'whatsapp-gateway', 'index.js');
const waGateway = spawn('node', ['-r', 'dotenv/config', waGatewayPath], {
  stdio: 'inherit',
  env: { ...process.env } // Pass environment variables
});

waGateway.on('close', (code) => {
  console.log(`WhatsApp gateway exited with code ${code}`);
  if (code !== 0) {
    process.exit(code); // Exit if the gateway fails
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Caught interrupt signal, shutting down...');
  nextServer.kill('SIGINT');
  waGateway.kill('SIGINT');
  process.exit();
});

process.on('SIGTERM', () => {
  console.log('Caught terminate signal, shutting down...');
  nextServer.kill('SIGTERM');
  waGateway.kill('SIGTERM');
  process.exit();
});
