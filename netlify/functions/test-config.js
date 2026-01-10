// Test endpoint to check PayHero configuration
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const config = {
    hasBasicAuth: !!process.env.PAYHERO_BASIC_AUTH,
    hasSecretKey: !!process.env.PAYHERO_SECRET_KEY,
    hasAccountId: !!process.env.PAYHERO_ACCOUNT_ID,
    hasCallbackUrl: !!process.env.PAYHERO_CALLBACK_URL,
    callbackUrl: process.env.PAYHERO_CALLBACK_URL || 'NOT SET (using default: https://www.preocrypto.com/webhook/mpesa-callback)',
    accountIdPreview: process.env.PAYHERO_ACCOUNT_ID ? `${process.env.PAYHERO_ACCOUNT_ID.substring(0, 4)}...` : 'NOT SET',
    nodeVersion: process.version,
    allEnvVarsSet: !!(process.env.PAYHERO_BASIC_AUTH || process.env.PAYHERO_SECRET_KEY) && !!process.env.PAYHERO_ACCOUNT_ID
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      message: config.allEnvVarsSet ? '✅ PayHero is configured' : '❌ PayHero is NOT configured - missing environment variables',
      config,
      instructions: !config.allEnvVarsSet ? {
        step1: 'Go to Netlify Dashboard → Site Settings → Environment Variables',
        step2: 'Add these required variables:',
        required: [
          'PAYHERO_BASIC_AUTH or PAYHERO_SECRET_KEY',
          'PAYHERO_ACCOUNT_ID',
          'PAYHERO_CALLBACK_URL (optional, defaults to https://www.preocrypto.com/webhook/mpesa-callback)'
        ],
        step3: 'Redeploy your site or trigger a new build'
      } : null
    }, null, 2)
  };
};
