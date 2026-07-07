import React from 'react'

import type { Preview } from '@storybook/nextjs-vite'
import '../app/globals.css'

const preview: Preview = {
  parameters: {
    options: {
      storySort: {
        order: ['Welcome', 'Chat', ['Chat', ['Introduction', 'ContentArea', 'ToolActivity', 'Message']], 'Dashboard', 'Layout', 'UI'],
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo'
    },
    // Keep Storybook Canvas/Docs background in sync
    backgrounds: {
      disable: true,
    },
  },

  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'circlehollow', title: 'Light' },
          { value: 'dark', icon: 'circle', title: 'Dark' },
        ],
      },
    },
  },

  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || 'light';
      
      React.useEffect(() => {
        const root = document.documentElement;
        root.setAttribute('data-theme', theme);
        
        // Force Storybook Docs/Canvas containers to use system theme colors
        const styleId = 'storybook-theme-overrides';
        let styleTag = document.getElementById(styleId) as HTMLStyleElement;
        
        if (!styleTag) {
          styleTag = document.createElement('style');
          styleTag.id = styleId;
          document.head.appendChild(styleTag);
        }

        styleTag.innerHTML = `
          .docs-story, 
          .sb-show-main, 
          .sbdocs-content,
          .sbdocs-preview {
            background-color: var(--color-background) !important;
            color: var(--color-foreground) !important;
          }
          /* Fix for the props table (ArgsTable) */
          .docblock-argstable {
            background-color: var(--color-card-background) !important;
          }
        `;
      }, [theme]);

      return React.createElement(Story);
    },
  ],
};

export default preview;