const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function checkUser() {
  const { data: users, error } = await supabase
    .from('jordyn_users')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  if (!users || users.length === 0) {
    console.log('No users found');
    process.exit(0);
  }

  const user = users[0];
  console.log('Latest user:');
  console.log('ID:', user.id);
  console.log('Name:', user.name);
  console.log('Email:', user.email);
  console.log('Phone (phone_number):', user.phone_number);
  console.log('Twilio Phone Number:', user.twilio_phone_number);
  console.log('Twilio Phone SID:', user.twilio_phone_number_sid);
  console.log('Twilio Messaging Service SID:', user.twilio_messaging_service_sid);
  console.log('Plan:', user.plan);
  console.log('Stripe Customer:', user.stripe_customer_id);
  console.log('Stripe Subscription:', user.stripe_subscription_id);
  console.log('Created:', user.created_at);
}

checkUser();
