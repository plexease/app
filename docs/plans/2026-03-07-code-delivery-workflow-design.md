# Code Delivery Workflow — Design

> **Context:** With Phase 7 complete (GitHub Actions CI, fast/slow test split), the project needs a mature code delivery process. Previously all work was committed directly to main. This design formalises the workflow.

---

## Tiers

| Tier | When | Path | Examples |
|------|------|------|----------|
| **PR (default)** | Any change that affects behaviour | Branch → push → CI fast tests → open PR → CI fast+slow → Claude Code review → squash merge | Features, bug fixes, refactors, test changes |
| **Direct-to-main (exception)** | Emergency hotfix or purely cosmetic | Temporarily disable branch protection → push → re-enable | Typo in copy, docs-only wording, critical production fix |

The exception tier is deliberately high-friction. Disabling branch protection requires manual GitHub settings changes.

---

## Branch Naming

| Prefix | Use |
|--------|-----|
| `feature/description` | New functionality |
| `fix/description` | Bug fixes |
| `refactor/description` | Code restructuring |

---

## Session Flow

Each phase uses 3 focused sessions for fresh context:

| Session | Purpose | Output |
|---------|---------|--------|
| 1. Design | Brainstorm, architecture, edge cases, write plan | `docs/plans/YYYY-MM-DD-<topic>-design.md` |
| 2. Build | Implement plan on feature branch, open PR | Branch pushed, PR open, CI running |
| 3. Review | Claude Code reviews PR diff, fixes issues, iterates until CI green, merges | Squash merged to main via PR |

**How to run this:**
1. Start session → brainstorm & write plan → end session
2. Start session → say "implement `docs/plans/<plan>.md`" → end session
3. Start session → say "code review phase N" → end session

**When to stay in one session:** small fixes, hotfixes, or tasks that take < 10 minutes total.

---

## CI Gates

- **Push to any branch:** fast tests run (immediate feedback during build session)
- **PR to main:** fast + slow tests both run and must pass
- **Merge:** requires passing CI status checks + PR review

---

## Branch Protection Rules (GitHub)

Applied to `main`:
- Require PR to merge (no direct push)
- Require status checks to pass: `test-fast`, `test-slow`
- Squash merge only (one clean commit per PR on main)
- Auto-delete branches after merge

---

## PR Template

`.github/pull_request_template.md` with standard format:
- Summary (bullet points)
- Test plan (checklist)
- Generated-by attribution

---

## Implementation Checklist

1. Update CI workflow: fast tests on push to all branches, not just main
2. Create `.github/pull_request_template.md`
3. Configure GitHub branch protection rules on main
4. Configure GitHub repo settings: squash merge only, auto-delete branches
5. Update PLEXEASE.md workflow section
