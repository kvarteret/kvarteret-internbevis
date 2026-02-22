module.exports = {
    preset: "jest-expo",
    testMatch: ["**/__tests__/**/*.test.ts"],
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
    },
    clearMocks: true,
}
