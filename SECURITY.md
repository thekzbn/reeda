# Security Policy

Reeda is committed to the security and privacy of our users. We take all vulnerability reports seriously and appreciate responsible disclosure.

---

## Supported Versions

Security updates are provided for the latest version of the `main` branch.

| Version | Supported          |
| ------- | ------------------ |
| `main`  | :white_check_mark: |
| < 1.0   | :x:                |

---

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report security issues confidentially through [GitHub Security Advisories](https://github.com/thekzbn/reeda/security/advisories/new).

### What to Include in Your Report

To help us investigate and triage the issue quickly, please provide:

1. A clear description of the potential vulnerability and its impact.
2. Step-by-step reproduction steps or a minimal proof-of-concept (PoC).
3. The affected browser(s), operating system, or deployment environment.
4. Any potential mitigations or suggested fixes.

---

## Response Expectations & SLA

- **Initial Acknowledgment:** We aim to acknowledge receipt of vulnerability reports within **48 hours**.
- **Assessment & Triage:** We will provide an assessment and timeline for remediation within **5 business days**.
- **Fix & Disclosure:** Once a fix is verified and deployed, a security advisory will be published crediting the reporter (unless anonymity is requested).

---

## Scope & Self-Hosting Considerations

- **Client-Side Processing:** Reeda parses PDF documents and notes primarily in the client browser using Web Workers and local state. Vulnerabilities related to PDF parser memory safety (pdfjs-dist) or DOM sanitization (XSS in notes rendering) are high priority.
- **Self-Hosted Deployments:** Users self-hosting Reeda are responsible for securing their deployment environment, reverse proxies, and Supabase credentials. Reeda's security model assumes standard HTTPS deployment with secure cookie/session handling.
