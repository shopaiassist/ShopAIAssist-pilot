import { Meta, StoryObj } from '@storybook/react';
import MatterBodyContent from './MatterBodyContent';

const meta = {
  title: 'Matter/Body/Content',
  component: MatterBodyContent,
  parameters: {
    layout: 'fullscreen'
  },
  tags: ['autodocs']
} satisfies Meta<typeof MatterBodyContent>;

export default meta;

export const Default: StoryObj = { args: { contentComponent: <div>Matter body content here.</div> } };
