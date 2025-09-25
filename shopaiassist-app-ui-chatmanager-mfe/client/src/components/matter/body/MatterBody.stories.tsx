import { Meta, StoryObj } from '@storybook/react';
import MatterBody from './MatterBody';
import { Default as ContentDefault } from './content/MatterBodyContent.stories';

const meta = {
  title: 'Matter/Body',
  component: MatterBody,
  parameters: {
    layout: 'fullscreen'
  },
  tags: ['autodocs']
} satisfies Meta<typeof MatterBody>;

export default meta;

export const Default: StoryObj = { args: { ...ContentDefault.args } };
