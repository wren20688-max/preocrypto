const { getUserByEmail, updateUser, createTransaction } = require('./db-supabase');

exports.handler = async (event) => {
  // PayHero webhook - update user balance when payment succeeds
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const body = event.body || '';
    const headers = event.headers || {};
    console.log('[PayHero Webhook] headers:', headers);
    console.log('[PayHero Webhook] body:', body);

    // Parse webhook data
    const data = JSON.parse(body);
    console.log('[PayHero Webhook] parsed data:', data);

    // Check if payment was successful
    if (data.status === 'completed' || data.status === 'success' || data.state === 'completed') {
      const amount = parseFloat(data.amount || 0);
      const email = data.customer?.email || data.metadata?.user_email;
      
      if (email && amount > 0) {
        console.log(`[PayHero Webhook] Processing payment for ${email}: ${amount}`);
        
        // Get user from database
        const user = await getUserByEmail(email);
        
        if (user) {
          // Convert KES to USD (approximately)
          const amountUSD = amount / 150; // 1 USD = 150 KES
          
          // Update user's real balance
          const newBalance = (parseFloat(user.real_balance || 0) + amountUSD);
          const totalDeposits = (parseFloat(user.total_deposits || 0) + amount);
          
          await updateUser(user.email, {
            real_balance: newBalance,
            total_deposits: totalDeposits
          });
          
          // Create transaction record
          await createTransaction({
            user_id: user.id,
            type: 'deposit',
            amount: amountUSD,
            account_type: 'real',
            status: 'completed',
            payment_method: 'mpesa',
            reference: data.transaction_id || data.reference || data.id,
            metadata: data
          });
          
          console.log(`[PayHero Webhook] Updated ${email} balance: +${amountUSD} USD (${amount} KES)`);
        } else {
          console.log(`[PayHero Webhook] User not found: ${email}`);
        }
      }
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('Webhook handler error', err);
    return { statusCode: 500, body: JSON.stringify({ success: false, error: err.message }) };
  }
};
