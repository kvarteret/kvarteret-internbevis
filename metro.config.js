const { getDefaultConfig } = require("expo/metro-config")
const { withUniwindConfig } = require("uniwind/metro")

const config = getDefaultConfig(__dirname)

if (!config.resolver.sourceExts.includes("cjs")) {
    config.resolver.sourceExts.push("cjs")
}

module.exports = withUniwindConfig(config, {
    cssEntryFile: "./global.css",
    dtsFile: "./uniwind-types.d.ts",
    polyfills: { rem: 14 },
})
