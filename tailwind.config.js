const tokens = require("./src/shared/theme/tokens.json")

const toTailwindColorKey = key => key.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)

const tailwindColors = Object.fromEntries(
    Object.entries(tokens.colors).map(([key, value]) => [toTailwindColorKey(key), value]),
)

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: tailwindColors,
            borderRadius: tokens.radii,
            boxShadow: tokens.shadows,
        },
    },
    plugins: [],
}
