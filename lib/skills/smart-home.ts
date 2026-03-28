/**
 * Smart Home Integration (Alexa)
 * Controls Alexa-enabled smart home devices via SMS
 */

import { SMSIntent } from '@/lib/sms/parser'
import { PokkitContext } from '@/lib/sms/context'
import { SkillResult } from './executor'

/**
 * Handle SMART_HOME_CONTROL intent
 * Routes commands to Alexa Smart Home API
 */
export async function handleSmartHomeControl(
  intent: SMSIntent,
  context: PokkitContext
): Promise<SkillResult> {
  const { action, device, value, room } = intent.entities

  if (!action || !device) {
    return {
      success: false,
      message: "I didn't catch which device to control. Try: 'Turn off living room lights'",
    }
  }

  // Check if user has Alexa linked
  const alexaToken = context.user.preferences?.alexa_token

  if (!alexaToken) {
    return {
      success: false,
      message: `To control your smart home, link your Alexa account at ${process.env.NEXT_PUBLIC_APP_URL}/account/integrations`,
    }
  }

  try {
    // Execute Alexa command
    const result = await executeAlexaCommand(alexaToken, action, device, value, room)

    if (result.success) {
      return {
        success: true,
        message: formatSuccessMessage(action, device, value),
      }
    } else {
      return {
        success: false,
        message: result.error || `Couldn't control ${device}. Make sure it's online and connected to Alexa.`,
      }
    }
  } catch (error) {
    console.error('Smart home control error:', error)
    return {
      success: false,
      message: `Had trouble controlling ${device}. Please check your Alexa app or try again.`,
    }
  }
}

/**
 * Execute Alexa command using Alexa Voice Command API
 * This simulates saying the command to Alexa
 */
async function executeAlexaCommand(
  alexaToken: string,
  action: string,
  device: string,
  value?: string,
  room?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Build natural language command
    const command = buildVoiceCommand(action, device, value, room)

    // Send command via Alexa API (simulates voice command)
    const response = await fetch('https://api.amazonalexa.com/v1/behaviors/preview', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${alexaToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        behaviorId: 'PREVIEW',
        sequenceJson: JSON.stringify({
          '@type': 'com.amazon.alexa.behaviors.model.Sequence',
          'startNode': {
            '@type': 'com.amazon.alexa.behaviors.model.OpaquePayloadOperationNode',
            'operationPayload': {
              'deviceType': 'ALEXA_CURRENT_DEVICE_TYPE',
              'deviceSerialNumber': 'ALEXA_CURRENT_DSN',
              'locale': 'en-US',
              'customerId': 'ALEXA_CUSTOMER_ID',
              'text': command,
            },
          },
        }),
        status: 'ENABLED',
      }),
    })

    if (!response.ok) {
      // Fallback: Try direct command execution
      return await executeDirectAlexaCommand(alexaToken, command)
    }

    return { success: true }
  } catch (error) {
    console.error('executeAlexaCommand error:', error)
    return { success: false, error: 'Network error' }
  }
}

/**
 * Build natural language voice command for Alexa
 */
function buildVoiceCommand(action: string, device: string, value?: string, room?: string): string {
  const deviceName = room ? `${room} ${device}` : device

  switch (action) {
    case 'turn_on':
      return `turn on ${deviceName}`
    case 'turn_off':
      return `turn off ${deviceName}`
    case 'dim':
    case 'set':
      if (value) {
        return `set ${deviceName} to ${value} percent`
      }
      return `dim ${deviceName}`
    case 'lock':
      return `lock ${deviceName}`
    case 'unlock':
      return `unlock ${deviceName}`
    default:
      return `turn on ${deviceName}`
  }
}

/**
 * Direct command execution fallback
 */
async function executeDirectAlexaCommand(
  alexaToken: string,
  command: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Use Alexa Conversations API to send text command
    const response = await fetch('https://api.amazonalexa.com/v1/skills/~current/stages/development/interactionModel/conversations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${alexaToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: command,
        locale: 'en-US',
      }),
    })

    return { success: response.ok }
  } catch (error) {
    return { success: false, error: 'Command execution failed' }
  }
}

/**
 * Find Alexa device by name
 */
async function findDeviceByName(
  alexaToken: string,
  deviceName: string,
  room?: string
): Promise<string | null> {
  try {
    // Get all smart home devices from Alexa
    const response = await fetch(
      'https://api.amazonalexa.com/v2/accounts/~current/skills/~current/smartHome/entities',
      {
        headers: {
          'Authorization': `Bearer ${alexaToken}`,
        },
      }
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    const devices = data.endpoints || []

    // Search for device by name (case-insensitive)
    const searchName = deviceName.toLowerCase()
    const searchRoom = room?.toLowerCase()

    const device = devices.find((d: any) => {
      const name = d.friendlyName?.toLowerCase()
      const deviceRoom = d.additionalAttributes?.room?.toLowerCase()

      const nameMatch = name?.includes(searchName) || searchName.includes(name)
      const roomMatch = !searchRoom || deviceRoom?.includes(searchRoom)

      return nameMatch && roomMatch
    })

    return device?.endpointId || null
  } catch (error) {
    console.error('findDeviceByName error:', error)
    return null
  }
}

/**
 * Build Alexa directive for smart home control
 */
function buildAlexaDirective(action: string, deviceId: string, value?: string): any {
  const directive: any = {
    directive: {
      header: {
        namespace: '',
        name: '',
        payloadVersion: '3',
        messageId: `msg-${Date.now()}`,
        correlationToken: `token-${Date.now()}`,
      },
      endpoint: {
        scope: {
          type: 'BearerToken',
          token: '', // Will be filled by caller
        },
        endpointId: deviceId,
      },
      payload: {},
    },
  }

  // Map action to Alexa namespace and name
  switch (action) {
    case 'turn_on':
      directive.directive.header.namespace = 'Alexa.PowerController'
      directive.directive.header.name = 'TurnOn'
      break

    case 'turn_off':
      directive.directive.header.namespace = 'Alexa.PowerController'
      directive.directive.header.name = 'TurnOff'
      break

    case 'dim':
    case 'set':
      if (value && !isNaN(parseInt(value))) {
        directive.directive.header.namespace = 'Alexa.BrightnessController'
        directive.directive.header.name = 'SetBrightness'
        directive.directive.payload.brightness = parseInt(value)
      } else {
        directive.directive.header.namespace = 'Alexa.PowerController'
        directive.directive.header.name = 'TurnOn'
      }
      break

    case 'lock':
      directive.directive.header.namespace = 'Alexa.LockController'
      directive.directive.header.name = 'Lock'
      break

    case 'unlock':
      directive.directive.header.namespace = 'Alexa.LockController'
      directive.directive.header.name = 'Unlock'
      break

    default:
      directive.directive.header.namespace = 'Alexa.PowerController'
      directive.directive.header.name = 'TurnOn'
  }

  return directive
}

/**
 * Format success message for user
 */
function formatSuccessMessage(action: string, device: string, value?: string): string {
  const deviceName = device.toLowerCase().includes('light') ? '💡' :
                     device.toLowerCase().includes('lock') ? '🔒' :
                     device.toLowerCase().includes('thermostat') ? '🌡️' : '🏠'

  switch (action) {
    case 'turn_on':
      return `${deviceName} Turned on ${device}`

    case 'turn_off':
      return `${deviceName} Turned off ${device}`

    case 'dim':
    case 'set':
      return `${deviceName} Set ${device} to ${value}${value && !isNaN(parseInt(value)) ? '%' : ''}`

    case 'lock':
      return `🔒 Locked ${device}`

    case 'unlock':
      return `🔓 Unlocked ${device}`

    default:
      return `✅ Controlled ${device}`
  }
}

/**
 * Alternative: Use Alexa Voice Commands via Alexa Voice Service (AVS)
 * This sends a voice command directly to Alexa, simulating voice control
 */
export async function executeAlexaVoiceCommand(
  alexaToken: string,
  command: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Alexa Voice Service (AVS) endpoint
    const response = await fetch('https://avs-alexa-na.amazon.com/v1/avs/speechrecognizer/recognize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${alexaToken}`,
        'Content-Type': 'audio/L16; rate=16000; channels=1',
      },
      body: JSON.stringify({
        text: command,
      }),
    })

    return { success: response.ok }
  } catch (error) {
    console.error('executeAlexaVoiceCommand error:', error)
    return { success: false, error: 'AVS error' }
  }
}
