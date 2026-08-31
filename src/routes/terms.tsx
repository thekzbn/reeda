import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms | Reeda" },
      { name: "description", content: "The terms that apply when you use Reeda to read and store PDFs." },
      { property: "og:title", content: "Terms | Reeda" },
      {
        property: "og:description",
        content: "The terms that apply when you use Reeda to read and store PDFs.",
      },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
        Reeda
      </Link>
      <h1 className="mt-8 text-2xl font-semibold">Terms</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Draft content. This text requires legal review before public launch.
      </p>

      <div className="mt-10 space-y-8 text-[15px] leading-relaxed">
        <section>
          <h2 className="text-base font-medium">Your account</h2>
          <p className="mt-2 text-muted-foreground">
            You need an account to use Reeda. You are responsible for keeping access to your account
            secure and for the material you upload.
          </p>
        </section>
        <section>
          <h2 className="text-base font-medium">Your content</h2>
          <p className="mt-2 text-muted-foreground">
            You keep ownership of everything you upload. You give Reeda only the permission needed to
            store your files and show them back to you.
          </p>
        </section>
        <section>
          <h2 className="text-base font-medium">Acceptable use</h2>
          <p className="mt-2 text-muted-foreground">
            Do not upload material you have no right to store, and do not attempt to access another
            account's documents.
          </p>
        </section>
        <section>
          <h2 className="text-base font-medium">Storage</h2>
          <p className="mt-2 text-muted-foreground">
            Each account currently includes 500 MB of managed storage. This allowance may change as
            Reeda develops.
          </p>
        </section>
      </div>
    </main>
  );
}
