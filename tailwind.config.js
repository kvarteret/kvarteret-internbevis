/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                background: "#F3E2CC",
                "brand-primary": "#F54B4B",
                surface: "#FFFFFF",
                "surface-soft": "#F8F7F4",
                "surface-muted": "#F3F4F6",
                border: "#D1D5DB",
                "border-soft": "#E5E7EB",
                "text-primary": "#000000",
                "text-secondary": "#4B5563",
                "text-muted": "#6B7280",
                "state-danger": "#AA0000",
                "state-warning": "#C2410C",
                "state-success": "#16A34A",
                "state-info": "#2563EB",
                link: "#2563EB",
                "editorial-ink": "#111827",
                "editorial-ink-soft": "#5B6270",
                "editorial-surface": "#F9F5EC",
                "editorial-border": "#0000001A",
                "editorial-valid": "#2F5E3D",
                "editorial-invalid": "#7F2E2E",
            },
            borderRadius: {
                card: "14px",
                sheet: "18px",
                panel: "22px",
            },
            boxShadow: {
                card: "0 6px 18px rgba(0,0,0,0.08)",
            },
        },
    },
    plugins: [],
}
