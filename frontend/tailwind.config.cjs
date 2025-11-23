module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'deep-red': 'rgb(184, 28, 37)',
        'warm-red': 'rgb(192, 99, 103)',
        'bright-orange': 'rgb(249, 155, 33)',
        'soft-peach': 'rgb(223, 171, 161)',
        'very-light-peach': 'rgb(242, 228, 224)',
      },
      keyframes: {
        highlight: {
          '0%, 100%': { color: 'rgba(255, 255, 255, 1)', textShadow: '0 0 5px rgba(184, 28, 37, 0.5)' },
          '50%': { color: 'rgb(184, 28, 37)', textShadow: '0 0 10px rgb(192, 99, 103), 0 0 20px rgb(192, 99, 103)' },
        },
      },
      animation: {
        highlight: 'highlight 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
