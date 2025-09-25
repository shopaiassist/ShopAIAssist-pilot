import { SKILL_TO_FAC_MAPPINGS } from '@/-skill-mapping';
import { SkillPermissions } from '@';

import { FacGrants } from './cari-auth/FacGrants';
import { FacHandler } from './FacHandler';

/**
 * A handler for _skill_ FACs, like which skills the user has access to.
 */
export class SkillFacHandler implements FacHandler<SkillPermissions> {
  protected static readonly FLAT_PROPERTY_PREFIX = 'skill.';

  protected skillFacNamesBySkillId: { [skillId: string]: string };

  constructor() {
    // This data may someday come from a Skill Registry, but for now we'll use this hardcoded package.
    this.skillFacNamesBySkillId = {};
    for (const skillData of SKILL_TO_FAC_MAPPINGS) {
      if (skillData.active && skillData.skillId && skillData.facName) {
        this.skillFacNamesBySkillId[skillData.skillId] = skillData.facName;
      }
    }
  }

  flatFormatEntitlements(entitlements: SkillPermissions): { [key: string]: boolean } {
    const flatProperties: { [key: string]: boolean } = {};
    entitlements.allowedSkills.forEach((skill) => {
      flatProperties[`${SkillFacHandler.FLAT_PROPERTY_PREFIX}${skill}`] = true;
    });
    return flatProperties;
  }

  getFacNames(): string[] {
    return Object.values(this.skillFacNamesBySkillId);
  }

  processFacs(facGrants: FacGrants): SkillPermissions {
    const allowedSkills = Object.keys(this.skillFacNamesBySkillId).filter((skillId) =>
      facGrants.isGranted(this.skillFacNamesBySkillId[skillId])
    );
    return { allowedSkills };
  }
}
