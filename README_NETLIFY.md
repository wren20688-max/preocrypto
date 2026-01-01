Netlify deployment notes
=======================

Quick steps to deploy PreoCrypto on Netlify with PayHero functions

1) Environment variables (Netlify site settings -> Build & deploy -> Environment):

- PAYHERO_SECRET_KEY  (your PayHero API key)
- PAYHERO_ACCOUNT_ID  (your PayHero account id)
- PAYHERO_CALLBACK_URL (e.g. https://<your-site>.netlify.app/.netlify/functions/webhook-payhero)

2) Files of interest

- netlify/functions/stk-push.js        -> STK push function (calls PayHero API)
- netlify/functions/create-payment.js -> Hosted payment creation
- netlify/functions/webhook-payhero.js -> Webhook receiver for PayHero
- netlify/functions/payhero-create-intent.js -> proxy (legacy redirect)
- netlify/functions/payhero-create-payment.js -> proxy (legacy redirect)

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
  curl -X POST https://<your-site>.netlify.app/.netlify/functions/stk-push \
    -H "Content-Type: application/json" \
    -d '{"phone":"0712345678","amount":100}'

6) Webhook

- In PayHero dashboard set callback/webhook URL to the `PAYHERO_CALLBACK_URL` you configured above.
