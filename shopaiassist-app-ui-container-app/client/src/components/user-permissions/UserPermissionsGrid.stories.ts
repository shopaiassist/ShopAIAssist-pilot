import { Meta, StoryObj } from '@storybook/react';

import UserPermissionsGrid from './UserPermissionsGrid';

const meta = {
  title: 'Components/UserPermissionsGrid',
  component: UserPermissionsGrid,
  tags: ['autodocs'],
} satisfies Meta<typeof UserPermissionsGrid>;

export default meta;

export const Default: StoryObj = { args: {} };
