# Reeda

Build the first foundation of Reeda, a web application for reading and working with PDFs. Use Lovable Cloud for authentication, database, storage, and backend functionality. This is a fresh project, so establish a clean foundation that later prompts can extend without needing to rebuild the application. Do not attempt to build the PDF reader, notes editor, annotation system, research features, analytics, Blog, or any other future functionality yet. This first build should concentrate only on authentication, user profile setup, the document library, and private PDF storage.

A critical requirement for this build is that **the application must be in a working, runnable state whenever you finish or pause work**. Before stopping, pausing, or declaring the task complete, run the application and verify that it builds successfully without TypeScript errors, compilation errors, broken imports, missing dependencies, failed routes, or obvious runtime errors. If something you changed prevents the application from running, fix it before stopping. Do not leave known build failures for a later prompt. Do not consider the task complete merely because the requested code has been written. The current project must actually run.

If you reach the point where the planned functionality is complete but the application does not build or run, prioritize fixing the build over adding additional features. If necessary, reduce or simplify the implementation you just added rather than leaving the project in a broken state. Every Lovable build should leave the repository in a stable state that another developer or agent can immediately continue from.

Reeda should feel like a serious reading tool rather than a typical SaaS application. Use Inter throughout the application with the following setup:

```html id="q6g8fn"
<link rel="preconnect" href="https://rsms.me/" />
<link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
```

```css id="6j3m0o"
:root {
  font-family: Inter, sans-serif;
  font-feature-settings:
    "liga" 1,
    "calt" 1;
}

@supports (font-variation-settings: normal) {
  :root {
    font-family: InterVariable, sans-serif;
  }
}
```

Use `#6A5ACD` as the primary accent and build the rest of the colour system around it. The visual design should be extremely minimal and essential, with UX taking priority over decoration. Establish hierarchy through typography, spacing, alignment, subtle borders, and restrained tonal differences. Do not use shadows, glassmorphism, decorative gradients, decorative blobs, dashboards, needless cards, eyebrow headers, excessive pill-shaped controls, or persistent status labels. Do not use em dashes in user-facing copy. Use rounded geometry carefully, with subtle squircle-like treatment where appropriate on Chromium-based browsers and refined rounded rectangles elsewhere. Do not add tutorials, walkthroughs, feature tours, or instructional overlays. The interface should communicate its own interaction through good design.

Require users to create an account before entering Reeda. Use Lovable Cloud authentication and support Google, Microsoft, Apple, phone, and email authentication. Google, Microsoft, and Apple should receive the strongest visual emphasis because they provide a convenient sign-in experience, while phone and email should remain available as secondary methods. Email should not be deceptively hidden. Do not create fake authentication flows or placeholder provider buttons. Use real authentication where configuration is available.

After a successful signup, automatically create the user's profile and present a compact profile setup experience. Ask what best describes the user, including Student, Researcher, Professional, General reader, and Other. Ask what they study or work in, including Computer Science, Engineering, Medicine, Law, Business, Humanities, Natural Sciences, Social Sciences, and Other. Ask why they are using Reeda, including Studying, Research, Writing, Professional work, General reading, Reference, and Other. Ask what they usually read and allow multiple selections, including Textbooks, Books, Journal articles, Research papers, Theses, Dissertations, Lecture materials, Reports, Manuals, Essays, Web articles, and Other. Finally, ask which tools they currently use for reading and note-taking, allowing multiple selections such as Notion, Obsidian, OneNote, Google Docs, Microsoft Word, Paper notebook, PDF annotations, and Other.

Keep this profile setup short and straightforward. It is not a tutorial and should not feel like a questionnaire imposed on the user. Store the answers in the authenticated user's profile. Do not treat these answers as research consent and do not build any research functionality in this build.

After profile setup, take the user to the root route, `/`, which should serve as Reeda's document library. Do not call this a dashboard and do not design it as one. The page should primarily provide access to the user's documents and a clear way to add a PDF. Keep the application navigation small and quiet. Do not create a large sidebar and do not add placeholder navigation for features that do not exist yet.

Create a secure `documents` data model associated with the authenticated user. At minimum, the document record should contain an identifier, the owning user, title, file type, file size, creation time, modification time, last-opened time, storage provider, and storage reference. Use proper database access policies so users can only read, modify, or delete documents belonging to their own account. Never trust a user ID supplied by the client.

The library should allow users to see their uploaded documents, open a document route, rename a document, delete a document, and perform basic searches across their own documents. Since the actual PDF reader is not being built yet, opening a document may lead to a simple temporary document surface that clearly represents the future reader route, but do not create a fake PDF reader or pretend that document reading is already implemented.

Build a small storage service abstraction from the beginning. The rest of the application must not directly depend on Lovable Cloud storage APIs. The document library and future PDF reader should interact with a storage service rather than with the underlying storage implementation. For this build, only Reeda Storage needs to be implemented. Keep the abstraction deliberately simple so that Google Drive and Microsoft OneDrive can later be implemented as additional storage providers without changing the document library or PDF reader. Do not build those providers yet and do not create fake connection experiences for them.

Allow users to upload PDF files from their device and store them privately in Lovable Cloud storage. Validate that uploaded files are PDFs, create the corresponding document record after successful upload, and associate the document with the authenticated user. Establish a configurable managed-storage allowance of 500 MB per user. Do not create a permanent quota indicator or storage dashboard. Storage information should only become visible later when it is genuinely relevant to the user.

Uploaded files must remain private. Do not create unnecessary public URLs. Use authenticated access and appropriate storage rules so one user cannot access another user's files. Handle upload failures cleanly and provide human-readable feedback without exposing raw backend errors or implementation details.

Create functional `/privacy` and `/terms` routes because the authentication interface will reference them. These pages may contain clearly marked draft content that requires legal review before public launch. Keep them readable and consistent with the Reeda visual system. Do not create a privacy dashboard or a complicated legal interface in this build.

Do not implement PDF rendering, PDF search, text selection, highlighting, underlining, strikethrough, annotations, the rich notes editor, the PDF and notes split view, fullscreen reading, the Word Bank, the Blog, research participation, behavioural analytics, session replay, AI, sharing, collaboration, payments, PDF downloading, user-created bookmarks, or advanced citation functionality. Do not create empty placeholder interfaces for any of those features. Only establish the architectural boundaries that are genuinely necessary for later development.

Before stopping or pausing this build, test the complete implemented foundation in the actual application. Confirm that authentication works, profile creation works, the document library loads, PDF upload works, the uploaded file is stored privately, the document record persists, rename works, deletion works, refresh does not break the state, and authorization prevents cross-user access.

Most importantly, **do not finish or pause with a broken build**. Run the application, verify the current implementation compiles and runs successfully, and fix any errors introduced during this build before stopping. A partially implemented feature is acceptable when it is intentionally outside this build's scope. A build error is not.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9a37cecd-17ae-4e16-a02b-aa0ebb44c9d7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
