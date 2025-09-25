// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
import MatterSidebar from './MatterSidebar';
import { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Matter/Sidebar',
  component: MatterSidebar,
  parameters: {
    layout: 'padded'
  },
  tags: ['autodocs']
} satisfies Meta<typeof MatterSidebar>;

export default meta;

export const Default: StoryObj = { args: {} };
