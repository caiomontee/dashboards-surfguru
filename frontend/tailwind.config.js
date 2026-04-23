/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Paleta SurfGuru ────────────────────────────────────────
        primary: {
          light:   '#1E5CB8',   // hover
          DEFAULT: '#003F8A',   // ← Azul SurfGuru
          dark:    '#002B6E',   // pressed
        },
        accent: {
          DEFAULT: '#FF6600',   // ← Laranja SurfGuru
          dark:    '#E55A00',
        },
        // Fundos — tema claro
        panel: {
          base:    '#EEF2F7',   // fundo da página
          surface: '#FFFFFF',   // cards
          raised:  '#F8FAFC',   // elementos elevados
          border:  '#D1DCE8',   // bordas
        },
        // Textos
        ink: {
          primary:   '#0F172A',
          secondary: '#475569',
          muted:     '#94A3B8',
        },
        // Status
        positive: '#059669',
        caution:  '#D97706',
        negative: '#DC2626',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,.07), 0 4px 16px rgba(0,0,0,.06)',
        'card-hover': '0 4px 12px rgba(0,0,0,.10), 0 8px 24px rgba(0,0,0,.08)',
      },
    },
  },
  plugins: [],
};
