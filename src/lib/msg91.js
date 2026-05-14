/**
 * MSG91 SMS helper for sending OTP via SMS.
 * Uses MSG91 v5 Flow API.
 * Env vars required:
 *   MSG91_AUTH_KEY     - API authentication key
 *   MSG91_TEMPLATE_ID  - Flow/template ID for OTP SMS
 *   MSG91_SENDER_ID    - Sender ID (6 alphanumeric characters)
 */

const MSG91_BASE_URL = 'https://api.msg91.com/api/v5/flow/';

/**
 * Checks whether required MSG91 environment variables are set.
 * @returns {boolean}
 */
export function isMsg91Configured() {
  return !!(
    process.env.MSG91_AUTH_KEY &&
    process.env.MSG91_TEMPLATE_ID &&
    process.env.MSG91_SENDER_ID
  );
}

/**
 * Normalize phone number to international format without '+'.
 * Strips non-digit characters and prepends 91 (India) if missing.
 * @param {string} phone
 * @returns {string}
 */
function normalizePhone(phone) {
  let digits = phone.replace(/\D/g, '');
  if (!digits.startsWith('91')) {
    digits = '91' + digits;
  }
  return digits;
}

/**
 * Mask a phone number for safe logging - shows only the last 4 digits.
 * @param {string} phone
 * @returns {string}
 */
function maskPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '****';
  return '****' + digits.slice(-4);
}

/**
 * Send OTP via MSG91 SMS.
 * @param {string} phone - Recipient phone number
 * @param {string} otpCode - 6-digit OTP code to send
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function sendOtpSms(phone, otpCode) {
  if (!phone || !otpCode) {
    throw new Error('Phone and OTP code are required');
  }

  if (!isMsg91Configured()) {
    return {
      success: false,
      message: 'MSG91 is not configured. Please set MSG91_AUTH_KEY, MSG91_TEMPLATE_ID, and MSG91_SENDER_ID environment variables.',
    };
  }

  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;
  const senderId = process.env.MSG91_SENDER_ID;
  const mobiles = normalizePhone(phone);

  const payload = {
    sender: senderId,
    flow_id: templateId,
    mobiles,
    VAR1: otpCode, // OTP is passed as VAR1 in the template
  };

  try {
    const response = await fetch(MSG91_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authkey: authKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('MSG91 API error:', response.status, data);
      return {
        success: false,
        message: data.message || 'Failed to send SMS OTP',
      };
    }

    console.log(`SMS OTP sent to ${maskPhone(phone)} (type: ${data.type || 'N/A'})`);
    return { success: true, message: 'SMS OTP sent successfully' };
  } catch (error) {
    console.error('MSG91 request failed:', error.message);
    return {
      success: false,
      message: 'Failed to send SMS OTP due to network error',
    };
  }
}
