import { QueryClient } from "@tanstack/react-query"

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 500,
            gcTime: 1000 * 60 * 5,
        },
    },
})
