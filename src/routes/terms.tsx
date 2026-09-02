import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service | Reeda" },
      {
        name: "description",
        content:
          "The terms that govern your use of Reeda for reading PDFs, writing notes, and organizing your documents.",
      },
      { property: "og:title", content: "Terms of Service | Reeda" },
      {
        property: "og:description",
        content:
          "The terms that govern your use of Reeda for reading PDFs, writing notes, and organizing your documents.",
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

      <h1 className="mt-6 text-3xl font-semibold tracking-tight">
        Terms of Service
      </h1>

      <p className="mt-2 text-xs text-muted-foreground">
        Last updated: September 2, 2026
      </p>

      <div className="mt-10 space-y-10 text-sm leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-foreground">
            1. About the service
          </h2>
          <p className="mt-2 text-muted-foreground">
            Reeda is a free, open-source reading and organization environment
            where PDF documents and personal notes live together in one
            workspace. Reeda is operated by Ayomide Deji-Adeyale as part of the
            Quing project.
          </p>
          <p className="mt-2 text-muted-foreground">
            These Terms apply to the official Reeda service operated by Quing.
            Independently operated forks, modified versions, or other
            deployments of the Reeda source code are not operated by us and are
            not governed by these hosted-service Terms.
          </p>
          <p className="mt-2 text-muted-foreground">
            Reeda is currently provided free of charge and is intended to
            remain free for its core functionality.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            2. Accepting these terms
          </h2>
          <p className="mt-2 text-muted-foreground">
            By creating an account or using the official Reeda service, you
            agree to these Terms of Service and our Privacy Policy. If you do
            not agree with these terms, please do not create an account or use
            the service.
          </p>
          <p className="mt-2 text-muted-foreground">
            If you use Reeda on behalf of another person or organization, you
            confirm that you have permission to accept these terms on their
            behalf.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            3. Account registration and security
          </h2>
          <p className="mt-2 text-muted-foreground">
            Some Reeda features require an authenticated account. You agree to
            provide accurate information when registering and to keep your
            account credentials secure. You are responsible for activity that
            occurs through your account.
          </p>
          <p className="mt-2 text-muted-foreground">
            Reeda may provide authentication through email and supported
            third-party providers, including Google, Microsoft, and Apple.
            Authentication through a third-party provider may also be subject
            to that provider's own terms and policies.
          </p>
          <p className="mt-2 text-muted-foreground">
            You must not share your Reeda account with another person or use an
            account to impersonate someone else.
          </p>
          <p className="mt-2 text-muted-foreground">
            Multiple accounts must not be created or used to bypass storage
            limits, restrictions, suspensions, safeguards, or other
            limitations imposed by Reeda.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            4. Your content and ownership
          </h2>
          <p className="mt-2 text-muted-foreground">
            You retain ownership of the PDF documents you upload and the notes,
            highlights, annotations, and other content you create in Reeda. We
            do not claim ownership of your materials.
          </p>
          <p className="mt-2 text-muted-foreground">
            By uploading documents or creating content in Reeda, you grant
            Reeda only the limited permission necessary to host, store, render,
            process, and display that content to you as part of providing the
            service.
          </p>
          <p className="mt-2 text-muted-foreground">
            Your content is private to your account. Reeda does not provide a
            feature for publicly sharing your PDFs, notes, or annotations with
            other Reeda users.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            5. Content responsibility
          </h2>
          <p className="mt-2 text-muted-foreground">
            You are responsible for making sure that you have the necessary
            rights and permissions to upload, store, read, annotate, and
            otherwise use content through Reeda.
          </p>
          <p className="mt-2 text-muted-foreground">
            Reeda is a reading and organization tool. We do not determine
            whether a particular PDF or other document is legally available
            for you to possess or use.
          </p>
          <p className="mt-2 text-muted-foreground">
            You must not knowingly use Reeda to store or use content in a way
            that violates applicable law or another person's intellectual
            property rights.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            6. How Reeda handles your content
          </h2>
          <p className="mt-2 text-muted-foreground">
            Your uploaded content is stored and processed as necessary to
            provide reading, organization, annotation, storage, and related
            functionality.
          </p>
          <p className="mt-2 text-muted-foreground">
            Although your content is private to your account, Reeda's
            infrastructure may technically access or process content when
            reasonably necessary to operate, maintain, troubleshoot, secure,
            or protect the service, or when required by law.
          </p>
          <p className="mt-2 text-muted-foreground">
            Reeda does not intentionally use the contents of your private
            documents for unrelated purposes.
          </p>
          <p className="mt-2 text-muted-foreground">
            See the{" "}
            <Link
              to="/privacy"
              className="text-foreground underline underline-offset-4"
            >
              Privacy Policy
            </Link>{" "}
            for more information about how personal information and content are
            handled.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            7. Storage allowances and limits
          </h2>
          <p className="mt-2 text-muted-foreground">
            Each registered account currently receives 500 MB of managed cloud
            storage for PDF files. Uploads that would cause your account to
            exceed its available storage may be declined until existing files
            are removed.
          </p>
          <p className="mt-2 text-muted-foreground">
            Storage allowances and related technical restrictions may change as
            Reeda develops. Where practical, reasonable notice will be provided
            for significant changes.
          </p>
          <p className="mt-2 text-muted-foreground">
            Reeda is not a backup service. You should maintain independent
            copies of important PDFs, notes, and other content that you cannot
            afford to lose.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            8. Acceptable use
          </h2>
          <p className="mt-2 text-muted-foreground">
            When using Reeda, you agree not to:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              Use Reeda for illegal activity or in violation of applicable
              law.
            </li>
            <li>
              Upload documents or other content that you knowingly have no
              right to use or store.
            </li>
            <li>
              Upload malicious code, viruses, malware, or files intended to
              compromise Reeda or its users.
            </li>
            <li>
              Attempt to bypass authentication, security controls, storage
              limits, or other technical safeguards.
            </li>
            <li>
              Access or attempt to access another user's account, documents,
              notes, or other private information without permission.
            </li>
            <li>
              Attack, overload, disrupt, scrape, or otherwise interfere with
              Reeda's infrastructure.
            </li>
            <li>
              Impersonate another person, organization, or Reeda.
            </li>
            <li>
              Share your account or use multiple accounts to evade restrictions
              or safeguards.
            </li>
            <li>
              Abuse the official hosted service through unauthorized reverse
              engineering or other activity that is not permitted by applicable
              law.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            9. Copyright and intellectual property
          </h2>
          <p className="mt-2 text-muted-foreground">
            Reeda does not claim ownership of documents or other content that
            you upload.
          </p>
          <p className="mt-2 text-muted-foreground">
            You are responsible for ensuring that your use of uploaded
            material complies with applicable copyright and other intellectual
            property laws.
          </p>
          <p className="mt-2 text-muted-foreground">
            Reeda is intended to function as a viewer and organization tool. We
            are not responsible for a user's decision to upload, possess, read,
            or use copyrighted material when that use violates applicable law.
          </p>
          <p className="mt-2 text-muted-foreground">
            Nothing in these Terms gives you ownership of content belonging to
            another person or organization.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            10. Content and account deletion
          </h2>
          <p className="mt-2 text-muted-foreground">
            You may remove individual documents or delete your entire account
            through the available application features.
          </p>
          <p className="mt-2 text-muted-foreground">
            Deleting content or your account is intended to remove the
            associated active data from the service. You should make any copies
            of content you want to keep before deleting it.
          </p>
          <p className="mt-2 text-muted-foreground">
            We do not provide an extended export period after a user-initiated
            account deletion or an account termination resulting from a serious
            violation.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            11. Account inactivity
          </h2>
          <p className="mt-2 text-muted-foreground">
            Reeda may delete accounts that remain inactive for 12 consecutive
            months. A successful login resets the inactivity period.
          </p>
          <p className="mt-2 text-muted-foreground">
            Where practical, we may attempt to provide notice before deleting
            an inactive account, but notice cannot be guaranteed in every
            situation.
          </p>
          <p className="mt-2 text-muted-foreground">
            If an inactive account is deleted, its associated active data may
            also be deleted.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            12. Suspension and termination
          </h2>
          <p className="mt-2 text-muted-foreground">
            We may temporarily suspend or permanently terminate an account if
            it violates these Terms, threatens the security or operation of
            Reeda, or creates a serious risk to other users or the service.
          </p>
          <p className="mt-2 text-muted-foreground">
            For less serious violations, we may provide up to 24 hours to
            correct the issue where practical.
          </p>
          <p className="mt-2 text-muted-foreground">
            We may take immediate action without a grace period when necessary
            to protect Reeda, its users, or its infrastructure, or when
            required by law.
          </p>
          <p className="mt-2 text-muted-foreground">
            Accounts terminated for serious violations may have their
            associated active data deleted without an export period.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            13. Age and feature restrictions
          </h2>
          <p className="mt-2 text-muted-foreground">
            Reeda does not currently require every user to provide their age or
            date of birth simply to use the service.
          </p>
          <p className="mt-2 text-muted-foreground">
            Certain features or settings may have age-related restrictions
            where required by law or where necessary for the safe operation of
            the service.
          </p>
          <p className="mt-2 text-muted-foreground">
            If age-specific controls are introduced, Reeda may request
            additional information when reasonably necessary to apply those
            controls.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            14. Optional research and studies
          </h2>
          <p className="mt-2 text-muted-foreground">
            Reeda may conduct optional research or studies to understand how
            the service is used and how it can be improved.
          </p>
          <p className="mt-2 text-muted-foreground">
            Participation will be opt-in for eligible users. Choosing not to
            participate will not affect normal use of Reeda.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            15. Free service and future features
          </h2>
          <p className="mt-2 text-muted-foreground">
            Reeda's core service is currently free.
          </p>
          <p className="mt-2 text-muted-foreground">
            We may introduce optional ways to support the project in the
            future, such as a voluntary "Support Us" feature. Any such feature
            will be presented clearly to users.
          </p>
          <p className="mt-2 text-muted-foreground">
            We may also introduce additional optional features in the future.
            If a feature introduces separate terms, costs, or requirements,
            those will be presented where applicable.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            16. Third-party services
          </h2>
          <p className="mt-2 text-muted-foreground">
            Reeda relies on third-party infrastructure and services to operate.
            These may include Supabase, Vercel, Lovable, GitHub, authentication
            providers such as Google, Microsoft, and Apple, and domain or
            infrastructure providers such as Go54.
          </p>
          <p className="mt-2 text-muted-foreground">
            Your use of third-party authentication or other third-party
            services may also be subject to those providers' own terms and
            privacy policies.
          </p>
          <p className="mt-2 text-muted-foreground">
            Reeda is not responsible for outages, failures, or changes made
            independently by third-party providers.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            17. No professional advice
          </h2>
          <p className="mt-2 text-muted-foreground">
            Reeda is a reading and organization tool. It does not provide
            legal, medical, financial, educational, or other professional
            advice.
          </p>
          <p className="mt-2 text-muted-foreground">
            Reeda does not guarantee that information contained in any document
            is accurate, complete, current, reliable, or suitable for your
            particular situation.
          </p>
          <p className="mt-2 text-muted-foreground">
            You are responsible for deciding how to use information accessed
            through Reeda and for obtaining professional advice when
            appropriate.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            18. Availability and service changes
          </h2>
          <p className="mt-2 text-muted-foreground">
            Reeda is provided on an "as is" and "as available" basis. We aim to
            keep the service reliable and available, but we do not guarantee
            uninterrupted or error-free operation.
          </p>
          <p className="mt-2 text-muted-foreground">
            Reeda may experience downtime because of maintenance, technical
            problems, security incidents, infrastructure failures, third-party
            outages, or circumstances outside our reasonable control.
          </p>
          <p className="mt-2 text-muted-foreground">
            We may change, suspend, or discontinue individual features when
            reasonably necessary.
          </p>
          <p className="mt-2 text-muted-foreground">
            If the official Reeda service is permanently discontinued, we intend
            to provide a reasonable opportunity for users to download or export
            their data where practical.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            19. Data loss and backups
          </h2>
          <p className="mt-2 text-muted-foreground">
            While we will take reasonable measures to operate Reeda reliably,
            no online service can guarantee that data will never be lost,
            corrupted, unavailable, or damaged.
          </p>
          <p className="mt-2 text-muted-foreground">
            You are responsible for maintaining independent backups of
            important documents, notes, and other content.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            20. Limitation of liability
          </h2>
          <p className="mt-2 text-muted-foreground">
            To the maximum extent permitted by applicable law, Reeda and its
            operator will not be responsible for indirect, incidental, special,
            consequential, exemplary, or punitive losses arising from or
            relating to your use of the service.
          </p>
          <p className="mt-2 text-muted-foreground">
            To the maximum extent permitted by applicable law, the total
            liability of Reeda and its operator for claims arising from or
            relating to the service will not exceed US$20.
          </p>
          <p className="mt-2 text-muted-foreground">
            Nothing in these Terms excludes or limits liability that cannot
            legally be excluded or limited under applicable law.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            21. Your responsibility
          </h2>
          <p className="mt-2 text-muted-foreground">
            You are responsible for your use of Reeda, your account, and the
            content you upload or create.
          </p>
          <p className="mt-2 text-muted-foreground">
            If your actions cause harm to Reeda, its infrastructure, or other
            users, or cause a legitimate claim because you violated these Terms
            or applicable law, you may be responsible for resulting losses to
            the extent permitted by applicable law.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            22. Open-source software
          </h2>
          <p className="mt-2 text-muted-foreground">
            Reeda is open-source software. The Reeda source code is currently
            made available under the GNU Affero General Public License version
            3 (AGPL-3.0).
          </p>
          <p className="mt-2 text-muted-foreground">
            The AGPL-3.0 license governs the rights granted in the applicable
            source code. Nothing in these Terms is intended to remove or
            restrict rights that you receive under the AGPL-3.0.
          </p>
          <p className="mt-2 text-muted-foreground">
            These Terms govern use of the official hosted Reeda service. They
            do not impose these hosted-service Terms on independently operated
            forks or modified deployments merely because they use the Reeda
            source code.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            23. Changes to these terms
          </h2>
          <p className="mt-2 text-muted-foreground">
            These Terms may be updated as Reeda develops, laws change, or new
            features and services are introduced.
          </p>
          <p className="mt-2 text-muted-foreground">
            Updated versions will be published on this page with an updated
            "Last updated" date. Where practical, reasonable notice will be
            provided for significant changes.
          </p>
          <p className="mt-2 text-muted-foreground">
            Continued use of the official Reeda service after updated Terms
            become effective constitutes acceptance of the updated Terms,
            subject to any rights that cannot legally be waived.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            24. Governing law
          </h2>
          <p className="mt-2 text-muted-foreground">
            These Terms are intended to be governed by the laws of the Federal
            Republic of Nigeria, subject to applicable law and any mandatory
            legal rights that cannot be excluded by agreement.
          </p>
          <p className="mt-2 text-muted-foreground">
            Disputes relating to the official Reeda service will be subject to
            the jurisdiction of the appropriate courts in Nigeria, to the
            extent permitted by applicable law.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            25. Contact
          </h2>

          <p className="mt-2 text-muted-foreground">
            For questions about these Terms, Reeda, or legal matters relating
            to the service, contact the Reeda project at:
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
            By using Reeda, you acknowledge that you have read and understood
            these Terms of Service.
          </p>

          <p className="mt-3 text-xs text-muted-foreground">
            You can also read our{" "}
            <Link
              to="/privacy"
              className="text-foreground underline underline-offset-4"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}