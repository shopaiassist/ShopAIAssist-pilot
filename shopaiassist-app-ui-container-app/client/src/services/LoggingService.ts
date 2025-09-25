import { MfeContext } from '@';
import { LoggingService } from '@/';

/** Base loggin service */
const LOG = new LoggingService(
  console,
  undefined,
  !process.env.SUPPRESS_LOGGING || process.env.SUPPRESS_LOGGING !== 'true'
);

/**
 * Assigns a new LoggingService to the given MfeContext's utilities. It uses the default LOG service as the base console.
 * @param context MfeContext to assign the logger.
 * @param tag Optional tag for the logging service. Useful to identify each MFE's logs.
 */
export const addConsoleUtilityWithTag = (context: MfeContext, tag?: string): MfeContext => {
  return {
    ...context,
    utilities: {
      ...context.utilities,
      console: new LoggingService(LOG, tag),
    },
  };
};

export default LOG;
