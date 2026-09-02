import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service | Reeda" },
      {
        name: "description",
        content: "The terms that govern your use of Reeda for reading PDFs and writing notes.",
      },
      { property: "og:title", content: "Terms of Service | Reeda" },
      {
        property: "og:description",
        content: "The terms that govern your use of Reeda for reading PDFs and writing notes.",
      },
    ],
  }),
  component: Terms,
});

export function Terms() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-foreground">
      <Link
        to="/"
        className="text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        &larr; Reeda
      </Link>

      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-xs text-muted-foreground">
        Draft document. This text represents draft terms for Reeda during its active development phase and requires legal review before public launch.
      </p>

      <div className="mt-10 space-y-10 text-sm leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-foreground">1. About the service</h2>
          <p className="mt-2 text-muted-foreground">
            Reeda is a focused reading environment where source PDF documents and personal notes live together in one workspace. The product is designed to support engaged reading and thinking without unnecessary dashboard overhead or distracting interface elements.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">2. Account registration and security</h2>
          <p className="mt-2 text-muted-foreground">
            You must create an authenticated account to use Reeda. You agree to provide accurate information when registering and to maintain the confidentiality of your sign-in credentials. You are responsible for all activity that occurs under your account.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">3. Your content and ownership</h2>
          <p className="mt-2 text-muted-foreground">
            You retain complete ownership of all PDF documents you upload and all notes, highlights, and annotations you author in Reeda. We claim no intellectual property rights or ownership over your materials.
          </p>
          <p className="mt-2 text-muted-foreground">
            By uploading documents or writing notes, you grant Reeda only the limited license required to host, store, render, and display your content to you within the application. We do not distribute your files, publish your notes, or share your documents with other users or third parties.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">4. Storage allowances and limits</h2>
          <p className="mt-2 text-muted-foreground">
            Each registered account is provided with 500 MB of managed cloud storage for PDF files. Uploads that would cause your account to exceed this allowance will be declined until existing files are removed. Storage allowances may be adjusted as the product expands, with advance notice provided for significant changes.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">5. Acceptable use</h2>
          <p className="mt-2 text-muted-foreground">
            When using Reeda, you agree not to:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1 text-muted-foreground">
            <li>Upload documents that infringe upon another party's copyright, intellectual property, or legal rights.</li>
            <li>Upload malicious code, viruses, or any files intended to compromise the security of the application or its users.</li>
            <li>Attempt to bypass authentication, probe application security, or access documents and notes belonging to another user.</li>
            <li>Use automated systems to place unreasonable burdens on application infrastructure or storage systems.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">6. Content removal and account deletion</h2>
          <p className="mt-2 text-muted-foreground">
            You may remove individual documents or your entire account at any time through the application interface. Deleting a document removes the file from storage along with its associated notes and marks. Deleting your account purges all associated documents, storage objects, notes, and profile settings.
          </p>
          <p className="mt-2 text-muted-foreground">
            We reserve the right to suspend or terminate access for accounts that repeatedly violate these terms or engage in abusive behavior.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">7. Availability and limitations</h2>
          <p className="mt-2 text-muted-foreground">
            Reeda is in active development. While we aim for high reliability, stable performance, and uninterrupted access, the service is provided on an "as is" and "as available" basis without express or implied warranties. We cannot guarantee that the service will be free from errors, service interruptions, or data loss.
          </p>
          <p className="mt-2 text-muted-foreground">
            We strongly advise maintaining independent backup copies of important documents and utilizing the note export feature to preserve your work locally.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">8. Changes to terms</h2>
          <p className="mt-2 text-muted-foreground">
            These terms may be amended from time to time to accommodate new functionality or legal requirements. Updated versions will be published on this page with an updated modification date. Continued use of Reeda constitutes agreement with the revised terms.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">9. Contact</h2>
          <p className="mt-2 text-muted-foreground">
            For inquiries regarding these draft terms, please reach out to the Reeda project maintainers.
          </p>
        </section>
      </div>
    </main>
  );
}
