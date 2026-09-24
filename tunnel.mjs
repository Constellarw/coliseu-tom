import { startTunnel } from 'untun';

async function main() {
  console.log('Iniciando Cloudflare Tunnel para http://localhost:3001...');
  try {
    const tunnel = await startTunnel({
      port: 3001,
      acceptCloudflareNotice: true,
    });
    const url = await tunnel.getURL();
    console.log('==================================================');
    console.log('CLOUDFLARE_TUNNEL_URL:', url);
    console.log('==================================================');
  } catch (err) {
    console.error('Erro ao iniciar túnel:', err);
    process.exit(1);
  }
}

main();
