# reeda

A digital reading environment where the source document and the reader's own thinking live together in one workspace.

Reeda is being built around a question that most reading tools skip over: *what should reading digitally actually look like?* Rather than starting with a feature list and working backwards, the project begins by observing how people really read, highlight, search, and write when they are engaging with a document carefully. The design follows from those observations, not from assumptions about what a PDF reader should be.

The core idea is simple. When you read something that matters, you do not consume it passively and then go somewhere else to think. You pause, underline a phrase, and start forming a response while the source is still in front of you. Reading and thinking happen in the same moment. Reeda tries to preserve that by keeping the document and the reader's notes side by side in a single calm workspace, without forcing a switch between tools.

Reeda is built by [Quing](https://github.com/thekzbn) and is in active early development.

## What Reeda does today

Reeda is a web application that lets you upload PDF documents, read them in a focused environment, and write alongside them.

**The reading workspace** is the centre of the product. When you open a document, Reeda presents a split-pane view: the PDF on the left, a rich-text notes editor on the right. The divider between them is draggable, so you can give more space to whichever pane matters at the moment. On smaller screens, the workspace switches between full-screen PDF and full-screen notes views.

**The PDF reader** renders pages using Mozilla's pdf.js on a canvas, with a selectable text layer on top. It supports continuous vertical scrolling, fit-to-width and fit-to-page zoom modes, manual zoom controls, fullscreen mode, keyboard navigation (arrow keys, Page Up/Down), table of contents extraction from PDF outlines, and live full-text search with match highlighting and navigation across all pages.

**The notes editor** is a Tiptap-based rich-text editor that stores content as Markdown. It supports headings, bold, italic, bullet lists, numbered lists, task lists with checkboxes, blockquotes, and links. Notes are persisted per document and autosave after a short debounce (900ms). When you select text in the PDF, an "Add to notes" button appears, letting you send passages directly into your notes without copy-pasting.

**The document library** lists all uploaded PDFs with titles, file sizes, and dates. You can search, rename, and delete documents. Each user gets 500 MB of managed storage backed by Supabase Storage, with per-user folder isolation enforced by row-level security policies.

**Authentication** supports Google, Microsoft, and Apple OAuth, as well as email/password and phone OTP sign-in. New users go through a lightweight onboarding flow that collects reading context (role, field, purpose, reading materials, and current tools) to inform future development.

## Philosophy

Reeda is intentionally narrow. It is not trying to become an AI chatbot, a productivity dashboard, a reference manager, or a generic document-management suite. It is trying to be a good place to read and think.

Most PDF readers are built to display pages. Most note-taking apps are built to organise thoughts. Reeda sits in the gap between them: the place where you are actively reading something and actively responding to it, and you need both activities to happen without friction.

The project values essentialism over comprehensiveness. Every element in the interface should earn its place. If something can be removed without harming the reading experience, it probably should be.

## Architecture

Reeda is a server-rendered React application using [TanStack Start](https://tanstack.com/start) as the full-stack framework, with [Vite](https://vite.dev) as the build tool and dev server.

| Layer | Technology | Role |
|---|---|---|
| Framework | TanStack Start + TanStack Router | File-based routing, SSR, server functions, CSRF protection |
| UI | React 19, Tailwind CSS 4 | Component rendering and styling |
| PDF rendering | pdf.js | Canvas-based page rendering with text layer overlay |
| Notes editor | Tiptap (ProseMirror) + tiptap-markdown | Rich-text editing with Markdown serialisation |
| Split pane | react-resizable-panels | Draggable divider between PDF and notes |
| Database | Supabase (PostgreSQL) | User profiles, document metadata, notes content |
| File storage | Supabase Storage | PDF file storage with signed URLs and per-user isolation |
| Authentication | Supabase Auth | OAuth providers, email/password, phone OTP |
| Data fetching | TanStack Query | Client-side caching, query invalidation, optimistic updates |
| Deployment | Nitro (Cloudflare target) | Edge-compatible server output |

The storage layer is built on an abstract `StorageProvider` interface, making it possible to add alternative backends (the type system already accounts for Google Drive and OneDrive) without changing the rest of the application.

Row-level security is enforced at the database level. Every table (profiles, documents, document_notes) and the storage bucket have RLS policies that restrict access to the owning user. The server never trusts client-submitted user IDs for data access.

## Research direction

Reeda is being developed alongside an ongoing investigation into how people actually read digitally. The research is interested in the full arc of engaged reading: how people navigate documents, what triggers them to highlight or annotate, how they move between the source and their own writing, how search is used during reading (not just for retrieval), and what makes a digital reading session feel focused rather than fragmented.

The long-term question is broad: *what should digital reading look like?* The project does not assume that today's PDF readers and productivity tools have already answered that question well. Instead, it treats the design of the reading environment as an open problem worth investigating carefully.

No formal research findings have been published yet. The product itself is the first artifact of this investigation.

## Development

Reeda uses [Bun](https://bun.sh) as its package manager.

```bash
# Clone the repository
git clone https://github.com/thekzbn/reeda.git
cd reeda

# Install dependencies
bun install

# Start the development server
bun run dev
```

The development server runs on `http://localhost:5173` by default.

### Environment variables

The application requires Supabase credentials to function. Create a `.env.local` file with:

```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-key>
SUPABASE_URL=<your-supabase-url>
SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-key>
```

Never commit secrets to the repository. The `.env.local` file is gitignored.

### Other commands

```bash
bun run build        # Production build
bun run preview      # Preview the production build
bun run lint         # Run ESLint
bun run format       # Format with Prettier
```

## Contributing

Reeda is a small project with a specific point of view. Contributions are welcome, especially from people who care about reading, typography, accessibility, or interface design.

Before building something, it helps to understand what Reeda values:

- **Useful UX over feature count.** A small number of things done well matters more than a long feature list.
- **Essentialism.** If an element does not clearly improve the reading or writing experience, it probably does not belong.
- **Accessibility.** The workspace should be usable by everyone, including keyboard-only users and screen reader users.
- **Performance.** PDF rendering and editor interactions should feel immediate. Unnecessary network requests, layout shifts, and heavy bundles are worth avoiding.
- **Privacy.** User data belongs to the user. Reeda should collect only what it needs and be transparent about it.
- **Evidence over assumption.** Design decisions should come from observation of real reading behaviour, not from copying conventions.

## Roadmap

These are directions the project is actively considering, not commitments:

- Text highlighting and annotation within the PDF
- Improved mobile reading experience
- Alternative storage providers (Google Drive, OneDrive)
- Export and sharing of notes
- Keyboard shortcuts reference
- Accessibility audit and improvements

## Status

Reeda is in early active development. The API, data model, and feature set may change. It is not yet intended for production use with important documents as the sole copy.

A license has not yet been selected for the repository. Until one is added, standard copyright applies.

## Links

- [Website](https://reeda.lovable.app/welcome)
- [Privacy](/privacy)
- [Terms](/terms)
- [GitHub](https://github.com/thekzbn/reeda)
