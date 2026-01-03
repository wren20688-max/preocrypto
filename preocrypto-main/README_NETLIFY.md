Netlify deployment notes
=======================

Quick steps to deploy PreoCrypto on Netlify with PayHero functions

1) Environment variables (Netlify site settings -> Build & deploy -> Environment):

-- PAYHERO_CALLBACK_URL (e.g. https://<your-site>.netlify.app/webhook/mpesa-callback)
-- WEBHOOK_FORWARD_URL (optional) - where the Netlify function should forward webhooks to your main server (e.g. https://<your-site>.netlify.app/webhook/payhero)
-- FORWARD_WEBHOOK_TO_SERVER (optional) - set to `1` to enable forwarding from Netlify function to your server
-- UPDATE_DB_ON_WEBHOOK (dev only) - set to `1` to append transactions to `db.json` when running locally
-- SAVE_WEBHOOKS (dev only) - set to `1` to save raw webhook payloads to `webhook_received_logs.json`

2) Files of interest

- netlify/functions/stk-push.js        -> STK push function (calls PayHero API)
- netlify/functions/create-payment.js -> Hosted payment creation
-- netlify/functions/mpesa-callback.js -> Webhook receiver for PayHero (recommended)
- netlify/functions/payhero-create-intent.js -> proxy (legacy redirect)
- netlify/functions/payhero-create-payment.js -> proxy (legacy redirect)

# create a .env file with PAYHERO_* vars or use netlify env:set
# For local testing you may enable webhook forwarding and DB updates in .env:
#   FORWARD_WEBHOOK_TO_SERVER=1
#   WEBHOOK_FORWARD_URL=https://<your-site>.netlify.app/webhook/payhero
#   UPDATE_DB_ON_WEBHOOK=1
#   SAVE_WEBHOOKS=1
3) Local development with Netlify Dev

Install Netlify CLI and run dev mode (recommended):

```bash
npm install -g netlify-cli
# from repository root
# create a .env file with PAYHERO_* vars or use netlify env:set
netlify dev
```

Netlify Dev serves both static site and functions on a single origin (default http://localhost:8888), avoiding the 405/errors from static servers.

4) Deploy

- Push to your git repo and let Netlify build & deploy, or connect the repo via the Netlify dashboard.

5) Testing

- STK push (test):
  curl -X POST https://<your-site>.netlify.app/api/payment/intent \
    -H "Content-Type: application/json" \
    -d '{"phone":"0712345678","amount":100}'

6) Webhook

- In PayHero dashboard set callback/webhook URL to the `PAYHERO_CALLBACK_URL` you configured above.
