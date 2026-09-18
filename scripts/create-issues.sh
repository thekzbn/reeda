#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Reeda – Seed "good first issue" GitHub issues
# Usage:
#   export GH_TOKEN=ghp_yourPersonalAccessToken
#   bash scripts/create-issues.sh
# ---------------------------------------------------------------------------

REPO="thekzbn/reeda"
API="https://api.github.com/repos/$REPO/issues"

post() {
  local title="$1"
  local body="$2"
  local labels="$3"
  curl -s -X POST "$API" \
    -H "Authorization: Bearer $GH_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    -d "{\"title\":$(echo "$title" | jq -Rs .),\"body\":$(echo "$body" | jq -Rs .),\"labels\":$labels}" \
    | jq -r '"\(.number) \(.title)"'
}

echo "Creating issues for $REPO ..."

# 1 ── Keyboard shortcuts reference dialog
post \
  "feat: add keyboard shortcuts reference dialog to the reader" \
  "## Problem Statement

The reader header shows a hint like \`Ctrl+F\` in a tooltip, but there is no
discoverable, in-app listing of all keyboard shortcuts available in the PDF
workspace. New users and contributors cannot easily find out what shortcuts
exist or whether they are implemented.

## Proposed Solution

Add a \`?\` (or \`Shift+?\`) keybinding that opens a small modal or popover in
\`ReaderHeader\` listing every shortcut currently supported in the reader.
The component can live at \`src/components/reader/KeyboardShortcutsDialog.tsx\`.

## Good First Issue notes

- All existing shortcut *hints* are already in tooltip \`title\` props inside
  \`ReaderHeader.tsx\` and \`PdfReader.tsx\` (e.g. \`title=\"Find in document (Ctrl+F)\"\`).
- No new keyboard handling is needed for this issue – just the reference UI.
- Follows Radix UI Dialog pattern already used throughout the app.

## Acceptance Criteria

- [ ] A dialog/popover lists every shortcut currently supported
- [ ] Accessible via \`Shift+?\` and via a visible icon button in the reader header
- [ ] Uses existing Radix \`Dialog\` or \`Popover\` primitive
- [ ] Matches the app's typographic and spacing conventions" \
  '["good first issue","enhancement","accessibility"]'

# 2 ── aria-label audit on segmented workspace control
post \
  "a11y: workspace mode segmented control lacks individual aria-labels" \
  "## Problem Statement

The PDF / Split / Notes segmented control in \`ReaderHeader.tsx\` wraps its
buttons in a \`role=\"group\"\` with \`aria-label=\"Workspace view\"\`, which is
correct. However, the individual \`<button>\` elements use only visible text
(\"PDF\", \"Split\", \"Notes\") and \`aria-pressed\`, with no \`aria-describedby\` or
extended label to indicate *what* each mode does for screen reader users who
encounter the button without visual context.

## File

\`src/components/reader/ReaderHeader.tsx\` – lines ~143–187

## Proposed Solution

Add a \`title\` attribute and/or an \`aria-label\` to each mode button that fully
describes the action, e.g.:

\`\`\`tsx
aria-label=\"PDF reading view\"
aria-label=\"Side-by-side split workspace\"
aria-label=\"Notes writing view\"
\`\`\`

## Acceptance Criteria

- [ ] Each segmented button has a descriptive \`aria-label\`
- [ ] \`aria-pressed\` is preserved
- [ ] Tested with a screen reader or axe-core audit" \
  '["good first issue","accessibility","bug"]'

# 3 ── E2E test coverage for notes autosave
post \
  "test: add Playwright E2E test for notes autosave and persistence" \
  "## Problem Statement

The only current E2E test is \`tests/e2e/annotations.spec.ts\`. The notes
autosave flow (900 ms debounce → Supabase upsert) is a core feature with no
automated coverage. Regressions could silently break a user's notes.

## Proposed Solution

Add \`tests/e2e/notes-autosave.spec.ts\` using the \`/test\` fixture (no auth
needed) to verify:

1. Typing into the notes editor triggers a save indicator
2. After a reload of \`/test\`, the same notes content is present (relies on
   \`documentId=\"test-fixture-document\"\` which the fixture hardcodes)

If the \`/test\` fixture stores notes in \`localStorage\` rather than Supabase,
the test can assert against \`localStorage\` directly via \`page.evaluate\`.

## Acceptance Criteria

- [ ] New \`tests/e2e/notes-autosave.spec.ts\` file
- [ ] Uses \`/test\` fixture – no Supabase credentials required in CI
- [ ] Passes in \`bun run test:e2e\`" \
  '["good first issue","testing"]'

# 4 ── Empty state illustration for document library
post \
  "feat: improve empty state UI in the document library" \
  "## Problem Statement

When a new user signs in and has not yet uploaded any PDFs, the library
(\`src/routes/_authenticated/index.tsx\`) shows a functional but plain empty
state. First impressions matter for an aesthetics-driven product like Reeda.

## Proposed Solution

Design and implement a more welcoming empty state that:

- Includes a short, on-brand message (e.g. *\"Your library is quiet for now.
  Drop a PDF here to start reading.\"*)
- Has a visible upload affordance (button or drag target) even when the list
  is empty
- Optionally includes a simple SVG illustration that matches the typographic,
  minimal aesthetic

## Good First Issue notes

- The upload logic is already implemented; this is purely a UI/copy task.
- SVG can be inline or imported as a component.
- The file to modify is \`src/routes/_authenticated/index.tsx\`.

## Acceptance Criteria

- [ ] Empty state is visually distinct from the loaded state
- [ ] Upload button/area is prominently shown
- [ ] No new dependencies introduced" \
  '["good first issue","enhancement","design"]'

# 5 ── Document sort options in library
post \
  "feat: add sort options to the document library (by name, date, size)" \
  "## Problem Statement

The library (\`src/routes/_authenticated/index.tsx\`) shows documents in the
order returned by Supabase (\`listDocuments()\`). As a user accumulates more
PDFs, having no sorting or ordering control becomes frustrating.

## Proposed Solution

Add a lightweight sort control (a \`<select>\` or a small segmented button)
near the search input that allows sorting by:

- Date added (newest first – current default)
- Name (A → Z)
- Size (largest first)

Sorting should be applied client-side to the query result; no API changes
needed.

## Acceptance Criteria

- [ ] Sort control is visible and accessible via keyboard
- [ ] Sorted order is applied immediately on change
- [ ] Selection is preserved in \`localStorage\` or component state for the session
- [ ] Does not introduce new dependencies" \
  '["good first issue","enhancement"]'

echo "Done."
