<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

---

## Developer Guidelines & Git Commit Standards

### Git Commit Standards (Outcome-Centric & Richly Descriptive)

All git commit messages and descriptions created by AI agents must be **VERY detailed, outcome-centric, and narrative-driven**:

1. **Outcome-First Rationale (Foremost Paragraphs):** Always state the **primary motivation, user request, or root cause problem being solved** as the foremost paragraph(s) in the commit body. Explain *why* the change was necessary and what user or architectural outcome it achieves before detailing the code modifications.
2. **Explanatory Paragraphs + Structured Lists:** Commit bodies must blend narrative paragraphs that provide full context with bulleted lists for specific file and logic updates. Commit descriptions should read as cohesive, thorough descriptions—not bare listicles.
3. **Commit Body Template:**
   ```text
   <type>(<scope>): <short outcome summary line>

   Why this change was made:
   [Provide a thorough, narrative paragraph explaining the core motivation, user request, or diagnostic root cause. Explain the exact outcome this change delivers to the user or system.]

   Changes made:
   [Provide a descriptive narrative overview of the technical solution, supported by bulleted details for specific component modifications.]
   - Itemized file/logic change details...
   ```
