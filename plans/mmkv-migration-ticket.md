# Linear ticket draft — encrypt cached member card at rest

No Linear MCP was connected in the session that produced this draft
(2026-07-07). Create the ticket manually from the content below, then delete
this file and update the pointer in `README.md` → "Data storage and PII" and
`plans/full-app-review.md`'s M5b decision-log entry to the ticket URL.

---

**Title:** Encrypt cached member card at rest (migrate off plain AsyncStorage)

**Labels:** security, mobile, tech-debt

**Priority:** Medium — not a live incident, but the longer-term correct state
for M5b (PII-at-rest).

**Description:**

The app caches the member's card (name, birth date, photo URL, active/past
roles — `session_cached_user:v2` in `src/features/auth/data/authRepository.ts`)
in `AsyncStorage`, which is OS-file storage, not hardware-backed like
`expo-secure-store`. The session token itself already lives in SecureStore
(Keychain/Keystore) — this ticket is about the card payload only.

Decision recorded 2026-07-07 (see `plans/full-app-review.md` Decision Log,
M5b): keep AsyncStorage for now. Rationale: the card is ~2–4KB JSON, above
Android Keystore's practical ~2KB limit, so moving it into SecureStore
directly is not viable; AsyncStorage sits on OS-level file encryption and the
cache is cleared on logout, so short-term risk is acceptable.

**Planned fix:** app-layer envelope encryption — a random AES key held in
SecureStore/Keychain, the card payload encrypted at rest in regular storage.
In React Native this is typically implemented with `react-native-mmkv`'s
built-in encryption mode (pass an `encryptionKey` at instance creation,
generated once and stored in SecureStore).

**Why this needs a native-build window:** `react-native-mmkv` is a native
module (JSI-based), so adding it requires a new native build, not just a JS
dependency bump — can't ship via an EAS Update.

**Acceptance criteria:**
- [ ] `react-native-mmkv` (or equivalent) added and initialized with an
      encryption key generated on first launch and stored via
      `expo-secure-store`.
- [ ] `src/features/auth/data/authRepository.ts`'s `getCachedUser` /
      `cacheRawCard` / `clearCachedUser` migrated to the encrypted store.
- [ ] Existing plain-AsyncStorage cache entries are ignored/cleared on
      upgrade (already the case for old-format entries — schema-parse
      failure reads as a cache miss; verify this still holds against the new
      store).
- [ ] Unit tests updated for the new storage backend.
- [ ] `README.md` "Data storage and PII" section updated to describe the new
      storage as SecureStore-backed-key + encrypted MMKV rather than plain
      AsyncStorage.

**References:**
- `plans/full-app-review.md` — M5b in Decision Log and outstanding items.
- `src/features/auth/data/authRepository.ts` — cache read/write functions.
- `src/core/storage/asyncStorage.ts`, `src/core/storage/sessionStorage.ts` —
  current storage seams.
