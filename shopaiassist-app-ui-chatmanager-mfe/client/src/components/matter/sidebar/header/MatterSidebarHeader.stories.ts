import { Meta, StoryObj } from '@storybook/react';
import MatterSidebarHeader from './MatterSidebarHeader';

const meta = {
  title: 'Matter/Sidebar/Header',
  component: MatterSidebarHeader,
  parameters: {
    layout: 'padded'
  },
  tags: ['autodocs']
} satisfies Meta<typeof MatterSidebarHeader>;

export default meta;

export const Default: StoryObj = { args: {} };
