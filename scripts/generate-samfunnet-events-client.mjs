import { spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, relative } from "node:path"
import { fileURLToPath } from "node:url"

const DEFAULT_OPENAPI_URL = "https://www.samfunnetibergen.no/api/v1/openapi.json"
const OUTPUT_DIR = "src/core/api/samfunnet-events"

const rootDir = fileURLToPath(new URL("..", import.meta.url))
const isCheck = process.argv.includes("--check")

const runGenerator = outputDir => {
    rmSync(outputDir, { force: true, recursive: true })
    const input = process.env.SAMFUNNET_EVENTS_OPENAPI?.trim() || DEFAULT_OPENAPI_URL
    const result = spawnSync(
        "npx",
        ["openapi-ts", "-i", input, "-o", outputDir, "-c", "@hey-api/client-fetch"],
        { cwd: rootDir, stdio: "inherit" },
    )

    if (result.status !== 0 || !existsSync(join(outputDir, "index.ts"))) {
        process.exit(result.status ?? 1)
    }

    const formatResult = spawnSync("npx", ["biome", "format", "--write", outputDir], {
        cwd: rootDir,
        stdio: "inherit",
    })
    if (formatResult.status !== 0) process.exit(formatResult.status ?? 1)
}

const listFiles = dir => {
    if (!existsSync(dir)) return []
    return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const path = join(dir, entry.name)
        return entry.isDirectory() ? listFiles(path) : [path]
    })
}

const compareGenerated = (actualDir, expectedDir) => {
    const actualFiles = listFiles(actualDir)
        .map(path => relative(actualDir, path))
        .sort()
    const expectedFiles = listFiles(expectedDir)
        .map(path => relative(expectedDir, path))
        .sort()
    const changedFiles = [...new Set([...actualFiles, ...expectedFiles])].filter(file => {
        const actualPath = join(actualDir, file)
        const expectedPath = join(expectedDir, file)
        if (!existsSync(actualPath) || !existsSync(expectedPath)) return true
        if (statSync(actualPath).size !== statSync(expectedPath).size) return true
        return readFileSync(actualPath, "utf8") !== readFileSync(expectedPath, "utf8")
    })

    if (changedFiles.length === 0) return
    console.error("Generated Samfunnet events OpenAPI client is stale:")
    for (const file of changedFiles) console.error(`- ${file}`)
    console.error("Run npm run api:generate:events and commit the generated client.")
    process.exit(1)
}

if (isCheck) {
    const tempDir = mkdtempSync(join(tmpdir(), "samfunnet-events-client-"))
    try {
        const generatedDir = join(tempDir, "client")
        runGenerator(generatedDir)
        compareGenerated(join(rootDir, OUTPUT_DIR), generatedDir)
    } finally {
        rmSync(tempDir, { force: true, recursive: true })
    }
} else {
    runGenerator(join(rootDir, OUTPUT_DIR))
}
