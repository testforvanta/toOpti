/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'bg-green-500', 'bg-green-400', 'border-green-600', 'border-green-500',
    'bg-gray-300', 'bg-gray-400', 'border-gray-400', 'border-gray-300',
    'bg-yellow-400', 'border-yellow-500', 'text-yellow-600', 'dark:text-yellow-400',
    'dark:bg-yellow-400', 'dark:border-yellow-400',
    'dark:bg-green-400', 'dark:bg-green-500', 'dark:border-green-500', 'dark:border-green-400',
    'dark:bg-zinc-600', 'dark:border-zinc-500', 'dark:bg-zinc-600', 'dark:border-zinc-600',
    'text-green-600', 'dark:text-green-400',
    'text-gray-500', 'dark:text-zinc-400',
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Example: to use colors from constants.ts if needed for consistency
        // 'custom-blue': '#007AFF', 
      },
      borderRadius: {
        '3xl': '1.5rem', // Standard Tailwind large rounded corners
      },
      boxShadow: {
        'glass-neumorphic': '0px 0px 2px 0px rgba(255,255,255,0.4) inset, 0px 7px 20px 0px rgba(0,0,0,0.07), 0px 3px 8px 0px rgba(0,0,0,0.05)',
        'soft-dreamy': '0px 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
        // Dark mode shadows (optional: can adjust if needed)
        'dark-glass-neumorphic': '0px 0px 2px 0px rgba(255,255,255,0.1) inset, 0px 7px 20px 0px rgba(0,0,0,0.2), 0px 3px 8px 0px rgba(0,0,0,0.15)',
        'dark-soft-dreamy': '0px 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.25)',
      },
      animation: {
        'modal-backdrop-appear': 'modal-backdrop-appear 0.3s ease-out forwards',
        'modal-content-appear': 'modal-content-appear 0.3s ease-out forwards',
        'slide-down-fade-in': 'slide-down-fade-in 0.5s ease-out forwards',
      },
      keyframes: {
        'modal-backdrop-appear': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'modal-content-appear': {
          '0%': { opacity: '0', transform: 'scale(0.95) translateY(10px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'slide-down-fade-in': {
            '0%': { opacity: '0', transform: 'translateY(-10px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    }
  },
  plugins: [],
}
