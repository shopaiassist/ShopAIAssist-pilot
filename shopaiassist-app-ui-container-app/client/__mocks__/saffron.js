/* eslint-disable no-undef, @typescript-eslint/no-var-requires */

// Mock the @/core-components/react package
const React = require('react');

module.exports = {
  SafAlert: ({children, ...props}) => <saf-alert {...props}>{children}</saf-alert>,SafAnchor: ({ children, ...props }) => <a {...props}>{children}</a>,
  SafAnchorRegion: ({ children, ...props }) => <div {...props}>{children}</div>,
  SafAvatar: ({ children, ...props }) => <div {...props}>{children}</div>,
  SafBadge: ({ children, ...props }) => <div {...props}>{children}</div>,
  SafButton: ({ children, ...props }) => <button {...props}>{children}</button>,
  SafDivider: ({ children, ...props }) => <div {...props}>{children}</div>,
  SafIcon: ({ children, ...props }) => <div {...props}>{children}</div>,
  SafList: ({ children, ...props }) => <div {...props}>{children}</div>,
  SafListItem: ({ children, ...props }) => <div {...props}>{children}</div>,
  SafLogo: ({ children, ...props }) => <div {...props}>{children}</div>,
  SafMenu: ({ children, ...props }) => <div {...props}>{children}</div>,
  SafMenuItem: ({ children, ...props }) => <div {...props}>{children}</div>,
  SafProductHeader: ({ children, ...props }) => <header {...props}>{children}</header>,
  SafProductHeaderItem: ({ children, ...props }) => <div {...props}>{children}</div>,
  SafSideNav: ({ children, ...props }) => <div {...props}>{children}</div>,
  SafSrOnly: ({ children, ...props }) => <div {...props}>{children}</div>,
  SafText: ({ children, ...props }) => <span {...props}>{children}</span>,
  SafTooltip: ({ children, ...props }) => <div {...props}>{children}</div>,
  // Add any other components that you use from the package
};
