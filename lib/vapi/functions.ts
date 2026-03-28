/**
 * VAPI Function Definitions
 * Maps voice function calls to existing SMS skills
 */

export const vapiFunctions = [
  {
    name: 'get_help',
    description: 'Get help information about what Pokkit can do',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'track_price',
    description: 'Track a product price and get alerts when it drops',
    parameters: {
      type: 'object',
      properties: {
        product: {
          type: 'string',
          description: 'Name or description of the product',
        },
        url: {
          type: 'string',
          description: 'Product URL (Amazon, Best Buy, etc.)',
        },
        target_price: {
          type: 'number',
          description: 'Target price to alert at (optional)',
        },
      },
      required: ['product'],
    },
  },
  {
    name: 'search_youtube',
    description: 'Search for YouTube videos',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'control_smart_home',
    description: 'Control smart home devices via Alexa',
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The command to execute (e.g., "turn off bedroom lights")',
        },
      },
      required: ['command'],
    },
  },
  {
    name: 'pause_service',
    description: 'Pause Pokkit SMS service temporarily',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'resume_service',
    description: 'Resume Pokkit SMS service',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'compare_prices',
    description: 'Compare prices for a product across multiple retailers',
    parameters: {
      type: 'object',
      properties: {
        product: {
          type: 'string',
          description: 'Product name or description',
        },
        retailers: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'List of retailers to check (optional)',
        },
      },
      required: ['product'],
    },
  },
  {
    name: 'read_reviews',
    description: 'Read product reviews from various sources',
    parameters: {
      type: 'object',
      properties: {
        product: {
          type: 'string',
          description: 'Product name or description',
        },
        source: {
          type: 'string',
          description: 'Review source (Amazon, Reddit, etc.) - optional',
        },
      },
      required: ['product'],
    },
  },
  {
    name: 'fill_form',
    description: 'Fill out an online form with provided information',
    parameters: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL of the form',
        },
        fields: {
          type: 'object',
          description: 'Field values as key-value pairs',
        },
      },
      required: ['url', 'fields'],
    },
  },
  {
    name: 'make_payment',
    description: 'Process a payment (requires confirmation)',
    parameters: {
      type: 'object',
      properties: {
        merchant: {
          type: 'string',
          description: 'Merchant name',
        },
        amount: {
          type: 'number',
          description: 'Payment amount',
        },
        confirm: {
          type: 'boolean',
          description: 'User confirmation required',
          default: false,
        },
      },
      required: ['merchant', 'amount'],
    },
  },
]

/**
 * Get function definition by name
 */
export function getFunctionByName(name: string) {
  return vapiFunctions.find((f) => f.name === name)
}
