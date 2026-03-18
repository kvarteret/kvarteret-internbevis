# Song Nomination & Voting for Grøndahls

## Context

When Grøndahls bar is open, the app shows a "Grøndahls er åpen" hero card with the currently playing Spotify track. We want to let authenticated users nominate and vote on songs to be queued next. Every configurable period (default 30 min), the top-voted song gets added to Spotify's playback queue.

## Design Overview

**Voting rounds** are time-based (default 30 min). Rounds are created lazily on first request when Grøndahls is open. When a round expires, the backend closes it, picks the winner (most votes, tiebreak: earliest nomination), and POSTs it to Spotify's queue API. A new round starts on the next request.

**User constraints**: 1 nomination per round, 1 vote per nomination. Nominating auto-votes for your own track.

---

## 1. Backend: Database Schema

Add 3 tables via Supabase migration. Define in `kvarteret-personal/app/db/table_defs/public.py`.

**`song_voting_rounds`**
| Column | Type | Notes |
|---|---|---|
| id | BIGINT PK (generated) | |
| started_at | TIMESTAMPTZ NOT NULL | |
| ends_at | TIMESTAMPTZ NOT NULL | |
| winning_track_uri | TEXT | nullable, set on close |
| queued_at | TIMESTAMPTZ | nullable, set after Spotify queue success |
| status | TEXT NOT NULL DEFAULT 'active' | active / closed / queued / failed |

Partial unique index: `(status) WHERE status = 'active'` — prevents concurrent active rounds.

**`song_nominations`**
| Column | Type | Notes |
|---|---|---|
| id | BIGINT PK (generated) | |
| round_id | BIGINT FK rounds | |
| person_id | BIGINT NOT NULL | |
| track_uri | TEXT NOT NULL | Spotify URI |
| track_name | TEXT NOT NULL | |
| track_artists | TEXT NOT NULL | |
| track_album | TEXT | |
| track_image_url | TEXT | |
| nominated_at | TIMESTAMPTZ NOT NULL | |

Unique: `(round_id, person_id)`, `(round_id, track_uri)`.

**`song_votes`**
| Column | Type | Notes |
|---|---|---|
| id | BIGINT PK (generated) | |
| nomination_id | BIGINT FK nominations | |
| person_id | BIGINT NOT NULL | |
| voted_at | TIMESTAMPTZ NOT NULL | |

Unique: `(nomination_id, person_id)`.

## 2. Backend: Configuration

Add to `Settings` in `app/config.py`:
- `song_voting_round_duration_minutes: int = 30`
- `song_voting_enabled: bool = False`

## 3. Backend: Service Layer

### `app/services/now_playing.py`
Expose `async get_access_token() -> str` wrapping `_refresh_access_token()`.

### New: `app/services/song_voting_repository.py`
SQLAlchemy Core repository with methods: `get_active_round`, `create_round`, `close_expired_rounds`, `create_nomination` (+ auto-vote in transaction), `get_nominations_for_round` (with vote counts), `has_user_nominated`, `cast_vote`, `remove_vote`, `get_round_winner`.

### New: `app/services/song_voting.py`
`SongVotingService` orchestrates:
- **`get_round_state(person_id)`** — lazy-creates rounds, lazy-closes expired rounds, returns current state
- **`search_tracks(query)`** — proxies to Spotify Search API (`GET /v1/search?type=track`)
- **`nominate_track(person_id, track_info)`** — creates nomination + auto-vote
- **`toggle_vote(person_id, nomination_id)`** — adds or removes vote
- **`_add_to_spotify_queue(track_uri)`** — `POST /v1/me/player/queue?uri={uri}`
- **`_is_grondahls_open(now)`** — server-side opening hours check (mirrors frontend logic)

### Auth dependency
New in `app/dependencies.py`:
```python
async def get_mobile_card_person_id(authorization, service) -> int
```
Extracts `person_id` from Bearer token via `MobileCardService.get_current_card()`.

## 4. Backend: API Endpoints

New router: `app/api/v1/song_voting.py`, prefix `/api/v1/song-voting`.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/round` | Bearer | Current round state + nominations + user's votes |
| GET | `/search?q=...` | Bearer | Spotify track search (min 2 chars) |
| POST | `/nominations` | Bearer | Nominate a track (body: track info) |
| POST | `/nominations/{id}/votes` | Bearer | Toggle vote on nomination |

Wire into `app/api/router.py` and `ApplicationContainer`.

## 5. Frontend: Data Layer

### `src/features/song-voting/data/songVotingRepository.ts`
- `fetchRoundState(signal)` — GET `/api/v1/song-voting/round` with Bearer token
- `searchTracks(query, signal)` — GET `/api/v1/song-voting/search?q=...`
- `nominateTrack(track)` — POST `/api/v1/song-voting/nominations`
- `toggleVote(nominationId)` — POST `/api/v1/song-voting/nominations/{id}/votes`

Auth token read from SecureStore via `getSessionValue(SESSION_STORAGE_KEYS.accessToken)`.

### `src/features/song-voting/domain/types.ts`
TypeScript interfaces for RoundState, NominationWithVotes, TrackSearchResult.

## 6. Frontend: UI Components

### `src/features/song-voting/ui/SongVotingPanel.tsx`
Main component rendered inside `OpeningStatusHero` on `KvarteretScreen`, below `NowPlayingWidget`. Shows:
- "Stem på neste sang" header with countdown timer
- Sorted nomination list with vote buttons
- "Nominer en sang" button (disabled if already nominated)
- Previous round winner display

Polls `GET /round` every 15 seconds when focused and venue is open.

### `src/features/song-voting/ui/NominationList.tsx`
Renders nominations sorted by vote count. Each item: album art thumbnail, track name/artist, vote count, vote button.

### `src/features/song-voting/ui/TrackSearchModal.tsx`
Modal with search input (debounced 300ms), results list, "Nominer" button per result.

### `src/features/song-voting/ui/RoundTimer.tsx`
Countdown from `timeRemainingSeconds`. Local tick via `setInterval(1000)`, resyncs on poll.

### `src/features/song-voting/ui/VoteButton.tsx`
Heart icon, filled when voted. Uses `useMutation` with optimistic updates.

## 7. Frontend: Integration

In `KvarteretScreen.tsx`, render `<SongVotingPanel />` inside the `OpeningStatusHero` card, after `NowPlayingWidget`. Only when `isVenueOpen && !isAnonymous && user`.

Add Norwegian/English translations to `translations.ts`.

## 8. Implementation Order

### Phase 1: Backend (kvarteret-personal)
1. Add config settings
2. Create Supabase migration + table definitions
3. `SongVotingRepository`
4. Expose `get_access_token()` on `NowPlayingService`
5. `SongVotingService`
6. Auth dependency `get_mobile_card_person_id`
7. API endpoints + router wiring
8. Wire into `ApplicationContainer`

### Phase 2: Frontend (kvarteret-internbevis-rn)
1. Domain types
2. Data layer (repository)
3. UI components (VoteButton, RoundTimer, NominationList, TrackSearchModal, SongVotingPanel)
4. Integrate into KvarteretScreen
5. Translations

## 9. Verification

- **Backend**: Run existing test suite + new tests for song voting endpoints
- **Frontend**: Manual testing in Expo dev — open the app during Grøndahls hours (or temporarily bypass the hours check), verify search/nominate/vote flow
- **Integration**: Confirm Spotify queue API works (requires re-authorizing refresh token with `user-modify-playback-state` scope)

## 10. Pre-requisites

- Spotify refresh token must be re-authorized with `user-modify-playback-state` scope (manual one-time OAuth flow)
- Supabase migration must be applied before deploying backend

## Key Files

- `kvarteret-personal/app/db/table_defs/public.py` — table definitions
- `kvarteret-personal/app/services/now_playing.py` — expose access token method
- `kvarteret-personal/app/config.py` — new settings
- `kvarteret-personal/app/runtime.py` — wire new service
- `kvarteret-personal/app/dependencies.py` — auth dependency
- `kvarteret-personal/app/api/router.py` — register new router
- `kvarteret-internbevis-rn/src/features/dashboard/ui/screens/KvarteretScreen.tsx` — integration point
- `kvarteret-internbevis-rn/src/core/storage/sessionStorage.ts` — auth token access
- `kvarteret-internbevis-rn/src/app/localization/translations.ts` — i18n strings
