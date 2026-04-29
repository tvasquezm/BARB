const theme = require('./tailwind.theme.json')

module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: theme.colors,
      spacing: theme.spacing,
      borderRadius: {
        md: theme.rounded?.md || '12px'
      }
    }
  },
  plugins: []
}
