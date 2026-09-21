# Alke

Alke is a strength-training app: a training logger and programming engine, a gym directory with a paid tier for gym owners, and later a structured social layer. iOS first, then Android.

## Status

Phase 0 — foundations. No app code yet. `PLAN.md` holds the scope, decisions and phases, and is the source of truth.

## Repository layout

    apps/mobile          Expo app
    apps/dashboard       owner web dashboard
    backend/             PocketBase Go extension, migrations, API rules, authz tests
    packages/engine      e1RM, fractional volume, PRs, generator, report rules
    packages/catalog     exercise and equipment seed data
    packages/theme       design tokens shared by mobile and dashboard
    infra/               server hardening, Caddy, systemd, backup and restore
    docs/specs/          data model, sync, authz, engine, versions
    docs/legal/          DPIA, ROPA, privacy policy, terms, breach runbook
    design/              design exports (reference only)

## Ownership

© 2026 Stavros Kaloumenos. All rights reserved. This repository is proprietary. No license is granted to use, copy, modify or distribute any part of it.
