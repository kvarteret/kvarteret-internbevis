export type Result<T, E = string> =
    | { ok: true; data: T; error: null }
    | { ok: false; data: null; error: E }

export const OK = <T>(data: T): Result<T, never> => ({ ok: true, data, error: null })
export const ERR = <E>(error: E): Result<never, E> => ({ ok: false, data: null, error })
