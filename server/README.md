# Porcelanas — Backend Email Server

This Node.js Express server handles Gmail email sending for the PDF order sheets.

## Current Status

The server runs in **stub mode** — it accepts requests but returns `not_configured` until you activate the Gmail credentials.

The frontend downloads the PDF locally regardless. Email sending is an optional enhancement.

---

## Activation Steps

### 1. Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project named "Porcelanas"
3. Enable the **Gmail API**: APIs & Services → Library → search "Gmail API" → Enable

### 2. Create OAuth2 Credentials

1. Go to APIs & Services → Credentials → Create Credentials → OAuth client ID
2. Application type: **Web application**
3. Authorized redirect URIs: `https://developers.google.com/oauthplayground`
4. Note your **Client ID** and **Client Secret**

### 3. Generate Refresh Token

1. Go to [OAuth Playground](https://developers.google.com/oauthplayground)
2. Click ⚙️ (Settings) → check "Use your own OAuth credentials"
3. Enter your Client ID and Secret
4. Scope: `https://mail.google.com/`
5. Authorize → Exchange auth code for tokens
6. Copy the **Refresh Token**

### 4. Configure Environment

Create `server/.env`:

```env
GMAIL_CLIENT_ID=your_client_id_here
GMAIL_CLIENT_SECRET=your_client_secret_here
GMAIL_REFRESH_TOKEN=your_refresh_token_here
GMAIL_SENDER=your_gmail@gmail.com
FRONTEND_URL=https://yoursite.com
PORT=3001
```

### 5. Install Backend Dependencies

```bash
cd server
npm init -y
npm install express cors nodemailer googleapis dotenv
```

### 6. Activate the Route

In `server/index.js`, uncomment the block between the activation comments and add at the top:
```js
import 'dotenv/config';
```

### 7. Run with PM2 on VPS

```bash
npm install -g pm2
pm2 start server/index.js --name porcelanas-backend
pm2 save
pm2 startup
```

---

## VPS Nginx Setup

See `nginx.conf.example` at the project root for the full Nginx configuration.

The key parts:
- Serve `frontend/dist/` as static files
- Proxy `/api/` to `localhost:3001`

---

## Security Notes

- Never commit `.env` to version control
- The `.gitignore` already excludes it
- Consider rate-limiting the `/api/send-email` endpoint in production
