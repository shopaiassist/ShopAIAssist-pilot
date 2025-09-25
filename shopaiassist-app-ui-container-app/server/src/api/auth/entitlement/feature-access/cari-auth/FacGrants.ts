/**
 * A data structure representing a set of feature access controls for a user, containing whether each FAC is a 'Grant'
 * or 'Deny' for that user.
 */
export class FacGrants {
  constructor(protected facValues: { [facName: string]: 'Grant' | 'Deny' }) {}

  areAllGranted(facNames: string[]) {
    return facNames.every((facName) => this.isGranted(facName));
  }

  isGranted(facName: string): boolean {
    return this.facValues[facName] === 'Grant';
  }

  isOneGranted(facNames: string[]) {
    return facNames.some((facName) => this.isGranted(facName));
  }
}
