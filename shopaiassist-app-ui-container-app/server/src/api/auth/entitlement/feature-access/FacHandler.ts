import { FacGrants } from './cari-auth/FacGrants';

/** A handler for processing a group of FACs. */
export interface FacHandler<T extends object> {
  /** The list of FAC names this handler processes. */
  getFacNames(): string[];

  /** Processes a set of FACs--some of which may not be related to this handler--and outputs the entitlements object. */
  processFacs(facValues: FacGrants): T;

  /** Reformats a set of entitlements into a flat {string:boolean} dictionary. */
  flatFormatEntitlements(entitlements: T): { [key: string]: boolean };
}
