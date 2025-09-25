import { DataMap } from '@grapecity/wijmo.grid';

import { SkillsAccess } from '../../types/user-permissions-types';

type DatabaseAccess = 'view' | 'view_and_create' | 'view_create_and_share' | 'no_access';

export const skillAccessList = [
  {
    skillName: 'skill 1',
    displayName: 'Skill 1',
    hasAccess: false,
  },
  {
    skillName: 'contract-policy-compliance',
    displayName: 'Contract Policy Compliance',
    hasAccess: false,
  },
  {
    skillName: 'draft-correspondance',
    displayName: 'Draft Correspondance',
    hasAccess: false,
  },
  {
    skillName: 'skill 2',
    displayName: 'Skill 2',
    hasAccess: false,
  },
];

export interface UserPermissions {
  id: number;
  user: string;
  email: string;
  role: string;
  isAdmin: string;
  skillsAccess: SkillsAccess[];
  databaseAccess: DatabaseAccess;
}

export const getData = (): UserPermissions[] => {
  const data = [];
  for (let i = 0; i < 250; i++) {
    data.push({
      id: i + 1,
      email: `user${i + 1}@mail.com`,
      user: `User ${i + 1}`,
      role: i & 1 ? 'Role 1' : 'Role 2',
      isAdmin: Math.random() < 0.5 ? 'Yes' : 'No',
      skillsAccess: [
        {
          skillName: 'skill',
          displayName: 'Skill',
          hasAccess: Math.random() < 0.5,
        },
        {
          skillName: 'contract-policy-compliance',
          displayName: 'Contract Policy Compliance',
          hasAccess: Math.random() < 0.5,
        },
        {
          skillName: 'draft-correspondance',
          displayName: 'Draft Correspondance',
          hasAccess: Math.random() < 0.5,
        },
        {
          skillName: 'another-skill',
          displayName: 'Another skill',
          hasAccess: Math.random() < 0.5,
        },
      ].filter((item) => item.hasAccess),
      databaseAccess:
        Math.random() > 0.33
          ? 'view'
          : Math.random() > 0.66
            ? 'view_and_create'
            : ('view_create_and_share' as DatabaseAccess),
    });
  }
  return data;
};

export const databasesAccessOptions: { permission: DatabaseAccess; label: string }[] = [
  {
    permission: 'view',
    label: 'View only',
  },
  {
    permission: 'view_and_create',
    label: 'View & create',
  },
  {
    permission: 'view_create_and_share',
    label: 'View, create & share',
  },
  {
    permission: 'no_access',
    label: 'No access',
  },
];

export const databaseAccessMap = new DataMap(databasesAccessOptions, 'permission', 'label');
