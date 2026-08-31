import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy | Reeda" },
      { name: "description", content: "How Reeda handles your account details and the PDFs you upload." },
      { property: "og:title", content: "Privacy | Reeda" },
      {
        property: "og:description",
        content: "How Reeda handles your account details and the PDFs you upload.",
      },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
        Reeda
      </Link>
      <h1 className="mt-8 text-2xl font-semibold">Privacy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Draft content. This text requires legal review before public launch.
      </p>

      <div className="mt-10 space-y-8 text-[15px] leading-relaxed">
        <section>
          <h2 className="text-base font-medium">What we store</h2>
          <p className="mt-2 text-muted-foreground">
            We store your account identity, the answers you give during profile setup, and the PDF
            files you choose to upload, along with basic details about them such as title, file size,
            and when they were last opened.
          </p>
        </section>
        <section>
          <h2 className="text-base font-medium">Who can see your files</h2>
          <p className="mt-2 text-muted-foreground">
            Uploaded files are private to your account. They are not published, indexed, or shared,
            and access rules prevent other accounts from reading them.
          </p>
        </section>
        <section>
          <h2 className="text-base font-medium">Deleting your data</h2>
          <p className="mt-2 text-muted-foreground">
            Deleting a document removes both the record and the stored file. Deleting your account
            removes your profile and every document associated with it.
          </p>
        </section>
        <section>
          <h2 className="text-base font-medium">Contact</h2>
          <p className="mt-2 text-muted-foreground">
            Questions about this draft policy can be sent to the Reeda team.
          </p>
        </section>
      </div>
    </main>
  );
}
