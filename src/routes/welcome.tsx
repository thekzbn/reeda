/*
 * Reeda - a reading environment for PDFs.
 * Copyright (C) 2026 Quing (thekzbn)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Reeda | Read PDFs and write notes in one place" },
      {
        name: "description",
        content:
          "Reeda is a quiet reading workspace where your PDFs and your notes live side by side. Free and open source.",
      },
      { property: "og:title", content: "Reeda | Read PDFs and write notes in one place" },
      {
        property: "og:description",
        content:
          "Reeda is a quiet reading workspace where your PDFs and your notes live side by side. Free and open source.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://reeda.lovable.app/welcome" },
      { property: "og:image", content: "https://reeda.lovable.app/product.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://reeda.lovable.app/product.png" },
    ],
    links: [{ rel: "canonical", href: "https://reeda.lovable.app/welcome" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Reeda",
          applicationCategory: "ProductivityApplication",
          operatingSystem: "Web",
          url: "https://reeda.lovable.app/welcome",
          license: "https://www.gnu.org/licenses/agpl-3.0.html",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }),
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
            <a
              href="https://github.com/thekzbn/reeda/tree/main?tab=License-1-ov-file"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              AGPL-3.0
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
