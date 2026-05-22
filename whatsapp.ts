import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';
import qrcode from 'qrcode';

export let sock: ReturnType<typeof makeWASocket> | null = null;
export let qrCodeDataURL: string | null = null;
export let botStatus = 'Disconnected';

export const startWhatsAppBot = async () => {
  const sessionDir = path.resolve(process.cwd(), 'wa-session');
  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      qrCodeDataURL = await qrcode.toDataURL(qr);
      botStatus = 'Scan QR Code';
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
      botStatus = 'Disconnected';
      qrCodeDataURL = null;
      if (shouldReconnect) {
         startWhatsAppBot();
      } else {
         fs.rmSync(sessionDir, { recursive: true, force: true });
      }
    } else if (connection === 'open') {
      botStatus = 'Connected';
      qrCodeDataURL = null;
    }
  });

  return sock;
};

export const disconnectWhatsAppBot = () => {
    if(sock) {
        sock.logout();
        sock = null;
    }
}
