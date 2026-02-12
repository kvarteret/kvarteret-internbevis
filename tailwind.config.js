/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter_400Regular"],
        "inter-medium": ["Inter_500Medium"],
        "inter-semibold": ["Inter_600SemiBold"],
        "inter-bold": ["Inter_700Bold"],
        "inter-extrabold": ["Inter_800ExtraBold"],
      },
      colors: {
        background: "#F3E2CC",
        surface: "#FFFFFF",
        "surface-soft": "#F8F7F4",
        "surface-muted": "#F3F4F6",
        border: "#D1D5DB",
        "border-soft": "#E5E7EB",
        "text-primary": "#000000",
        "text-secondary": "#4B5563",
        "text-muted": "#6B7280",
        danger: "#AA0000",
        "danger-soft": "#DC2626",
        link: "#2563EB",
        success: "#16A34A",
      },
      borderRadius: {
        card: "14px",
        sheet: "18px",
      },
      boxShadow: {
        card: "0 6px 18px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};
