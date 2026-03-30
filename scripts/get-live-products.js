const Stripe = require('stripe');
require('dotenv').config({ path: '.env.local' });

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Error: STRIPE_SECRET_KEY not found in environment variables');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function getProducts() {
  try {
    console.log('Fetching all products and prices from Stripe LIVE mode...\n');

    // Get all products
    const products = await stripe.products.list({ limit: 100, active: true });

    // Get all prices
    const prices = await stripe.prices.list({ limit: 100, active: true });

    console.log('='.repeat(80));
    console.log('STRIPE LIVE PRODUCTS & PRICES');
    console.log('='.repeat(80));

    for (const product of products.data) {
      console.log(`\n📦 ${product.name}`);
      console.log(`   Product ID: ${product.id}`);
      console.log(`   Description: ${product.description || 'N/A'}`);

      // Find prices for this product
      const productPrices = prices.data.filter(p => p.product === product.id);

      if (productPrices.length > 0) {
        console.log(`   Prices:`);
        productPrices.forEach(price => {
          const amount = price.unit_amount ? `$${(price.unit_amount / 100).toFixed(2)}` : 'N/A';
          const interval = price.recurring ? `/${price.recurring.interval}` : '';
          console.log(`      - ${price.id}: ${amount}${interval}`);
        });
      } else {
        console.log(`   ⚠️  No active prices found`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('ENVIRONMENT VARIABLES TO UPDATE');
    console.log('='.repeat(80));
    console.log('\nCopy these to .env.local and Vercel:\n');

    // Try to match products to expected plan types
    const planMapping = {
      'solo': /jordyn.*solo(?!.*voice)/i,
      'family': /jordyn.*family(?!.*voice)/i,
      'solo_voice': /jordyn.*solo.*voice/i,
      'family_voice': /jordyn.*family.*voice/i,
      'business': /jordyn.*business/i,
      'test': /jordyn.*test/i,
    };

    const envVars = {};

    for (const [planKey, regex] of Object.entries(planMapping)) {
      const matchedProduct = products.data.find(p => regex.test(p.name));
      if (matchedProduct) {
        const productPrices = prices.data.filter(p => p.product === matchedProduct.id);
        if (productPrices.length > 0) {
          const priceId = productPrices[0].id;
          const varName = `STRIPE_${planKey.toUpperCase()}_PRICE_ID`;
          envVars[varName] = priceId;
          console.log(`${varName}=${priceId}`);
        }
      }
    }

    if (Object.keys(envVars).length === 0) {
      console.log('\n⚠️  Could not auto-match products. Please manually map the price IDs above.');
    }

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('Error fetching products:', error.message);
    process.exit(1);
  }
}

getProducts();
