import type { Preview } from '@storybook/nextjs-vite'
import React from 'react'
import '../app/globals.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo'
    },
    // Đảm bảo background của Storybook Canvas/Docs đồng bộ
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
        
        // Ép các vùng chứa của Storybook Docs/Canvas sử dụng màu của hệ thống
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
          /* Fix cho bảng thuộc tính (ArgsTable) */
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