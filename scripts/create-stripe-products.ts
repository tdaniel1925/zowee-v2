/**
 * Create Zowee Stripe products and prices
 * Run with: npx tsx scripts/create-stripe-products.ts
 */

import Stripe from 'stripe'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Error: STRIPE_SECRET_KEY not found in .env.local')
  process.exit(1)
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10',
})

async function createZoweeProducts() {
  console.log('Creating Zowee Stripe products...\n')

  try {
    // 1. Create Solo Product
    console.log('Creating Solo product...')
    const soloProduct = await stripe.products.create({
      name: 'Zowee Solo',
      description: 'Personal AI assistant via SMS. One text replaces a dozen apps.',
      metadata: {
        plan: 'solo',
        users: '1',
      },
    })
    console.log(`✓ Solo Product created: ${soloProduct.id}`)

    // Create Solo Price ($15/month)
    const soloPrice = await stripe.prices.create({
      product: soloProduct.id,
      unit_amount: 1500, // $15.00 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
        trial_period_days: 14,
      },
      metadata: {
        plan: 'solo',
      },
    })
    console.log(`✓ Solo Price created: ${soloPrice.id} ($15/month)\n`)

    // 2. Create Family Product
    console.log('Creating Family product...')
    const familyProduct = await stripe.products.create({
      name: 'Zowee Family',
      description: 'Personal AI assistant for the whole family. Up to 6 phone numbers.',
      metadata: {
        plan: 'family',
        users: '6',
      },
    })
    console.log(`✓ Family Product created: ${familyProduct.id}`)

    // Create Family Price ($24/month)
    const familyPrice = await stripe.prices.create({
      product: familyProduct.id,
      unit_amount: 2400, // $24.00 in cents
      currency: 'usd',
      recurring: {
        interval: 'month',
        trial_period_days: 14,
      },
      metadata: {
        plan: 'family',
      },
    })
    console.log(`✓ Family Price created: ${familyPrice.id} ($24/month)\n`)

    // Output for .env.local
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Add these to your .env.local file:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log(`STRIPE_SOLO_PRICE_ID=${soloPrice.id}`)
    console.log(`STRIPE_FAMILY_PRICE_ID=${familyPrice.id}`)
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    return {
      soloPriceId: soloPrice.id,
      familyPriceId: familyPrice.id,
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error creating products:', error.message)
    }
    throw error
  }
}

createZoweeProducts()
  .then((prices) => {
    console.log('✓ All Stripe products created successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed to create products')
    process.exit(1)
  })
