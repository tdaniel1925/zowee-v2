/**
 * Setup Stripe Products and Prices
 * Creates new products and updates existing ones with new pricing
 */

require('dotenv').config({ path: '.env.local' })
const Stripe = require('stripe')

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

async function setupStripeProducts() {
  console.log('🔧 Setting up Stripe products...\n')

  try {
    // 1. Update existing Solo product price
    console.log('1️⃣  Updating Solo plan to $19/month...')
    const soloPrice = await stripe.prices.create({
      product: process.env.STRIPE_SOLO_PRICE_ID.split('_')[1] // Extract product ID from price ID
        ? await getProductFromPrice(process.env.STRIPE_SOLO_PRICE_ID)
        : 'prod_SOLO',
      unit_amount: 1900, // $19.00
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    })
    console.log(`   ✅ Solo price created: ${soloPrice.id}\n`)

    // 2. Update existing Family product price
    console.log('2️⃣  Updating Family plan to $34/month...')
    const familyPrice = await stripe.prices.create({
      product: process.env.STRIPE_FAMILY_PRICE_ID
        ? await getProductFromPrice(process.env.STRIPE_FAMILY_PRICE_ID)
        : 'prod_FAMILY',
      unit_amount: 3400, // $34.00
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    })
    console.log(`   ✅ Family price created: ${familyPrice.id}\n`)

    // 3. Create Solo + Voice product
    console.log('3️⃣  Creating Solo + Voice plan ($39/month)...')
    const soloVoiceProduct = await stripe.products.create({
      name: 'Pokkit Solo + Voice',
      description: '100 voice minutes per month + SMS assistant',
      metadata: {
        plan: 'solo_voice',
        voice_minutes: '100',
      },
    })
    const soloVoicePrice = await stripe.prices.create({
      product: soloVoiceProduct.id,
      unit_amount: 3900, // $39.00
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    })
    console.log(`   ✅ Product: ${soloVoiceProduct.id}`)
    console.log(`   ✅ Price: ${soloVoicePrice.id}\n`)

    // 4. Create Family + Voice product
    console.log('4️⃣  Creating Family + Voice plan ($59/month)...')
    const familyVoiceProduct = await stripe.products.create({
      name: 'Pokkit Family + Voice',
      description: '200 voice minutes for up to 5 users',
      metadata: {
        plan: 'family_voice',
        voice_minutes: '200',
        max_users: '5',
      },
    })
    const familyVoicePrice = await stripe.prices.create({
      product: familyVoiceProduct.id,
      unit_amount: 5900, // $59.00
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    })
    console.log(`   ✅ Product: ${familyVoiceProduct.id}`)
    console.log(`   ✅ Price: ${familyVoicePrice.id}\n`)

    // 5. Create Business product
    console.log('5️⃣  Creating Business plan ($97/month)...')
    const businessProduct = await stripe.products.create({
      name: 'Pokkit Business',
      description: '200 voice minutes + email & calendar (coming soon)',
      metadata: {
        plan: 'business',
        voice_minutes: '200',
        features: 'voice,sms,email,calendar',
      },
    })
    const businessPrice = await stripe.prices.create({
      product: businessProduct.id,
      unit_amount: 9700, // $97.00
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    })
    console.log(`   ✅ Product: ${businessProduct.id}`)
    console.log(`   ✅ Price: ${businessPrice.id}\n`)

    // Print summary for .env.local
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ ALL PRODUCTS CREATED SUCCESSFULLY!\n')
    console.log('📋 Add these to your .env.local:\n')
    console.log(`STRIPE_SOLO_PRICE_ID=${soloPrice.id}`)
    console.log(`STRIPE_FAMILY_PRICE_ID=${familyPrice.id}`)
    console.log(`STRIPE_SOLO_VOICE_PRICE_ID=${soloVoicePrice.id}`)
    console.log(`STRIPE_FAMILY_VOICE_PRICE_ID=${familyVoicePrice.id}`)
    console.log(`STRIPE_BUSINESS_PRICE_ID=${businessPrice.id}`)
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    return {
      solo: soloPrice.id,
      family: familyPrice.id,
      solo_voice: soloVoicePrice.id,
      family_voice: familyVoicePrice.id,
      business: businessPrice.id,
    }
  } catch (error) {
    console.error('❌ Error setting up Stripe products:', error.message)
    throw error
  }
}

async function getProductFromPrice(priceId) {
  try {
    const price = await stripe.prices.retrieve(priceId)
    return price.product
  } catch (error) {
    console.log(`   ⚠️  Could not retrieve product from price ${priceId}`)
    return null
  }
}

// Run the setup
setupStripeProducts()
  .then((prices) => {
    console.log('✅ Setup complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  })
