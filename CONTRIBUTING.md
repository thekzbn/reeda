# Contributing to Reeda

Thank you for your interest in contributing to Reeda! We welcome bug fixes, documentation improvements, feature contributions, and performance enhancements that align with Reeda's minimalist, distraction-free reading experience.

---

## 1. Local Development Setup

Reeda is built with [TanStack Start](https://tanstack.com/start), [Vite](https://vite.dev), [React 19](https://react.dev), and [Tailwind CSS](https://tailwindcss.com), using [Bun](https://bun.sh) as the package manager and runtime.

### Prerequisites

- **Bun** (v1.3+ recommended): [Install Bun](https://bun.sh)
- **Node.js** (v20+ or v22+ LTS)
- **Git**

### Installation & Starting the Dev Server

1. **Clone the repository:**

   ```bash
   git clone https://github.com/thekzbn/reeda.git
   cd reeda
   ```

2. **Install dependencies:**

   ```bash
   bun install
   ```

3. **Start the local development server:**

   ```bash
   bun run dev
   ```

   Open [http://localhost:8080](http://localhost:8080) in your browser.

4. **Run static analysis & checks:**
   ```bash
   bun run lint        # ESLint check
   bun run typecheck   # TypeScript type check
   bun run format      # Prettier formatting
   bun run build       # Production build verification
   ```

---

## 2. Lovable Cloud & Backend Migrations

Reeda integrates with [Lovable Cloud](https://lovable.dev) and Supabase for authentication and database synchronization.

- **Supabase / Postgres Migrations:** Database schema definitions and migrations are managed in `supabase/migrations/`.
- **Local Fallback:** When running without backend credentials, local storage adapters automatically handle state (notes, tags, offline annotations) so features remain testable locally.
- **Git History Standards with Lovable:** Do not force push or rewrite commits on published branches synced with Lovable, as this can desynchronize project history. Keep branch states clean and working before pushing.

---

## 3. Testing with the `/test` Fixture Environment

Reeda includes a dedicated development test fixture route at `/test` to exercise reading features, text layers, annotations, and plugin host capabilities without requiring authentication or backend setup:

- **Default Fixture:** `http://localhost:8080/test` loads `sample-document.pdf` with sample text layers, annotation overlays, and enabled plugin slots.
- **Long Document Fixture:** `http://localhost:8080/test?fixture=long` loads a multi-page PDF fixture for scrolling and long-form selection testing.
- **Plugin Testing:** Plugins such as _Publish & Report_ (`plugin-publish-report`) are automatically activated on `/test` to enable full verification of note templates (Cornell, Executive Summary) and PDF/HTML exports.

### Running End-to-End Tests

Reeda uses [Playwright](https://playwright.dev) for automated browser testing:

```bash
# Run Playwright end-to-end tests
bun run test:e2e

# Run tests in UI mode
bunx playwright test --ui
```

---

## 4. Code Conventions

- **TypeScript:** Strict type checking is enforced across all components and utilities (`bun run typecheck`). Avoid `any` types; prefer explicit interfaces and type guards.
- **Design & UI:** Reeda adheres to an essentialist, typographic design aesthetic. Use existing Radix UI primitives and Tailwind CSS variables (`var(--foreground)`, `var(--muted)`, `var(--border)`).
- **Formatting:** Code formatting is enforced with Prettier (`bun run format`).

---

## 5. Git Commit Standards (Outcome-Centric & Richly Descriptive)

All commits in Reeda must follow our **outcome-centric, narrative-driven commit standard**:

1. **Outcome-First Rationale (Foremost Paragraphs):** State the primary motivation, user problem, or diagnostic root cause in the first body paragraph. Explain _why_ the change was made and what user or architectural outcome it achieves before explaining the implementation.
2. **Explanatory Paragraphs + Structured Details:** Combine narrative explanations with itemized file and logic details.
3. **Commit Template:**
   ```text
   <type>(<scope>): <short outcome summary line>

   Why this change was made:
   [Provide a thorough, narrative paragraph explaining the core motivation, user request, or diagnostic root cause. Explain the exact outcome this change delivers to the user or system.]

   Changes made:
   [Provide a descriptive narrative overview of the technical solution, supported by bulleted details for specific component modifications.]
   - Itemized file/logic change details...
   ```

---

## 6. Pull Request Expectations

When opening a pull request:

1. **Use the PR Template:** Fill in the outcome-first explanation, motivation, and changes list.
2. **Pass All CI Checks:** Ensure `bun run lint`, `bun run typecheck`, `bun run build`, and `bun run test:e2e` pass locally.
3. **Include Verification Evidence:** Describe how the changes were verified on `/test` or in production builds, including screenshots or console logs when applicable.
