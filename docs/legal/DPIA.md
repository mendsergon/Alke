# Data Protection Impact Assessment — Alke

> **DRAFT — belongs to Phase 4 per PLAN.md §7; not reviewed**

> **DRAFT — NEEDS REVIEW.** Not legal advice. Prepared as a starting point for review by a qualified Greek data-protection lawyer before any public or contractual use.

**Document owner:** Stavros Kaloumenos (sole trader, ατομική επιχείρηση)
**Version:** 0.1 (draft)
**Date:** 2026-09-21
**Status:** Pre-launch draft, written at Phase 0. It describes a system that does not exist yet.

Legal basis for the document: GDPR Art. 35. Written by an engineer, not a lawyer. Every point where a legal conclusion is required is marked `[TO CONFIRM WITH COUNSEL: (DPIA-n) …]` rather than guessed. Counsel should treat those marks as the worklist; they are collected in `README.md`.

---

## 0. How to read this

| Section | Art. 35(7) requirement |
|---|---|
| §2, §3 | (a) systematic description of the processing and its purposes |
| §5 | (b) necessity and proportionality |
| §6 | the Art. 9 condition relied on |
| §8 | (c) risks to the rights and freedoms of data subjects |
| §9 | (d) measures to address the risks |
| §10 | residual risk and Art. 36 prior consultation |
| §11 | review triggers |

---

## 1. Controller and contacts

| Field | Value |
|---|---|
| Controller | Stavros Kaloumenos, sole trader (ατομική επιχείρηση), Greece |
| Trading name | Alke |
| Registered address | `[registered address]` |
| VAT number (ΑΦΜ) | `[VAT number]` |
| Contact for data protection | `[contact email]` |
| Data Protection Officer | None appointed. See DPIA-1. |
| Art. 27 representative | Not required — the controller is established in the EU. |
| Supervisory authority | Hellenic Data Protection Authority (HDPA / ΑΠΔΠΧ) |

`[TO CONFIRM WITH COUNSEL: (DPIA-1) Whether Art. 37(1)(c) requires a DPO. The core activity includes processing Art. 9 health data about members of gyms; the question is whether it is "on a large scale" at expected launch volume, and at what point it becomes so. A trigger threshold should be written into §11 rather than left to judgement.]`

`[TO CONFIRM WITH COUNSEL: (DPIA-2) Whether this processing appears on the HDPA's Art. 35(4) list of operations requiring a DPIA, and whether any Art. 35(5) exemption list is relevant. The list, not our own assessment, decides whether the DPIA is mandatory rather than merely prudent.]`

---

## 2. Description of the processing

### 2.1 What Alke is

Alke is a mobile strength-training application (iOS first, then Android) with three parts: a training logger and rule-based programming engine, a business-to-business gym directory, and (later) a structured social layer. It is operated by a single Greek sole trader. There is one anchor gym customer from launch.

Two classes of user:

- **Members** — individuals who log their training. They may belong to a gym or to none.
- **Gym owners** — businesses that describe their equipment, publish programs and announcements, and see aggregate usage statistics for their gym. Owners use a separate web dashboard.

### 2.2 Data flows

```
Phone (Expo / React Native)
  └── local SQLite, encrypted with SQLCipher; key in the OS keychain (expo-secure-store)
        │   local database is the source of truth; app is fully usable offline
        ▼  append-only outbox, idempotent replay, pull by server `updated` timestamp
PocketBase server (Go extension) on an EU VPS (Hetzner by default)
        ├── per-collection API rules, default `null` (superuser-only)
        ├── aggregates for gym owners computed server-side, suppressed below 5 active members
        └── encrypted backups to a separate EU bucket
  Processors: email delivery, error monitoring (Sentry), build/OTA (Expo/EAS),
              consumer subscriptions (RevenueCat), owner billing (Stripe)
```

### 2.3 Categories of personal data

| Group | Data | Sensitivity |
|---|---|---|
| Account | Email address, bcrypt password hash (cost 12), token key, email-verification state, account creation and update timestamps, display name | Ordinary |
| Device / technical | IP address at request time, rate-limiter counters, app and OS version, error events with PII scrubbed | Ordinary |
| Training log | Sessions; per set: exercise, weight (stored in kg), reps, optional RIR, optional form rating (1–3), set type; timestamps; rest timer usage | Ordinary, but see §8 R5 |
| Derived analytics | e1RM values and trends, personal records, weekly fractional set volume per muscle, weekly rollups, stall and deload flags | Ordinary, but see §8 R5 |
| Bodyweight | Bodyweight entries over time (from Phase 5) | See DPIA-3 |
| **Wellness check-in** | **Daily Hooper-style check-in: sleep quality, sleep hours, fatigue, stress, soreness, mood (from Phase 5)** | **Art. 9 health data** |
| Weekly report | Recovery and deload recommendations derived from the training log and the check-in | **Art. 9 (derived)** |
| Gym relationship | Gym membership records, join date, join-code redemptions, active-gym selection, equipment profile | Ordinary |
| Programs | User-created, forked and shared programs; program versions | Ordinary |
| Commerce | Subscription and entitlement state, store transaction identifiers, RevenueCat app user id; for gym owners, billing and invoicing data | Ordinary |
| Consent | Consent records for the check-in feature: what was consented to, when, the wording shown, and withdrawal events | Ordinary (but evidences Art. 9 processing) |
| Housekeeping | Tombstones for deleted records, outbox entries, sync cursors | Ordinary |

`[TO CONFIRM WITH COUNSEL: (DPIA-3) Whether a time series of bodyweight is Art. 9 health data on its own. Our working assumption is that a bodyweight series held alongside a daily fatigue/sleep/mood log and a full training history reveals information about health status and should be handled as Art. 9 in practice, even if a single weight reading would not be. If counsel agrees, the Phase 5 consent screen must cover bodyweight as well as the check-in, and ROPA.md activity A5 changes accordingly.]`

### 2.4 Categories of data subject

Adult and adolescent members (minimum age 15), gym owners and their staff who hold dashboard accounts, and — for shared programs — any member whose program is forked by another member (the program content, not their logs).

### 2.5 Phasing — this matters for the DPIA

Per `PLAN.md` §7, the Art. 9 processing does **not** ship at launch:

| Phase | Relevant to this DPIA |
|---|---|
| 1–3 | Training logs, gyms, sync, owner dashboard. No health data as defined in §2.3. |
| 4 | Store launch. This DPIA is finalised, the privacy policy is published, every DPA is signed. |
| **5** | **Check-ins, weekly reports and bodyweight ship. First Art. 9 processing. The explicit-consent screen, the withdrawal path and the DPIA update ship with them.** |
| 6 | Owner analytics at scale; structured social. Both change the risk picture (§11). |

**This DPIA must be revisited and re-approved before any Phase 5 code that collects a check-in is released.** The Phase 5 revision is not an edit — it is the first version of this document that describes live Art. 9 processing. Until then, §6, §8 R5, R6, R11 and R12 describe planned rather than actual processing.

---

## 3. Purposes

1. To let a member record and retain their own training history, offline and across devices.
2. To compute training analytics (e1RM, personal records, weekly volume) and show them back to that member.
3. To generate and adjust training programs deterministically from that member's own performance signals.
4. To let a member associate with a gym so that available equipment constrains their programs, and so that the gym's published programs and announcements reach them.
5. **(Phase 5)** To let a member record a daily wellness check-in so the engine can modulate — never drive — training recommendations, and to produce a weekly recovery report with a deload flag.
6. To give gym owners aggregate, non-identifying usage statistics for their own gym.
7. To operate the service: authentication, abuse prevention, billing, support, backups, and compliance with tax and accounting obligations.

---

## 4. Lawful bases

| Processing | Art. 6 basis | Art. 9 condition |
|---|---|---|
| Account, authentication, training log, sync, analytics, programs, gym membership | 6(1)(b) performance of a contract | n/a |
| **Wellness check-in and the reports derived from it** | **6(1)(a) consent** | **9(2)(a) explicit consent** |
| Security logging, rate limiting, abuse and fraud prevention | 6(1)(f) legitimate interests | n/a |
| Gym owner aggregate statistics | 6(1)(f) legitimate interests — see DPIA-4 | n/a (aggregates must contain no Art. 9 data — see R2) |
| Invoicing, accounting and myDATA e-invoicing | 6(1)(c) legal obligation | n/a |
| Retaining consent records to evidence compliance | 6(1)(c) / 6(1)(f) — see DPIA-5 | n/a |

`[TO CONFIRM WITH COUNSEL: (DPIA-4) The correct Art. 6 basis for computing gym-owner aggregates from member data, and whether a Legitimate Interests Assessment is required and should be appended to this DPIA. Related: whether the gym is a separate controller, a joint controller under Art. 26, or neither. Our position is that Alke is sole controller of member data and the gym receives only anonymised output, but the gym also publishes programs and announcements to its members, which counsel may read differently.]`

`[TO CONFIRM WITH COUNSEL: (DPIA-5) How long consent records may and must be kept after consent is withdrawn, and under which basis. Art. 7(1) requires the controller to be able to demonstrate consent; that implies keeping the record beyond withdrawal, which is in tension with erasure. A specific retention period is needed for ROPA.md activity A17.]`

---

## 5. Necessity and proportionality (Art. 35(7)(b))

**Necessity.** The training log is the product; without it there is no service. The check-in is not: the application is designed to be fully usable without it, and `PLAN.md` §1.5 states that wellness and soreness data only modulate the engine's decision and are never the primary driver — performance signals (e1RM trend, reps at a given RIR, sets completed) are. The check-in therefore improves a recommendation the engine can already make. This is exactly why consent, not contract, is the basis: it cannot be presented as necessary to the service.

**Data minimisation.**

- The check-in is six fields and is specified to take under 20 seconds. No free text, no symptoms, no medication, no menstrual cycle, no injury descriptions, no heart rate, and no integration with Apple Health or Google Fit. Adding any of those is a new DPIA.
- Weight is always stored in kg; unit display is a view setting, not a second stored value.
- Warm-up sets are excluded from every metric but are still stored, because the member logged them.
- Gym owners receive counts, never rows.

**Proportionality.** The intrusiveness is concentrated in the *combination*, not in any single field (§8 R5). Proportionality therefore rests on four design commitments, each of which must actually ship:

1. The check-in opt-in is separate and unbundled from account creation and from any other consent.
2. Withdrawal is as easy as giving consent, and is reachable from the same screen area.
3. The application stays fully functional with the check-in off — not degraded, not nagged.
4. Check-in values are never written to any log, crash report or analytics event.

`[TO CONFIRM WITH COUNSEL: (DPIA-6) Whether withdrawal must also offer deletion of previously collected check-in data, or whether it is sufficient to stop future collection and offer erasure as a separate right. Our recommendation is to delete on withdrawal by default, with an explicit "keep my history" option, because a member who withdraws is unlikely to expect the history to remain.]`

**Alternatives considered and rejected.**

| Alternative | Why rejected |
|---|---|
| No check-in at all | It is a product requirement in `PLAN.md` §1.6. It is deferred to Phase 5, which is the mitigation actually taken. |
| On-device only, never synced | Would break the multi-device and restore-after-loss expectation the rest of the app sets. Recorded as an option counsel may prefer — see DPIA-7. |
| Coarser scales (for example 3-point instead of Hooper's 7-point) | Reduces signal below usefulness for a deload flag. Revisit if counsel considers the granularity disproportionate. |
| Contract as the basis | Rejected: the feature is optional by design, so it cannot be necessary for the contract. |

`[TO CONFIRM WITH COUNSEL: (DPIA-7) Whether keeping check-in data on-device only (never synced to the server) would materially change the assessment. If counsel thinks the transfer to the server is the sensitive step, this is a design decision that must be taken before Phase 5 implementation, not after.]`

---

## 6. The Art. 9 justification

Art. 9(1) prohibits processing health data unless an Art. 9(2) condition applies. The condition relied on is **Art. 9(2)(a), explicit consent**, together with Art. 6(1)(a).

For that consent to be valid it must be freely given, specific, informed, unambiguous **and explicit**. In practice:

| Requirement | How it is met |
|---|---|
| Explicit | A dedicated screen with a clear affirmative act naming health data. Not a checkbox inside the terms; not a pre-ticked box; not "continue means you agree". |
| Specific | Consent covers the daily check-in and the weekly report derived from it, named individually. Bundled consent is invalid. |
| Informed | The screen states what is collected, why, that it is health data, who it goes to, how long it is kept, and that it can be withdrawn at any time. |
| Freely given | The app is fully usable without it. No feature outside the check-in and the weekly report is gated on it. No repeated prompting. |
| Withdrawable | Withdrawal is one action in settings, no harder than the opt-in, effective immediately, with no consequence beyond the check-in stopping. |
| Demonstrable (Art. 7(1)) | A consent record stores the version of the wording shown, the timestamp and the action taken. |

`[TO CONFIRM WITH COUNSEL: (DPIA-8) Whether a 15-year-old can give valid explicit consent under Art. 9(2)(a) in Greece. Greek Law 4624/2019 Art. 21 sets the age for information-society-service consent at 15, and PLAN.md §6 sets 15 as the minimum age. It does not follow that a 15-year-old can validly consent to Art. 9 health processing; parental authorisation may be required, or the check-in may need an 18+ gate. This is the single highest-impact open question in this document, because it may require an age check we have not designed.]`

`[TO CONFIRM WITH COUNSEL: (DPIA-9) Whether any Greek national provision under Art. 9(4) imposes further conditions or limitations on processing health data that apply to a service like this.]`

---

## 7. Consultation

| Party | Status |
|---|---|
| Data subjects or their representatives (Art. 35(9)) | Not yet consulted. Recommendation: put the check-in consent wording and the weekly report in front of a small group of anchor-gym members before Phase 5 ships, and record their reaction here. |
| DPO | None appointed (DPIA-1). |
| Processors | DPAs to be signed with every processor before Phase 4 (`PLAN.md` §6). |
| Counsel | Not yet consulted. This document is the brief. |
| HDPA | Not consulted. See §10 on Art. 36. |

---

## 8. Risks to data subjects (Art. 35(7)(c))

Risk is assessed from the point of view of the data subject, not the business. Scoring: likelihood and severity each Low / Medium / High, before mitigation.

### R1 — One member's data exposed to another (broken object-level authorisation)

*Likelihood before mitigation: High. Severity: High.* `PLAN.md` §5 names BOLA as the number one risk and it is correct to. A single missing filter on a collection exposes another member's complete training history and, from Phase 5, their wellness log. The fact that PocketBase API rules are strings makes a silent mistake easy.

### R2 — Re-identification of an individual from gym aggregates

*Likelihood: Medium. Severity: Medium–High.* A minimum cohort size of 5 active members is a k-anonymity threshold, and k-anonymity is weak against an adversary who can query repeatedly over time. A gym owner who knows their own members can run differencing attacks: observe an aggregate before and after a member joins, leaves, or goes on holiday, and attribute the difference. In a 6-member gym with 5 shown, the owner may effectively see one member's data. This risk grows, not shrinks, when Phase 6 adds richer owner analytics.

### R3 — Device loss or theft

*Likelihood: Medium. Severity: Medium–High.* The local database is the source of truth and holds the member's full history. A phone is lost far more often than a server is breached.

### R4 — Health data leaking into logs, crash reports or analytics

*Likelihood: Medium. Severity: High.* The dangerous path is not deliberate logging; it is an exception object, a request body captured by an error monitor, a breadcrumb, or a debug build that reaches TestFlight. `PLAN.md` §5 forbids logging check-in values, credentials, tokens and emails, but a rule that is not enforced by a test is a wish.

### R5 — Inference: the combination is far more sensitive than any field

*Likelihood: High (it is inherent, not accidental). Severity: High.* This is the central risk of the product and must not be understated. A daily log of sleep, fatigue, stress, soreness and mood, held alongside a multi-year training log and a bodyweight series, is a detailed behavioural and health profile. From it one can plausibly infer: illness and injury episodes; periods of depression or burnout; disordered eating; pregnancy; shift work and sleep disorders; substance use patterns; and — from gaps and timing — daily routine and absence from home. None of these are fields we collect. All of them are inferences the dataset supports. Any recipient of a full export — an attacker, an insurer, an employer, an abusive partner with access to the phone — gets that profile, not six numbers.

### R6 — Consent that is not valid

*Likelihood: Medium. Severity: High.* If the opt-in is bundled, pre-ticked, nagged, or if any unrelated feature is gated behind it, the Art. 9(2)(a) condition fails and the processing has no lawful basis at all. The failure mode is total, not partial.

### R7 — Third-country transfers becoming unlawful

*Likelihood: Medium. Severity: Medium.* Expo/EAS, RevenueCat, Stripe and (unless self-hosted or EU-region) Sentry are US-linked. The EU–US Data Privacy Framework survived the General Court but is under appeal to the CJEU. If the adequacy decision is annulled, every transfer resting on it needs a different safeguard overnight. This is a live risk with a known precedent pattern — it happened twice before, with Safe Harbour and with Privacy Shield.

### R8 — Processor breach or processor misuse

*Likelihood: Medium. Severity: Medium–High.* We control our own server; we do not control Sentry, Expo, RevenueCat or Stripe. A breach there is our notifiable breach.

### R9 — Deletion that does not actually delete

*Likelihood: High without deliberate design. Severity: Medium.* An offline-first system with an outbox, tombstones, weekly rollups, derived aggregates and encrypted backups has many places a record can survive an account deletion. App Store guideline 5.1.1(v) and Google Play both require deletion to work; Art. 17 requires it to be complete.

### R10 — Sync errors attributing data to the wrong record or user

*Likelihood: Low–Medium. Severity: Medium–High.* Last-writer-wins with client-generated UUIDs and clock skew can, if the ID scheme or the conflict granularity is wrong, merge or overwrite records. For health data, wrong attribution is a confidentiality failure and an integrity failure at once.

### R11 — Minors

*Likelihood: Medium. Severity: High.* The minimum age is 15 and gyms have teenage members. If a 15-year-old cannot validly consent to Art. 9 processing (DPIA-8), every check-in from a 15–17 year old is unlawful processing of a child's health data.

### R12 — Pressure from a gym or coach to enable check-ins

*Likelihood: Medium. Severity: High.* There is an anchor gym from day one. A coach who says "turn on check-ins so I can see how you're recovering" undermines "freely given" even though the coach never sees the data. Members may also *believe* the gym sees it, and consent anyway. The imbalance is real even though the data flow is not.

### R13 — Account takeover

*Likelihood: Medium. Severity: High.* Credential stuffing against an email-and-secret login yields the full profile described in R5.

### R14 — Backup exposure

*Likelihood: Low. Severity: High.* Backups contain everything, are held in a second location, and are the one copy most often forgotten in access reviews and deletion flows.

---

## 9. Measures to address the risks (Art. 35(7)(d))

Measures already committed in `PLAN.md` §5 are marked **[committed]**. Measures this DPIA proposes and which are **not yet in `PLAN.md`** are marked **[proposed — needs approval]** and must not be treated as decided.

| Risk | Measures |
|---|---|
| R1 | **[committed]** API rules default to `null` (superuser-only); `""` is never used for create, update or delete. User rows filtered by `@request.auth.id = user`. A cross-user and owner→member authorisation test suite runs in CI and fails closed. Owners never read member rows; aggregates are computed in Go. **[proposed — needs approval]** Every new collection ships with its authorisation test in the same commit, and the CI job is a required check. |
| R2 | **[committed]** Aggregates computed server-side and suppressed below 5 active members. **[proposed — needs approval]** (a) Suppress on the *smaller* of current and previous cohort when a cohort changes size, to blunt differencing; (b) round or band aggregate outputs rather than returning exact counts; (c) never expose any aggregate derived from check-in or bodyweight data to owners at any cohort size — this is the simplest and strongest control and should be written into `PLAN.md` §1.2 if approved; (d) re-assess k=5 before Phase 6 owner analytics. |
| R3 | **[committed]** SQLite encrypted with SQLCipher; the key lives in `expo-secure-store` only, never in AsyncStorage; auth tokens likewise. No jailbreak or root detection (accepted). **[proposed — needs approval]** Require device-level authentication (biometric or passcode) before the check-in history screen, if this does not make withdrawal harder than consent. |
| R4 | **[committed]** Never log check-in values, credentials, tokens or emails. Error reporting scrubs PII. Treat the JS bundle as public. **[proposed — needs approval]** A CI grep over the source and the built bundle for check-in field names in logging call sites, and a Sentry `beforeSend` scrubber with a unit test, so that the rule is enforced rather than remembered. |
| R5 | Mitigated only in part, and honestly so: the profile is the product. What is done: everything under R1, R3, R4, R13 and R14; minimisation (§5); phase deferral to Phase 5; no third-party analytics SDK; no health-platform integration; and transparency — the privacy policy must say plainly what the combined dataset reveals, not just list six field names. |
| R6 | **[committed]** The opt-in is separate and unbundled; withdrawal is as easy as consent; the app is fully usable without it. **[proposed — needs approval]** No more than one prompt for the feature, ever, with a permanent dismissal; version the consent wording and store the version shown. |
| R7 | **[committed]** Everything hosted in the EU (Hetzner by default); US processors minimised; DPAs with every processor. **[proposed — needs approval]** Prefer the EU region of every processor that offers one (Sentry EU or self-hosted is already in `PLAN.md` §7 Phase 4); record for each US processor which safeguard is relied on (adequacy versus SCCs) so that an annulment is a configuration change, not an investigation; keep check-in data out of every US processor entirely. |
| R8 | **[committed]** DPAs signed with every processor before launch. **[proposed — needs approval]** Record each processor's breach-notification commitment and contact in `ROPA.md`, so the breach runbook has somewhere to look at 03:00. |
| R9 | **[committed]** In-app account deletion with cascade plus a web deletion route; JSON export; the Phase 2 exit criterion requires deletion to be verifiably complete. **[proposed — needs approval]** A deletion test that asserts the absence of the user's rows in every collection including rollups, outbox and tombstones; a documented maximum backup age after which deletion is complete in backups too, stated in the privacy policy. |
| R10 | **[committed]** `docs/specs/sync.md` covers the timestamp strategy, idempotent replay with a dead-letter path, conflict granularity per entity, and a test matrix including clock skew and reordering. |
| R11 | Open until DPIA-8 is answered. No measure can be designed before the legal answer. |
| R12 | **[proposed — needs approval]** The consent screen states in one line that the gym and its coaches never see check-in data or any data derived from it, at any cohort size; the owner dashboard says the same. |
| R13 | **[committed]** bcrypt cost 12; email verification required at signup; rate limiting on auth, signup and join-code redemption with a trusted proxy header; "sign out everywhere" rotates the token key; OAuth, if offered, uses PKCE in the system browser. **[proposed — needs approval]** Notify the member by email on a new-device sign-in. |
| R14 | **[committed]** Encrypted backups to a separate EU bucket; restores tested before launch and quarterly; full-disk encryption; secrets in an `EnvironmentFile` with mode 600; SSH keys only; firewall; systemd sandboxing; unattended upgrades. |

---

## 10. Residual risk and Art. 36

Assuming every **[committed]** measure ships and is tested, and the **[proposed]** measures are approved and shipped:

| Risk | Residual |
|---|---|
| R1, R3, R4, R9, R10, R13, R14 | Low — each has a specific technical control with a test. |
| R2 | Medium until the proposed aggregate controls are approved. Low if check-in and bodyweight data are excluded from owner aggregates outright. |
| R7, R8 | Medium and outside our control. Managed, not eliminated. |
| R5 | **Medium.** It cannot be driven lower without not building the product. It is accepted deliberately, on the basis of minimisation, phase deferral, encryption at rest and in transit, strict authorisation, and plain-language transparency. |
| R6, R11, R12 | Cannot be scored until DPIA-6, DPIA-8 and the consent wording are settled. |

**Art. 36 prior consultation.** Art. 36(1) requires consulting the supervisory authority where the DPIA indicates high residual risk that the controller cannot mitigate. This draft's assessment is that residual risk is not high once the measures in §9 ship, and that prior consultation is therefore not required — but that assessment is exactly the kind of legal conclusion this document is not entitled to reach on its own.

`[TO CONFIRM WITH COUNSEL: (DPIA-10) Whether prior consultation with the HDPA under Art. 36 is required before the Phase 5 launch of the check-in, and if not, what would make it required.]`

---

## 11. Review and re-assessment triggers

This DPIA is reviewed, and the review recorded here with a date and an outcome:

- **Before any Phase 5 release that collects a check-in.** Mandatory. This is the first live Art. 9 processing, and the current version describes it only as a plan.
- **Before Phase 6 owner analytics ship**, because R2 changes materially.
- **Before the structured social layer ships**, because sharing training data with other members is a new disclosure.
- Whenever a new category of data is collected — in particular any health-platform integration, heart rate, menstrual cycle, injury notes or free text. Each of those is a new DPIA, not an amendment.
- Whenever a processor is added, removed, or changes the country in which it processes.
- If the EU–US Data Privacy Framework is annulled or amended (R7).
- On any personal data breach involving check-in, bodyweight or report data.
- If the DPO threshold (DPIA-1) is crossed.
- Annually in any case, and at every phase gate that touches the `PLAN.md` §5 security measures.

---

## 12. Sign-off

| Role | Name | Date | Outcome |
|---|---|---|---|
| Controller | Stavros Kaloumenos | | |
| Legal review | `[counsel]` | | |
| DPO | n/a — see DPIA-1 | | |

Unsigned. This is a draft.
