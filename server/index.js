/**
 * Porcelanas — Backend Email Server (Stub)
 * 
 * This server is NOT required for the frontend to work.
 * It's a stub ready to be activated when you want Gmail sending.
 * 
 * See README.md for activation steps.
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: '10mb' }));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', email: 'not_configured' });
});

// Email endpoint (stub — returns not_configured until credentials are set)
app.post('/api/send-email', async (req, res) => {
  const { recipientEmail, pdfBase64, itemCount } = req.body;

  if (!recipientEmail || !pdfBase64) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // ─────────────────────────────────────────────────────────────
  // TO ACTIVATE: uncomment the block below after following README.md
  // ─────────────────────────────────────────────────────────────
  //
  // const { google } = await import('googleapis');
  // const nodemailer = await import('nodemailer');
  //
  // const oauth2Client = new google.auth.OAuth2(
  //   process.env.GMAIL_CLIENT_ID,
  //   process.env.GMAIL_CLIENT_SECRET,
  //   'https://developers.google.com/oauthplayground'
  // );
  // oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
  // const { token } = await oauth2Client.getAccessToken();
  //
  // const transporter = nodemailer.createTransport({
  //   service: 'gmail',
  //   auth: {
  //     type: 'OAuth2',
  //     user: process.env.GMAIL_SENDER,
  //     clientId: process.env.GMAIL_CLIENT_ID,
  //     clientSecret: process.env.GMAIL_CLIENT_SECRET,
  //     refreshToken: process.env.GMAIL_REFRESH_TOKEN,
  //     accessToken: token,
  //   },
  // });
  //
  // await transporter.sendMail({
  //   from: `"Porcelanas" <${process.env.GMAIL_SENDER}>`,
  //   to: recipientEmail,
  //   subject: `Tu pedido de Porcelanas — ${itemCount} ítem(s)`,
  //   html: `<p>Adjunto encontrás tu pedido de <strong>${itemCount}</strong> piezas.</p>`,
  //   attachments: [{
  //     filename: 'pedido-porcelanas.pdf',
  //     content: Buffer.from(pdfBase64, 'base64'),
  //     contentType: 'application/pdf',
  //   }],
  // });
  //
  // return res.json({ status: 'sent' });
  // ─────────────────────────────────────────────────────────────

  console.log(`[stub] Would send PDF to ${recipientEmail} (${itemCount} items)`);
  return res.json({
    status: 'not_configured',
    message: 'Email backend not yet activated. See server/README.md',
  });
});

app.listen(PORT, () => {
  console.log(`Porcelanas backend running on http://localhost:${PORT}`);
});
