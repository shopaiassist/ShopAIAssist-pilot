import { Meta, StoryObj } from '@storybook/react';

import MainFooter from './MainFooter';

const meta = {
  title: 'Main Footer',
  component: MainFooter,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MainFooter>;

export default meta;

export const Default: StoryObj = { args: {} };
