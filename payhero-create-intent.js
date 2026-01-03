// Proxy function to preserve legacy redirect: /api/payment/intent -> /.netlify/functions/payhero-create-intent
// Re-uses the stk-push handler implementation.
const stk = require('./stk-push');

exports.handler = async (event, context) => {
  return stk.handler(event, context);
};
