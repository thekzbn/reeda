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

import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | Reeda" },
      {
        name: "description",
        content:
          "How Reeda handles your account details, uploaded PDFs, notes, preferences, and other information used to provide the service.",
      },
      { property: "og:title", content: "Privacy Policy | Reeda" },
      {
        property: "og:description",
        content:
          "How Reeda handles your account details, uploaded PDFs, notes, preferences, and other information used to provide the service.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://reeda.lovable.app/privacy" },
    ],
    links: [{ rel: "canonical", href: "https://reeda.lovable.app/privacy" }],
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

      <h1 className="mt-6 text-3xl font-semibold tracking-tight">
        Privacy Policy
      </h1>

      <p className="mt-2 text-xs text-muted-foreground">
        Last updated: September 2, 2026
      </p>

      {/* Privacy Visualizer */}
      <section className="mt-10 rounded-lg border border-border bg-surface/30 p-5">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          Privacy Visualizer
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          A direct overview of what information exists in Reeda, why it exists,
          where it is kept, and what you control.
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
                <td className="py-2.5 pr-3 font-medium text-foreground">
                  Account identity
                </td>
                <td className="py-2.5 pr-3 text-muted-foreground">
                  Create your account, authenticate you, and identify your
                  workspace
                </td>
                <td className="py-2.5 pr-3 text-muted-foreground">
                  Authentication system and user profile
                </td>
                <td className="py-2.5 text-muted-foreground">
                  Change available profile information or delete your account
                </td>
              </tr>

              <tr>
                <td className="py-2.5 pr-3 font-medium text-foreground">
                  Uploaded PDFs
                </td>
                <td className="py-2.5 pr-3 text-muted-foreground">
                  Store and render your documents in the reading workspace
                </td>
                <td className="py-2.5 pr-3 text-muted-foreground">
                  Private, user-isolated file storage
                </td>
                <td className="py-2.5 text-muted-foreground">
                  Rename or delete files at any time
                </td>
              </tr>

              <tr>
                <td className="py-2.5 pr-3 font-medium text-foreground">
                  Notes and annotations
                </td>
                <td className="py-2.5 pr-3 text-muted-foreground">
                  Save your writing, highlights, underlines, and other reading
                  work
                </td>
                <td className="py-2.5 pr-3 text-muted-foreground">
                  Database records linked to your account
                </td>
                <td className="py-2.5 text-muted-foreground">
                  Edit, remove, or export your notes
                </td>
              </tr>

              <tr>
                <td className="py-2.5 pr-3 font-medium text-foreground">
                  Reading preferences
                </td>
                <td className="py-2.5 pr-3 text-muted-foreground">
                  Remember your theme, reading position, and export preferences
                </td>
                <td className="py-2.5 pr-3 text-muted-foreground">
                  Profile records and local browser storage
                </td>
                <td className="py-2.5 text-muted-foreground">
                  Change available preferences in Settings
                </td>
              </tr>

              <tr>
                <td className="py-2.5 pr-3 font-medium text-foreground">
                  Onboarding responses
                </td>
                <td className="py-2.5 pr-3 text-muted-foreground">
                  Understand reading contexts and help guide product
                  development
                </td>
                <td className="py-2.5 pr-3 text-muted-foreground">
                  Your profile record
                </td>
                <td className="py-2.5 text-muted-foreground">
                  Deleted with your account
                </td>
              </tr>

              <tr>
                <td className="py-2.5 pr-3 font-medium text-foreground">
                  Authentication information
                </td>
                <td className="py-2.5 pr-3 text-muted-foreground">
                  Sign you in and maintain account security
                </td>
                <td className="py-2.5 pr-3 text-muted-foreground">
                  Reeda's authentication provider or selected sign-in provider
                </td>
                <td className="py-2.5 text-muted-foreground">
                  Manage your account and authentication method where supported
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Main Content Sections */}
      <div className="mt-12 space-y-10 text-sm leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-foreground">
            1. What information Reeda handles
          </h2>

          <p className="mt-2 text-muted-foreground">
            Reeda is designed to provide a private digital reading workspace
            where your documents and your thinking stay together. To provide
            that service, Reeda handles the following categories of
            information:
          </p>

          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              <strong className="font-medium text-foreground">
                Account information:
              </strong>{" "}
              Information associated with your Reeda account, which may include
              your email address, name, username, profile picture, and
              authentication information.
            </li>

            <li>
              <strong className="font-medium text-foreground">
                Authentication information:
              </strong>{" "}
              Information required to authenticate your account through Reeda's
              authentication system or supported providers such as Google,
              Microsoft, or Apple.
            </li>

            <li>
              <strong className="font-medium text-foreground">
                Document files:
              </strong>{" "}
              PDF files you upload to your library, together with related
              metadata such as title, file size, file type, upload date, and
              reading or access information used by the application.
            </li>

            <li>
              <strong className="font-medium text-foreground">
                Notes and annotations:
              </strong>{" "}
              Notes written in the notes editor and annotations such as
              highlights and underlines created on PDF pages.
            </li>

            <li>
              <strong className="font-medium text-foreground">
                Reading context:
              </strong>{" "}
              Responses submitted during onboarding, such as information about
              your reading habits, primary field, or tool preferences.
            </li>

            <li>
              <strong className="font-medium text-foreground">
                Interface preferences:
              </strong>{" "}
              Preferences such as your selected theme, reading-position
              behavior, and note export options.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            2. Why information is needed
          </h2>

          <p className="mt-2 text-muted-foreground">
            Reeda uses this information to provide and maintain the features
            you use. Account information allows us to create your workspace and
            authenticate you. Document information allows Reeda to store and
            render your PDFs. Notes and annotations allow your reading work to
            be saved and synchronized. Preferences allow the application to
            remember how you want your workspace to behave.
          </p>

          <p className="mt-2 text-muted-foreground">
            Reeda also uses document metadata to manage your library and enforce
            the current 500 MB managed storage allowance for each registered
            account.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            3. Your documents and notes are private
          </h2>

          <p className="mt-2 text-muted-foreground">
            Your PDFs, notes, highlights, and annotations are private to your
            account. Reeda does not provide a public document library,
            public-profile document sharing, or public links for your private
            reading materials.
          </p>

          <p className="mt-2 text-muted-foreground">
            Reeda uses database-level access controls, including PostgreSQL
            row-level security (RLS), to restrict normal user access to data
            belonging to other accounts.
          </p>

          <p className="mt-2 text-muted-foreground">
            However, privacy does not mean that the service's infrastructure
            can never technically process or access your content. Reeda and its
            infrastructure may process or access content when reasonably
            necessary to provide, maintain, troubleshoot, secure, or protect
            the service, or when required by law.
          </p>

          <p className="mt-2 text-muted-foreground">
            We do not intentionally use your private PDFs, notes, or
            annotations for unrelated purposes.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            4. Machine learning and advertising
          </h2>

          <p className="mt-2 text-muted-foreground">
            Reeda does not sell your personal information or the contents of
            your private documents.
          </p>

          <p className="mt-2 text-muted-foreground">
            Reeda does not use your PDFs, notes, highlights, or annotations to
            train public machine learning models.
          </p>

          <p className="mt-2 text-muted-foreground">
            Reeda does not currently run behavioral advertising or third-party
            advertising trackers as part of the core application.
          </p>

          <p className="mt-2 text-muted-foreground">
            If Reeda introduces an optional way to support the project through
            advertising in the future, it will be presented as a separate
            feature and will not give advertisers access to your private PDFs,
            notes, or annotations.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            5. Storage infrastructure
          </h2>

          <p className="mt-2 text-muted-foreground">
            Reeda uses third-party infrastructure to operate the service.
            Uploaded PDFs and application database records are currently hosted
            using Supabase infrastructure.
          </p>

          <p className="mt-2 text-muted-foreground">
            When you view a PDF, Reeda may generate a time-limited signed URL
            that allows your browser to retrieve the requested file. Access
            controls are used to restrict files to their associated accounts.
          </p>

          <p className="mt-2 text-muted-foreground">
            Each registered account currently receives 500 MB of managed cloud
            storage for PDF files.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            6. Authentication and third-party providers
          </h2>

          <p className="mt-2 text-muted-foreground">
            Reeda may allow you to authenticate using email/password
            authentication or supported third-party providers such as Google,
            Microsoft, and Apple.
          </p>

          <p className="mt-2 text-muted-foreground">
            When you use a third-party authentication provider, that provider
            may process information according to its own privacy policy and
            terms. Reeda receives the information necessary to establish and
            maintain your Reeda account.
          </p>

          <p className="mt-2 text-muted-foreground">
            Reeda does not need your third-party provider password when you
            authenticate through that provider.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            7. User controls and deletion
          </h2>

          <p className="mt-2 text-muted-foreground">
            You retain control over the material you place in Reeda:
          </p>

          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              <strong className="font-medium text-foreground">
                Deleting a document:
              </strong>{" "}
              You can delete individual PDFs from your library. Associated
              notes and annotations are intended to be removed with the
              document.
            </li>

            <li>
              <strong className="font-medium text-foreground">
                Editing your profile:
              </strong>{" "}
              Reeda allows you to change profile information that the
              application currently makes editable, such as your display name.
            </li>

            <li>
              <strong className="font-medium text-foreground">
                Exporting notes:
              </strong>{" "}
              You can export your notes to a standalone, typeset PDF using the
              available export functionality.
            </li>

            <li>
              <strong className="font-medium text-foreground">
                Deleting your account:
              </strong>{" "}
              You can delete your Reeda account through the available account
              settings. Account deletion is intended to remove your profile,
              uploaded documents, stored files, notes, annotations, and other
              associated active account data.
            </li>
          </ul>

          <p className="mt-2 text-muted-foreground">
            Deletion from the active service does not necessarily mean that
            every technical copy in infrastructure backups is destroyed
            immediately. Where backups exist, they may remain for the period
            required for backup rotation, security, disaster recovery, or other
            legitimate operational purposes.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            8. Account inactivity
          </h2>

          <p className="mt-2 text-muted-foreground">
            Reeda may delete accounts that remain inactive for 12 consecutive
            months.
          </p>

          <p className="mt-2 text-muted-foreground">
            A successful login resets the inactivity period. Where practical,
            Reeda may attempt to notify you before an inactive account is
            deleted, but notice cannot be guaranteed in every situation.
          </p>

          <p className="mt-2 text-muted-foreground">
            If an inactive account is deleted, its associated active account
            data may also be deleted.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            9. Required processing versus optional features
          </h2>

          <p className="mt-2 text-muted-foreground">
            The information described in this policy is primarily processed to
            provide the Reeda service, including authentication, document
            storage, PDF rendering, note saving, reading-position persistence,
            preferences, account management, and security.
          </p>

          <p className="mt-2 text-muted-foreground">
            Reeda may introduce optional features in the future, including
            external integrations or voluntary research programs. Where an
            optional feature requires additional information or a separate
            choice from you, that will be communicated when the feature is
            introduced.
          </p>

          <p className="mt-2 text-muted-foreground">
            Participation in future Reeda research or studies will be optional
            for eligible users and will not be required for normal use of the
            service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            10. Age-related information
          </h2>

          <p className="mt-2 text-muted-foreground">
            Reeda does not currently require users to provide their age or date
            of birth simply to use the core service.
          </p>

          <p className="mt-2 text-muted-foreground">
            If a particular feature requires age-related controls, Reeda may
            request information reasonably necessary to apply those controls.
            Such information will be handled according to this Privacy Policy
            and applicable law.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            11. Third-party services
          </h2>

          <p className="mt-2 text-muted-foreground">
            Reeda relies on third-party services and infrastructure to operate.
            Depending on the feature and deployment, these may include
            Supabase, Vercel, Lovable, GitHub, Google, Microsoft, Apple, and
            Go54.
          </p>

          <p className="mt-2 text-muted-foreground">
            These providers may process information on behalf of, or in
            connection with, the services they provide to Reeda. Their own
            privacy policies and terms may also apply to information they
            process independently.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            12. Security
          </h2>

          <p className="mt-2 text-muted-foreground">
            Reeda uses reasonable technical and organizational measures intended
            to protect accounts and user content from unauthorized access,
            alteration, disclosure, or destruction.
          </p>

          <p className="mt-2 text-muted-foreground">
            These measures include authenticated access controls, database
            access policies, user-isolated storage, and other security controls
            used by the application and its infrastructure.
          </p>

          <p className="mt-2 text-muted-foreground">
            No online service can guarantee absolute security. You should use a
            strong, unique password where applicable and keep your account
            credentials secure.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            13. What Reeda does not do
          </h2>

          <p className="mt-2 text-muted-foreground">
            Reeda is designed around private personal reading rather than
            public content sharing. We do not intentionally:
          </p>

          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              Sell your personal information or the contents of your private
              documents.
            </li>
            <li>
              Make your private PDFs, notes, or annotations publicly searchable.
            </li>
            <li>
              Provide your private documents to other Reeda users through a
              sharing feature.
            </li>
            <li>
              Use your private documents, notes, or annotations to train public
              machine learning models.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            14. Changes to this policy
          </h2>

          <p className="mt-2 text-muted-foreground">
            This Privacy Policy may be updated as Reeda develops, new
            functionality is introduced, or legal requirements change.
          </p>

          <p className="mt-2 text-muted-foreground">
            Updated versions will be published on this page with a new "Last
            updated" date. Where practical, significant changes will be
            communicated through the service or another reasonable method.
          </p>

          <p className="mt-2 text-muted-foreground">
            Your continued use of Reeda after an updated policy becomes
            effective means that you acknowledge the updated policy, subject to
            any rights provided by applicable law.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            15. Contact
          </h2>

          <p className="mt-2 text-muted-foreground">
            Questions, privacy requests, or other inquiries about how Reeda
            handles information can be directed to:
          </p>

          <p className="mt-2">
            <a
              href="mailto:thekzbn@proton.me"
              target="_blank" 
              className="text-foreground underline underline-offset-4"
            >
              thekzbn@proton.me
            </a>
            <span className="text-muted-foreground">
              {" "}or through the contact methods available on the{" "}
            </span>
            <a
              href="https://quing.thekzbn.name.ng"
              target="_blank" 
              className="text-foreground underline underline-offset-4"
            >
              Quing project website
            </a>
          </p>

          <p className="mt-2 text-muted-foreground">
            Reeda is operated by Ayomide Deji-Adeyale as part of the Quing
            project.
          </p>
        </section>

        <section className="border-t pt-8">
          <p className="text-xs text-muted-foreground">
            Reeda is designed to keep your reading materials private and give
            you meaningful control over the information you place in the
            service.
          </p>

          <p className="mt-3 text-xs text-muted-foreground">
            You can also read our{" "}
            <Link
              to="/terms"
              className="text-foreground underline underline-offset-4"
            >
              Terms of Service
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}