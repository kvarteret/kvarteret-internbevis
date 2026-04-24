module.exports = {
    preset: "jest-expo",
    testMatch: ["**/__tests__/**/*.test.ts"],
    testPathIgnorePatterns: ["<rootDir>/.claude/"],
    modulePathIgnorePatterns: ["<rootDir>/.claude/"],
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
    },
    clearMocks: true,
}
