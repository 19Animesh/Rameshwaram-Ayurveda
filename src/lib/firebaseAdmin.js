import admin from 'firebase-admin';

/** True when Firebase Admin credentials are present. */
export function isPhoneVerificationConfigured() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  );
}

/**
 * Cleans FIREBASE_PRIVATE_KEY into a valid PEM string.
 *
 * WHY THIS EXISTS
 * ---------------
 * The key is copied out of the service-account JSON, where the line looks like
 *     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
 * Copying the trailing comma into .env (`...KEY-----\n",`) stops dotenv from
 * recognising the closing quote, so the server received a key that started
 * with `"` and ended with `",`. Firebase Admin could not parse it, so EVERY
 * OTP verification failed — registration reported an "expired code" and login
 * could never find an account.
 *
 * This accepts all the common paste formats: with or without surrounding
 * quotes, a trailing comma, literal \n escapes, real newlines, or Windows CRLF.
 */
function normalisePrivateKey(raw) {
  let key = String(raw || '').trim();
  key = key.replace(/,\s*$/, '').trim();          // trailing comma from the JSON file
  key = key.replace(/^['"]+/, '').replace(/['"]+$/, ''); // stray surrounding quotes
  key = key
    .replace(/\\r/g, '')
    .replace(/\\n/g, '\n')                        // literal "\n" → newline
    .replace(/\r\n?/g, '\n')                      // CRLF → LF
    .trim();
  return `${key}\n`;
}

function configurationError(message, cause) {
  const err = new Error(message);
  err.isConfigurationError = true;
  if (cause) err.cause = cause;
  return err;
}

/**
 * Lazily initializes and returns the Firebase Admin instance.
 * Throws an error tagged `isConfigurationError` when credentials are missing
 * or unusable, so routes can answer 503 ("not set up") instead of 401
 * ("your code is wrong").
 */
export function getFirebaseAdmin() {
  if (admin.apps.length) return admin;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw configurationError(
      'Phone verification is not configured. Set FIREBASE_PROJECT_ID, ' +
      'FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in your environment.'
    );
  }

  let credential;
  try {
    credential = admin.credential.cert({
      projectId: projectId.trim(),
      clientEmail: clientEmail.trim(),
      privateKey: normalisePrivateKey(privateKey),
    });
  } catch (err) {
    throw configurationError(
      'FIREBASE_PRIVATE_KEY could not be read. In .env it should be one line: ' +
      'FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n" ' +
      `(no comma at the end). Details: ${err.message}`,
      err
    );
  }

  admin.initializeApp({ credential });
  return admin;
}
