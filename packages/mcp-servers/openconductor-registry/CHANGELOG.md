# Changelog

## 1.1.2

Fixes so the registry tools actually return live data. The package had been
built against an API spec that did not match what shipped.

### Fixed
- **Response envelope unwrap.** The live API wraps every response in
  `{ success, data, meta }`. The client now reads from `data` everywhere
  instead of the top level (previously every tool returned empty/undefined).
- **Server field normalization.** API servers use a nested shape
  (`repository.url`, `repository.owner`, `stats.stars`, `stats.installs`, and
  `tagline` on summaries). A normalizer maps these into the flat shape the tool
  renderers expect, so names, descriptions, stars, installs, GitHub URLs and
  authors render correctly.
- **`search_servers`** now calls `/v1/servers/search` (was `/v1/search`) and
  unwraps the nested `data.results[].server` search-result shape.
- **`get_server_details`** now reads the server from `data` instead of returning
  the raw envelope.
- **`list_stacks` / `get_stack_details` / `share_stack`** now call `/v1/stacks*`
  (were missing the `/v1` prefix and hitting 404). `list_stacks` also handles
  the currently-empty stack list gracefully.
- **`get_category_stats`** rewritten to read `data.filters.availableCategories`
  (server counts per category) that the API already returns on every list call —
  the old `/v1/stats/categories` endpoint does not exist (404).

### Removed
- **`get_trending_servers`.** The API has no `/v1/trending` endpoint and the
  trending semantics were undefined, so the tool was removed entirely.
