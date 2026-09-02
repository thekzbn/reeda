import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | Reeda" },
      {
        name: "description",
        content: "How Reeda handles your account details, uploaded PDFs, notes, and preferences.",
      },
      { property: "og:title", content: "Privacy Policy | Reeda" },
      {
        property: "og:description",
        content: "How Reeda handles your account details, uploaded PDFs, notes, and preferences.",
      },
    ],
  }),
  component: Privacy,
});

export function Privacy() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-foreground">
      <Link
        to="/"
        className="text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        &larr; Reeda
      </Link>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-xs text-muted-foreground">
        Draft document. This text describes Reeda during active development and requires legal review before public launch.
      </p>

      {/* Privacy Visualizer */}
      <section className="mt-10 rounded-lg border border-border p-5 bg-surface/30">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          Privacy Visualizer
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          A direct overview of what information exists in Reeda, why it exists, where it is kept, and what you control.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="pb-2 font-medium">Information</th>
                <th className="pb-2 font-medium">Why it exists</th>
                <th className="pb-2 font-medium">Where it goes</th>
                <th className="pb-2 font-medium">What you control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <tr>
                <td className="py-2.5 pr-3 font-medium text-foreground">Account identity</td>
                <td className="py-2.5 pr-3 text-muted-foreground">Authenticate your session and identify your workspace</td>
                <td className="py-2.5 pr-3 text-muted-foreground">Auth database and user profile</td>
                <td className="py-2.5 text-muted-foreground">Update display name or delete account</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-3 font-medium text-foreground">Uploaded PDFs</td>
                <td className="py-2.5 pr-3 text-muted-foreground">Render pages inside the reading workspace</td>
                <td className="py-2.5 pr-3 text-muted-foreground">Private user-isolated file storage</td>
                <td className="py-2.5 text-muted-foreground">Rename or delete files at any time</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-3 font-medium text-foreground">Notes and highlights</td>
                <td className="py-2.5 pr-3 text-muted-foreground">Store your thinking alongside the source document</td>
                <td className="py-2.5 pr-3 text-muted-foreground">Document database linked to your account</td>
                <td className="py-2.5 text-muted-foreground">Edit notes, remove marks, or export to PDF</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-3 font-medium text-foreground">Reading preferences</td>
                <td className="py-2.5 pr-3 text-muted-foreground">Keep your chosen theme, resume position, and export style</td>
                <td className="py-2.5 pr-3 text-muted-foreground">Profile record and local browser storage</td>
                <td className="py-2.5 text-muted-foreground">Change any preference in Settings</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-3 font-medium text-foreground">Onboarding responses</td>
                <td className="py-2.5 pr-3 text-muted-foreground">Understand reading contexts to guide development</td>
                <td className="py-2.5 pr-3 text-muted-foreground">Your profile record</td>
                <td className="py-2.5 text-muted-foreground">Deleted permanently when account is deleted</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Main Content Sections */}
      <div className="mt-12 space-y-10 text-sm leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-foreground">1. What information Reeda handles</h2>
          <p className="mt-2 text-muted-foreground">
            Reeda is built to provide a digital reading workspace where the document and your thinking stay together. We collect only what is necessary to operate this environment:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1 text-muted-foreground">
            <li>
              <strong className="text-foreground font-medium">Account data:</strong> Your email address or phone number, supplied through Supabase Auth or third-party sign-in providers (Google, Microsoft, or Apple), and an optional display name you choose.
            </li>
            <li>
              <strong className="text-foreground font-medium">Document files:</strong> PDF files you upload to your library, along with file metadata including title, byte size, file type, upload date, and last-opened timestamp.
            </li>
            <li>
              <strong className="text-foreground font-medium">Notes and annotations:</strong> Rich-text notes written in the notes editor (saved as Markdown) and passage annotations (such as highlights and underlines) created on PDF pages.
            </li>
            <li>
              <strong className="text-foreground font-medium">Reading context:</strong> Answers submitted during initial onboarding regarding your reading habits, primary field, and tool preferences.
            </li>
            <li>
              <strong className="text-foreground font-medium">Interface preferences:</strong> Your theme selection (Light, Dark, or System), reading position resume preferences, and note export options.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">2. Why information is needed</h2>
          <p className="mt-2 text-muted-foreground">
            Every piece of data gathered has an immediate practical purpose in the application. We use account data to maintain your private session, document data to render pages within Mozilla's pdf.js reader, notes data to autosave your writing in real time, and preferences to adapt the workspace to your device and habits. We also verify document sizes against your 500 MB managed storage allowance.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">3. How documents and notes are protected</h2>
          <p className="mt-2 text-muted-foreground">
            Your documents and notes are private. They are isolated at the database level using PostgreSQL row-level security (RLS) policies. Only requests authenticated as your specific user account can read, write, update, or delete your files, notes, and annotations.
          </p>
          <p className="mt-2 text-muted-foreground">
            We do not index your uploaded documents for public search engines. We do not sell your personal information or content. We do not feed your documents, notes, or highlights into public machine learning models for training.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">4. Storage infrastructure</h2>
          <p className="mt-2 text-muted-foreground">
            Uploaded PDFs and database records are hosted on Supabase infrastructure. When you view a PDF, Reeda requests a time-limited signed URL valid for direct browser retrieval. Each account currently receives 500 MB of managed storage.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">5. User controls and deletion</h2>
          <p className="mt-2 text-muted-foreground">
            You retain full control over the material you place in Reeda:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1 text-muted-foreground">
            <li>
              <strong className="text-foreground font-medium">Deleting a document:</strong> Deleting a PDF from your library immediately removes the file from storage and cascades deletion to all notes and annotations created for that document.
            </li>
            <li>
              <strong className="text-foreground font-medium">Exporting notes:</strong> You can export your notes to a standalone, typeset PDF at any time directly from the workspace, with or without a document source attribution line.
            </li>
            <li>
              <strong className="text-foreground font-medium">Deleting your account:</strong> You can permanently delete your account through the Settings page. Account deletion purges your profile, all uploaded documents, stored files, notes, and annotations.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">6. Required processing versus optional features</h2>
          <p className="mt-2 text-muted-foreground">
            All data handling described here represents required service processing needed to store your files, render the reader, and save your notes. Reeda does not currently run advertising or third-party behavioral trackers. If optional external integrations (such as Google Drive or OneDrive connections) or voluntary research opt-ins are introduced in future releases, they will require separate, explicit user action.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">7. Updates and contact</h2>
          <p className="mt-2 text-muted-foreground">
            As Reeda evolves, this policy will be revised to reflect changes in functionality. Questions, comments, or data inquiries regarding this draft policy may be directed to the Reeda project maintainers.
          </p>
        </section>
      </div>
    </main>
  );
}
