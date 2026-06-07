# Security

## Supported Versions

Glossa is currently an early prototype. Security fixes should target the latest version on the main branch.

## Reporting Issues

Please open a GitHub issue for security-sensitive behavior that does not expose private user data. If a future maintainer email is added, use that for private reports.

## Security Principles

- Do not add hidden network calls.
- Do not automatically submit prompts to third-party model websites.
- Do not collect model answers without explicit user action.
- Keep permissions explainable in `PRIVACY.md`.
- Treat web-model automation as best-effort and user-confirmed.
