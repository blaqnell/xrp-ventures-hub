# XRP Ventures Hub

• Market prices show their data source and timestamp.
• Failed market requests show a helpful stale or unavailable state.
• Charts do not invent actual investment returns.

Administration:

• Ordinary users cannot access admin data.
• Every sensitive admin action is authorized on the server.
• Role changes are audited.
• Financial adjustments cannot be silently overwritten.
• Support agents cannot access unauthorized conversations.

Security:

• Test stored and reflected XSS payloads.
• Test authorization bypass attempts.
• Test SQL injection protections.
• Test rate limits.
• Test malicious file uploads.
• Test session expiry and recovery behavior.
• Test access control on direct API requests.

User experience:

• Mobile and desktop layouts work.
• All buttons have meaningful actions.
• Forms show useful errors and success states.
• Loading and empty states are polished.
• Accessibility checks are performed.

Use automated tests where practical and document manual tests that require external provider configuration.

18. IMPLEMENTATION ORDER

Build the application in this order:

Phase 1: Establish the design system, responsive public landing page, navigation, and shared components.

Phase 2: Configure Supabase, database migrations, authentication, Google and Apple OAuth integration points, email verification, and password recovery.

Phase 3: Implement RLS, authorization helpers, protected routes, roles, and security tests.

Phase 4: Build the authenticated dashboard, portfolio model, market-data integration, and charts.

Phase 5: Implement the leaderboard, support messaging, notifications, and profile settings.

Phase 6: Build the admin dashboard, role management, user management, audit logs, and support tools.

Phase 7: Complete testing, accessibility improvements, performance optimization, deployment documentation, and a production-readiness review.

Do not generate all the visual components and leave the backend disconnected.

Prioritize a functional, secure foundation before adding cosmetic extras.

19. FINAL DELIVERY REQUIREMENTS

At completion, provide:

• A functioning responsive web application.
• Database schema and migrations.
• Configured authentication flows.
• Working forgot-password and reset-password flows.
• Working OAuth flows after provider credentials are configured.
• Secure RLS policies and server-side authorization.
• Live market-data integration or a clearly documented configuration requirement.
• User dashboard.
• Administrative dashboard.
• Support messaging.
• Automated tests for critical security and account flows.
• Deployment and environment-variable instructions.
• A checklist of external services requiring configuration.
• A clear list of features that are production-ready versus still requiring legal, provider, or operational setup.

Start building XRP Ventures now. Inspect the current project first, reuse existing working components where appropriate, and implement the actual application—not just a plan or a visual demonstration.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c378c5e9-a6f9-404f-ad1a-bda13529c9e5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
