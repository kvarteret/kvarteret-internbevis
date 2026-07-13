module.exports = {
    preset: "jest-expo",
    testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
    testPathIgnorePatterns: ["<rootDir>/.claude/"],
    modulePathIgnorePatterns: ["<rootDir>/.claude/"],
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
        "\\.css$": "<rootDir>/jest/cssMock.js",
    },
    // jest-expo's default allowlist (react-native/@expo/etc.) doesn't include
    // uniwind, which ships untranspiled ESM .ts source; add it so component
    // tests that render styled components (Card, SafeAreaView, ...) can load.
    transformIgnorePatterns: [
        "/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|uniwind))",
        "/node_modules/react-native-reanimated/plugin/",
    ],
    setupFilesAfterEnv: ["<rootDir>/jest/setup.ts"],
    clearMocks: true,
}
