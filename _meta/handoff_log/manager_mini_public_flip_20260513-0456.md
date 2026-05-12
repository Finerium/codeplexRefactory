---
artifact: manager_mini_public_flip
authored_by: Manager Mini-Cycle (orches-v1Refactory_2 spawn)
timestamp: 2026-05-13 04:56-05:00 WIB Day 2 dini hari
predecessor: V5_wave_fixing_2_complete_20260513-0424.md
session_window: Ghaisan asleep 04:30-09:00 WIB, fire-and-forget mode
---

# Manager Mini-Cycle Task 1 + 2: Repo + GHCR PUBLIC flip outcome

## Task 1: GitHub repo PUBLIC flip - VERDICT PASS

**Attempt**: `gh repo edit Finerium/codeplexRefactory --visibility public --accept-visibility-change-consequences`

**Outcome**: SUCCESS silent (gh CLI returned empty output, expected behavior for successful edit).

**Verify post-flip**:
```
gh repo view Finerium/codeplexRefactory --json visibility,isPrivate
{"isPrivate":false,"visibility":"PUBLIC","url":"https://github.com/Finerium/codeplexRefactory"}

curl -sI https://github.com/Finerium/codeplexRefactory
HTTP/2 200

curl -s https://api.github.com/repos/Finerium/codeplexRefactory
private: False, visibility: public
```

**PAT scope used**: gh CLI token `gist, read:org, repo, workflow`. The `repo` scope was sufficient for visibility flip.

**Submission readiness**: Panit can now access source code without authentication at `https://github.com/Finerium/codeplexRefactory`. Technical Execution lens evaluation unblocked.

## Task 2: GHCR container PUBLIC flip - VERDICT FALLBACK-DOC (Ghaisan manual action required)

**Attempt 1**: `gh api -X PATCH /user/packages/container/codeplexrefactory -f visibility=public`
**Outcome**: HTTP 404 "Not Found" (PAT scope insufficient, `admin:packages` absent on gh CLI token).

**Attempt 2**: curl PATCH with `.env` GHCR_TOKEN (scopes `repo, write:packages`)
**Outcome**: HTTP 404 "Not Found" (also missing `admin:packages` for visibility mutation).

**Root cause**: GitHub Packages API requires `admin:packages` scope for visibility flip mutation. Both available tokens (gh CLI keyring + `.env` GHCR_TOKEN) only have `read:packages` + `write:packages`, sufficient for push but not for visibility change.

**Fallback instruction Ghaisan execute pas wake (09:00+ WIB Day 2)**:

```
URL: https://github.com/users/Finerium/packages/container/codeplexrefactory/settings
Action: scroll to bottom "Danger Zone"
Click: "Change visibility"
Select: "Public"
Confirm: type "Finerium/codeplexrefactory" then click "I understand, change repository visibility"
Time: ~30 seconds
```

Alternative: mint new PAT with `admin:packages` scope at `https://github.com/settings/tokens/new`, then run:
```
gh auth refresh -h github.com -s admin:packages
gh api -X PATCH /user/packages/container/codeplexrefactory -f visibility=public
```

**Verify post-flip Ghaisan**:
```
curl -sI https://ghcr.io/v2/finerium/codeplexrefactory/manifests/latest
# Expected: HTTP 200 with image manifest OR 401 with public realm (no auth required)
```

## Risk assessment

**Task 1 unblocked**: Repo public, panit can now access source code.

**Task 2 NOT yet flipped**: GHCR still private. Mitigations preserved per V4/V5 ship state:
- K8s cluster pulls fine via `imagePullSecrets` (ghcr-pull docker-registry secret)
- README known-issue note documented with Web UI flip instruction
- Panit can authenticate with `gh auth login` + `read:packages` scope to inspect via Web UI
- Submission unaffected (deploy live + accessible at public domain)

**Severity**: Low (juror UX nicety, not functional blocker per Atlas R-2 verdict).

## Submission window action timeline

- 04:56 WIB: Manager Mini-Cycle Task 1 SHIP CLEAN (repo PUBLIC)
- 04:57 WIB: Manager Mini-Cycle Task 2 DOCUMENTED-FALLBACK (Web UI instruction)
- 09:00+ WIB: Ghaisan wake-up, run Web UI flip Task 2 (~30 sec)
- 11:00-13:00 WIB: Hafiz submission window, both repo + GHCR fully public + deploy live

Manager Mini-Cycle hands back to Manager Wave-Fixing #2 cycle 2 standby OR Pan post-Wave-Fixing closing cycle.
