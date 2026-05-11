# Feature Specification: Definition of Done verification (#56)

**Backlog ID**: #56
**Input**: Verify Definition of Done (`spec.md` §13): site reachable
& loads <8 s broadband cold cache; all 8 lessons run end-to-end;
Notes sections populated; terminal feature set complete;
workspace persistence + Reset working; CI green; README + version
pinning done.

## User Scenarios

### US1 — DoD checklist signed off (P1)
The author walks the §13 checklist item by item against the
current state of the epic branch (and where required, the
deployed Pages site) and records pass/fail/post-merge-required
for each. The output is a checklist file under
`specs/046-dod-verification/checklists/dod.md` and a brief
summary in this spec.

## Requirements
- **FR-001**: Each §13 item has a recorded status:
  PASS / NEEDS-DEPLOYED / DEFERRED-TO-#57.
- **FR-002**: PASS items cite the artefact (file, command,
  commit) used to verify.
- **FR-003**: NEEDS-DEPLOYED items are deferred to post-merge
  verification (the epic branch can't be deployed until merged
  to `main`).
- **FR-004**: DEFERRED-TO-#57 items are blocked by the v1.0 tag
  itself.

## Success criteria
- **SC-001**: Every checklist item is in one of the three states
  above. No items are in unknown state.
