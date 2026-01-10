// Payment Intent endpoint (alias for stk-push)
const stkPush = require('./stk-push');

exports.handler = async (event, context) => {
  return stkPush.handler(event, context);
};
