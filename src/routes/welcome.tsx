import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "reeda" },
      {
        name: "description",
        content: "A reading environment where the source and your thinking live together.",
      },
      { property: "og:title", content: "reeda" },
      {
        property: "og:description",
        content: "A reading environment where the source and your thinking live together.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        navigate({ to: "/", replace: true });
      } else {
        setChecked(true);
      }
    });
  }, [navigate]);

  if (!checked) return null;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 pt-6 sm:px-10 sm:pt-8">
        <span className="text-[15px] font-semibold tracking-tight" style={{ color: "#6A5ACD" }}>
          reeda
        </span>
        <Link
          to="/auth"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Sign in
        </Link>
      </nav>

      <main className="flex-1">
        {/* Hero */}
        <header className="mx-auto mt-20 max-w-2xl px-6 text-center sm:mt-28 sm:px-10">
          <h1 className="text-4xl font-semibold leading-[1.15] tracking-tight text-foreground sm:text-[3.5rem] sm:leading-[1.1]">
            Read and think
            <br />
            in the same place.
          </h1>
          <div className="mt-8">
            <Link
              to="/auth"
              className="squircle inline-flex h-11 items-center justify-center px-7 text-[15px] font-medium text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: "#6A5ACD" }}
            >
              Get started
            </Link>
          </div>
        </header>

        {/* Product image */}
        <div className="mx-auto mt-16 max-w-5xl px-6 sm:mt-20 sm:px-10">
          <img
            src="/product.png"
            alt="Reeda workspace showing a PDF document on the left and a notes editor on the right"
            className="w-full rounded-lg border border-border"
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto mx-auto w-full max-w-5xl px-6 pb-10 pt-16 sm:px-10">
        <div className="flex items-center justify-between border-t border-border pt-6 text-xs text-muted-foreground">
          <span style={{ color: "#6A5ACD" }} className="font-medium">
            reeda
          </span>
          <div className="flex gap-4">
            <Link to="/terms" className="underline underline-offset-2 hover:text-foreground">
              Terms
            </Link>
            <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
