# Autonomy: scheduling and configuration

Covers `mcp__cherry-tools__cron` and `mcp__cherry-tools__config`.

## Scheduling — `mcp__cherry-tools__cron`

Schedules local work inside Cherry. Never use OS `crontab`, `at`, or a background shell loop for user-facing schedules — Cherry owns execution and lifecycle.

Actions:

- **`add`** — create a recurring or one-time job with exactly one trigger shape.
- **`list`** — list existing jobs.
- **`remove`** — delete a job.

## Configuration — `mcp__cherry-tools__config`

Use `status` to inspect the agent, `rename` to change its name, and
`complete_bootstrap` / `reset_bootstrap` to manage onboarding.
