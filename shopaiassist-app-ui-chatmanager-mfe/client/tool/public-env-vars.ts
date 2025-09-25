/**
 * The set of environment variables available client-side.
 * These are not from the runtime environment, but hardcoded at build-time from the build environment (or `.env` file)
 * into the client code.
 *
 * THE VALUES OF THESE VARIABLES SHOULD NOT CONTAIN ANY SECRETS!
 */
export const PUBLIC_ENV_VARS = ['PUBLIC_URL', 'APP_DOMAIN'];
