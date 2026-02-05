/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Hava durumu renkleri (sıcaklık bazlı)
        temp: {
          // Çok soğuk
          freezing: '#3B82F6',
          // Soğuk
          cold: '#60A5FA',
          // Serin
          cool: '#10B981',
          // Ilık
          mild: '#FBBF24',
          // Sıcak
          warm: '#F97316',
          // Çok sıcak
          hot: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}
