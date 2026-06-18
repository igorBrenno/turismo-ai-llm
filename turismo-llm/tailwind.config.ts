import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'
import containerQueries from '@tailwindcss/container-queries'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Cores extraídas diretamente do arquivo de design
        "surface": "#fbf9fa",
        "surface-dim": "#dbd9db",
        "surface-bright": "#fbf9fa",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f5f3f4",
        "surface-container": "#efedef",
        "surface-container-high": "#e9e7e9",
        "surface-container-highest": "#e4e2e3",
        "on-surface": "#1b1c1d",
        "on-surface-variant": "#44474c",
        "inverse-surface": "#303032",
        "inverse-on-surface": "#f2f0f2",
        "outline": "#74777d",
        "outline-variant": "#c4c6cd",
        "surface-tint": "#4f6073",
        "primary": "#041627", // Deep Navy
        "on-primary": "#ffffff",
        "primary-container": "#1a2b3c",
        "on-primary-container": "#8192a7",
        "inverse-primary": "#b7c8de",
        "secondary": "#505f76", // Slate Gray
        "on-secondary": "#ffffff",
        "secondary-container": "#d0e1fb",
        "on-secondary-container": "#54647a",
        "tertiary": "#211200",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#38260b",
        "on-tertiary-container": "#a88c69",
        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        "background": "#fbf9fa",
        "on-background": "#1b1c1d",
        "surface-variant": "#e4e2e3",
        
        // Cores fixas do sistema de design
        "primary-fixed": "#d2e4fb",
        "primary-fixed-dim": "#b7c8de",
        "on-primary-fixed": "#0b1d2d",
        "on-primary-fixed-variant": "#38485a",
        "secondary-fixed": "#d3e4fe",
        "secondary-fixed-dim": "#b7c8e1",
        "on-secondary-fixed": "#0b1c30",
        "on-secondary-fixed-variant": "#38485d",
        "tertiary-fixed": "#feddb5",
        "tertiary-fixed-dim": "#e1c29b",
        "on-tertiary-fixed": "#281802",
        "on-tertiary-fixed-variant": "#584326",

        // Tons de elevação descritos na seção "Elevation & Depth"
        "level-0-bg": "#F8FAFC",
        "level-1-border": "#E2E8F0",
        "table-header": "#F1F5F9"
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      fontSize: {
        // Definições da seção "Typography"
        'display': ['36px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'headline-lg-mobile': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'headline-md': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'label-md': ['12px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '600' }],
        'label-sm': ['11px', { lineHeight: '14px', fontWeight: '500' }],
      },
      borderRadius: {
        // Seção "Shapes"
        "sm": "0.125rem",    // 2px
        "DEFAULT": "0.25rem", // 4px (padrão para botões/inputs)
        "md": "0.375rem",    // 6px
        "lg": "0.5rem",      // 8px (padrão para os cartões e containers)
        "xl": "0.75rem",     // 12px
        "full": "9999px"
      },
      spacing: {
        // Seção "Layout & Spacing"
        "base": "8px",
        "xs": "4px",
        "sm": "12px",
        "md": "16px",
        "lg": "24px",
        "xl": "32px",
        "sidebar-width": "260px",
        "gutter": "24px"
      },
      boxShadow: {
        // Seção "Elevation & Depth" - Level 2 Popovers
        'popover': '0px 4px 12px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [forms, containerQueries],
} satisfies Config