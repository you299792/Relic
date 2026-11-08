module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        relic: {
          bg: '#F8FAFC',       // Very light slate background (slate-50)
          card: '#FFFFFF',     // Pure white for cards
          accent: '#6366F1',   // Indigo accent
          text: '#0F172A',     // Dark slate for primary text (slate-900)
          textMuted: '#64748B',// Medium slate for secondary text (slate-500)
          border: '#E2E8F0',   // Light border (slate-200)
        }
      }
    },
  },
  plugins: [],
}