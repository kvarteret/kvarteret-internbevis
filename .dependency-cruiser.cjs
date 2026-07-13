/**
 * Mechanical enforcement of the boundaries in
 * docs/architecture/FEATURE_FIRST_MVVM_LITE.md (architecture assessment,
 * Refinement 3 in plans/full-app-review.md). Run with `npm run lint:architecture`.
 *
 * Known grandfathered exceptions are listed per rule with the reason; do not
 * add new ones without a Decision Log entry in the active ExecPlan.
 */
module.exports = {
    forbidden: [
        {
            name: "no-cross-feature",
            comment:
                "Features must not import other features; share via shared/ or app-level providers. " +
                "Grandfathered: feedback reads the stored auth e-mail for the contact-me option " +
                "until the session context exposes it (or the M5a feedback proxy removes the need).",
            severity: "error",
            from: { path: "^src/features/([^/]+)/" },
            to: {
                path: "^src/features/(?!$1)[^/]+/",
                pathNot: "^src/features/auth/data/authRepository\\.ts$",
            },
        },
        {
            name: "feedback-auth-exception-scope",
            comment:
                "The grandfathered auth import above is only for the feedback screen; any other " +
                "feature importing auth data is an error.",
            severity: "error",
            from: {
                path: "^src/features/([^/]+)/",
                pathNot: "^src/features/(auth|feedback)/",
            },
            to: { path: "^src/features/auth/data/" },
        },
        {
            name: "domain-stays-pure",
            comment: "Domain modules must not import ui, data, or react-native.",
            severity: "error",
            from: { path: "^src/(features/[^/]+|shared)/domain/" },
            to: {
                path: "(^src/features/[^/]+/(ui|data)/|^src/shared/ui/|^node_modules/react-native/)",
            },
        },
        {
            name: "shared-is-a-leaf",
            comment:
                "shared/ must not import features or app. Grandfathered: EtjenestenFooter reads " +
                "the session to toggle the volunteer link; fix is a presentational split.",
            severity: "error",
            from: {
                path: "^src/shared/",
                pathNot: "^src/shared/ui/EtjenestenFooter\\.tsx$",
            },
            to: { path: "^src/(features|app)/" },
        },
        {
            name: "routes-are-thin",
            comment: "Route files import only feature ui/vm, app, and shared.",
            severity: "error",
            from: { path: "^src/routes/" },
            to: {
                path: "^src/",
                pathNot: "^src/(features/[^/]+/(ui|vm)/|app/|shared/|routes/)",
            },
        },
    ],
    options: {
        doNotFollow: { path: "node_modules" },
        exclude: { path: "(__tests__|\\.test\\.tsx?$)" },
        tsPreCompilationDeps: true,
        tsConfig: { fileName: "tsconfig.json" },
        enhancedResolveOptions: {
            exportsFields: ["exports"],
            conditionNames: ["import", "require", "node", "default"],
        },
    },
}
