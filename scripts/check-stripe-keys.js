require('dotenv').config({ path: '.env.local' });

const keys = [
  'STRIPE_SECRET_KEY',
  'STRIPE_SOLO_PRICE_ID',
  'STRIPE_FAMILY_PRICE_ID',
  'STRIPE_SOLO_VOICE_PRICE_ID',
  'STRIPE_FAMILY_VOICE_PRICE_ID',
  'STRIPE_BUSINESS_PRICE_ID',
  'STRIPE_TEST_PRICE_ID'
];

console.log('Checking Stripe configuration:\n');
keys.forEach(k => {
  const val = process.env[k];
  if (val) {
    console.log(`✓ ${k}: ${val.substring(0, 20)}...`);
  } else {
    console.log(`✗ ${k}: MISSING`);
  }
});
