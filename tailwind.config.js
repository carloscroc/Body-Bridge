/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./screens/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-tertiary': 'var(--bg-tertiary)',
        'accent-primary': 'var(--accent-primary)',
        'accent-secondary': 'var(--accent-secondary)',
        'surface-default': 'var(--surface-default)',
        'surface-hover': 'var(--surface-hover)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'text-muted': 'var(--text-muted)',
        'border-subtle': 'var(--border-subtle)',
        'border-default': 'var(--border-default)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        editorial: ['var(--font-editorial)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        utility: ['var(--font-utility)', 'sans-serif'],
      },
      fontSize: {
        'display-xl': 'var(--text-display-xl)',
        'display-lg': 'var(--text-display-lg)',
        'display-md': 'var(--text-display-md)',
        'editorial-xl': 'var(--text-editorial-xl)',
        'editorial-lg': 'var(--text-editorial-lg)',
        'label': 'var(--text-label)',
        'label-sm': 'var(--text-label-sm)',
      },
      borderRadius: {
        'xl': 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        'full': 'var(--radius-full)',
      },
      boxShadow: {
        'glow': 'var(--shadow-glow)',
        'ambient': 'var(--shadow-ambient)',
      },
    },
  },
  plugins: [],
}
