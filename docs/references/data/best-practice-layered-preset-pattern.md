---
description: Current preset layering patterns for Preference-backed catalogs and SQLite-backed entities
sources:
  - src/shared/data/presets
  - src/main/data/services/ProviderRegistryService.ts
---

# Layered Preset Configuration Pattern

Use preset layering when application updates own a stable catalog while users
own only selected overrides. The runtime value is derived in this order:

```text
preset -> persisted user override -> runtime entity
```

Do not persist a full copy of the preset as the override. A full snapshot freezes
old defaults and prevents later application updates from reaching the user.

## Choose the Persistence Owner

The repository currently applies this pattern to SQLite-backed entities.

| Demand | Persistence | Current example |
|---|---|---|
| Entity rows with identity, ordering, CRUD, or relationships | SQLite rows plus a registry/service merge | Providers, models |

The item count is only a hint. The decisive question is whether users are
managing business entities. If they are, use SQLite/DataApi even when the first
catalog is small.

## SQLite-backed Entity

SQLite-backed preset entities keep identity, user-owned fields, ordering, and
relations in their table. The owning service returns the complete runtime entity
by merging preset-only or defaulted fields before the DataApi boundary.

The provider/model services illustrate this ownership:

- `ProviderRegistryService` resolves provider/model registry metadata and applies
  registry overrides. `ProviderService` and `ModelService` own persisted rows;
  callers do not read registry internals and repeat the merge.

Keep the merge in the main-process owner. Returning a row from one endpoint and
preset metadata from another would make every renderer consumer reconstruct the
same entity and let merge semantics drift.

## Preset Files

Preset modules live under `src/shared/data/presets/` and follow the repository's
camelCase TypeScript filename convention. Export names describe the actual
contract (`PRESETS_WEB_SEARCH_PROVIDERS`, `CODE_CLI_TOOL_PRESETS`); there is no mandatory
generic prefix beyond the names
already used by each domain.

Use TypeScript rather than JSON when the preset depends on shared types or
constants. Keep domain behavior outside the preset file: the file declares data,
while the owning service or hook applies overrides and validation.

## Review Checklist

- Is there a current consumer that needs presets plus persisted user changes?
- Is Preference or SQLite the actual owner of those changes?
- Does persistence store a delta rather than a copied preset snapshot?
- Is there one authoritative merge per process that needs the effective value?
- Do reset operations delete the delta instead of writing the current default?
- Do tests cover preset updates, user overrides, and reset behavior?

## Related Documentation

- [Data System Reference](./README.md)
- [Preference Schema Guide](./preference-schema-guide.md)
- [Database Seeding Guide](./database-seeding-guide.md)
