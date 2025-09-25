/* eslint-disable no-undef, @typescript-eslint/no-var-requires */

// Mock the @on/core-components/react package
const React = require('react');

module.exports = {
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
  Dialog: ({ children, ...props }) => <div {...props}>{children}</div>,
  Menu: ({ children, ...props }) => <div {...props}>{children}</div>,
  MenuItem: ({ children, ...props }) => <div {...props}>{children}</div>,
  Icon: ({ children, ...props }) => <div {...props}>{children}</div>,
  Text: ({ children, ...props }) => <span {...props}>{children}</span>,
  Textfield: ({ children, ...props }) => <textarea {...props}>{children}</textarea>,
  Textarea: ({ children, ...props }) => <textarea {...props}>{children}</textarea>,
  Alert: ({ children, ...props }) => <span {...props}>{children}</span>,
  Tooltip: ({ children, ...props }) => <div {...props}>{children}</div>,
  // Add any other components that you use from the package
};
