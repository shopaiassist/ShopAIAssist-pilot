import { Meta, StoryObj } from '@storybook/react';

import UserPermissions from './UserPermissions';

const meta = {
  title: 'UserPermissions',
  component: UserPermissions,
  tags: ['autodocs'],
} satisfies Meta<typeof UserPermissions>;

export default meta;

export const Default: StoryObj = { args: {} };
