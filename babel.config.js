module.exports = api => {
    api.cache(true)
    return {
        presets: ["babel-preset-expo", "nativewind/babel"],
        plugins: [
            "expo-router/babel",
            [
                "module-resolver",
                {
                    alias: {
                        "@": "./src",
                        "@assets": "./assets",
                    },
                },
            ],
            "react-native-worklets/plugin",
        ],
    }
}
