import { Meta, StoryObj } from '@storybook/react';
import { userEvent, within } from '@storybook/test';

import MainHeader from './MainHeader';

const meta = {
  title: 'Main Header',
  component: MainHeader,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MainHeader>;

export default meta;

export const Default: StoryObj = { args: {} };

export const HelpMenu: StoryObj = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const helpButton = canvas.getByTestId('help-btn');

    await userEvent.click(helpButton, { delay: 1000 });
  },
};
