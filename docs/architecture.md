# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep route-level presentation in React and use the shared API client for relative `/api` requests. Each capability view owns its loading, success, empty, and accessible error states; do not duplicate business rules in the UI.
- Logic tier decision: Keep request validation and capability behavior in the Express routes/services. Return the documented response envelopes and deliberate 4xx responses for invalid input or unknown users; keep persistence details in the data tier.
- Data tier decision: Use Mongoose models for required fields, references, and defaults. Keep seed data representative and idempotent, preserving unrelated existing records.
- Activity tracking approach: Validate the submitted user and team IDs before querying, reject malformed or missing references with a 4xx, and create the activity with the submitted type/minutes, points computed from minutes, and a server-generated `occurredAt`.
- Team management approach: Require a non-empty name and mascot, default members to an empty array, and persist the supplied member IDs so create and list responses retain the team fields and members.
- Leaderboard approach: Aggregate activity points by team, order totals descending, and return each team name, total, and 1-based rank.
- Workout suggestions approach: Find the requested user by email, use that user's goal and recent activities to select and explain the most relevant workout, and return a deliberate 4xx when no user matches.

Implement in dependency order: data constraints and seeds, logic-tier behavior, then presentation integration. At each step, run that tier's focused contract tests before moving on.

## Test plan

Run the focused contract tests after changes in their tier. A failure indicates the corresponding tier no longer meets its documented contract:

- Data tier: `npm run test:data --prefix octofit-tracker/backend` checks model validation/defaults and repeatable, non-destructive seeding. Failures point to schema or seed behavior.
- Logic tier: `npm run test:api --prefix octofit-tracker/backend` checks endpoint status codes, activity/team persistence, leaderboard ordering, and user-specific workout suggestions. Failures point to route or service behavior.
- Presentation tier: `npm test --prefix octofit-tracker/frontend` checks API integration, rendered capability data, and loading, empty, and accessible error states. Failures point to client or presentation behavior.
- Backend build: `npm run build --prefix octofit-tracker/backend` type-checks the Express/TypeScript application; failures indicate backend compile-time errors.
- Frontend build: `npm run build --prefix octofit-tracker/frontend` type-checks and bundles the Vite application; failures indicate frontend compile-time or bundling errors.

Baseline observed before implementation: the data suite has 4 failing validation tests and 1 passing seed test; all 4 API tests fail; all 15 frontend tests fail because the capability views remain pending.
