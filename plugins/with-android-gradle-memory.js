const { withGradleProperties } = require("@expo/config-plugins")

const setGradleProperty = (properties, key, value) => {
    const existingProperty = properties.find(item => item.type === "property" && item.key === key)

    if (existingProperty) {
        existingProperty.value = value
        return
    }

    properties.push({
        type: "property",
        key,
        value,
    })
}

const withAndroidGradleMemory = config =>
    withGradleProperties(config, configWithGradleProperties => {
        const properties = configWithGradleProperties.modResults

        setGradleProperty(
            properties,
            "org.gradle.jvmargs",
            "-Xmx4096m -XX:MaxMetaspaceSize=1024m -Dfile.encoding=UTF-8",
        )
        setGradleProperty(properties, "org.gradle.parallel", "false")
        setGradleProperty(properties, "org.gradle.workers.max", "2")

        return configWithGradleProperties
    })

module.exports = withAndroidGradleMemory
