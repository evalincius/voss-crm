# Global Quick Search Decision

**Status**: EXPLICITLY DEFERRED

**Date**: 2026-02-15

## Decision

Global quick search is **deferred** from Phase 2. It was identified as optional in the PRD (`R39`: "decide/implement optional global quick search") and is not required for release.

## Rationale

1. The Quick Add menu in the header already provides fast entity creation entry points.
2. Individual list views (People, Deals, Campaigns, Products, Templates) all have dedicated search/filter controls.
3. Adding global search would require a cross-entity search API, ranking/relevance logic, and a command-palette UI component — scope that exceeds the polish intent of D6.
4. No user feedback or workflow blockers have surfaced that would promote this from optional to required.

## Future considerations

If global quick search is promoted in a future phase:

- Consider a command-palette pattern (Cmd+K / Ctrl+K) using Radix Dialog
- Search across people, deals, campaigns, products, templates
- Rank by recency and relevance
- Debounced search with loading states
