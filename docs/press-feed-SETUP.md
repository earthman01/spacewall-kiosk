# Press feed live refresh

`press.json` is seeded from X interest news (AI, Grok/xAI, Tesla, SpaceX, robots, food, Florida).

To refresh automatically:

1. Add repo secret `X_BEARER_TOKEN` (X API bearer with recent-search access).
2. Copy `docs/press-feed.workflow.yml` to `.github/workflows/press-feed.yml`.
3. Push with a token that has the `workflow` scope (or use the GitHub UI to create the workflow).

Without the secret, the Action stamps `action_checked_at` and keeps the seed cards.
The page also embeds `__PRESS_FEED__` so it never blanks if fetch fails.
