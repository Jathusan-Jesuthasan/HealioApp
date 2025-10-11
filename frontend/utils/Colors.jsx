// /utils/Colors.js

export const Colors = {
  // 🎨 60-30-10 Theme
  primary: '#F5F7FA', // 60% → Soft light gray-blue (Backgrounds)
  secondary: '#4A90E2', // 30% → Calm blue (Nav, headers, highlights)
  accent: '#10B981', // 10% → Emerald green (CTAs, success, FAB)

  // 🌙 Supporting UI
  background: '#F5F7FA', // Default background
  card: '#FFFFFF', // Card / container background
  border: '#E5E7EB', // Subtle border / divider
  textPrimary: '#111827', // Dark text for readability
  textSecondary: '#6B7280', // Softer gray text for secondary info

  // ⚠️ Status Colors
  danger: '#EF4444', // Red → critical / high risk
  warning: '#F59E0B', // Orange → caution / medium risk
  stable: '#10B981', // Green → safe / stable
  info: '#3B82F6', // Blue → informational messages

  // 🟢 States
  pressed: '#E0F2FE', // Light blue → button press feedback
  disabled: '#D1D5DB', // Gray → disabled state

  // 🟦 Navigation
  navBackground: '#FFFFFF', // Bottom tab bar background
  navIcon: '#6B7280', // Default nav icon color
  navActive: '#4A90E2', // Active tab icon color

  // 🌈 Optional Gradients
  gradients: {
    blueToGreen: ['#4A90E2', '#10B981'], // calm → growth
    purpleToPink: ['#8B5CF6', '#EC4899'], // playful gradient
  },

  // 📊 Extended Analytics Palette (NEW)
  chartColors: [
    '#4A90E2', // Calm blue
    '#10B981', // Emerald green
    '#F59E0B', // Amber yellow
    '#8B5CF6', // Violet
    '#EF4444', // Red
    '#3B82F6', // Info blue
  ],

  // 🧠 Shadows & Overlays (NEW)
  shadow: 'rgba(0, 0, 0, 0.1)', // General shadow color
  overlay: 'rgba(0, 0, 0, 0.4)', // Modal overlay background

  // 📘 Report / PDF Specific (NEW)
  report: {
    headerBorder: '#4A90E2',
    sectionBg: '#F8FAFC',
    factorBg: '#E2E8F0',
    footerText: '#64748B',
  },

  // 🌤️ Misc UI Shades (NEW)
  successLight: '#D1FAE5', // Soft green background
  warningLight: '#FEF3C7', // Soft yellow background
  dangerLight: '#FEE2E2', // Soft red background
  infoLight: '#DBEAFE', // Soft blue background
};
