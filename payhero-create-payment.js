// Proxy function to preserve legacy redirect names: use create-payment implementation
const cp = require('./create-payment');

exports.handler = async (event, context) => {
  return cp.handler(event, context);
};
