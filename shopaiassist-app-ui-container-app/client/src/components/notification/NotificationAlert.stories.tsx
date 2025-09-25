import { Meta, StoryObj } from '@storybook/react';

import NotificationAlert from './NotificationAlert';

const meta = {
  title: 'Components/NotificationAlert',
  component: NotificationAlert,
  parameters: {},
  tags: ['autodocs'],
} satisfies Meta<typeof NotificationAlert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: {
    message: 'Replace with your message',
    appearance: 'success',
  },
};

export const Informational: Story = {
  args: {
    message: 'Replace with your message',
    appearance: 'informational',
  },
};

export const Error: Story = {
  args: {
    message: 'Replace with your message',
    appearance: 'error',
  },
};

export const NoAutoHide: Story = {
  args: {
    message: 'Replace with your message',
    appearance: 'informational',
    autoHideDuration: null,
  },
};

export const MultipleMessages: Story = {
  args: {
    message: ['Replace with your first message', 'Replace with your second message', 'Replace with your third message'],
    appearance: 'informational',
  },
};
