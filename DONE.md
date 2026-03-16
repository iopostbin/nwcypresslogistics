# Changelog – NW Cypress Logistics Referral Program Page

## 2026-03-15 (18:32)
### Added - Frontend Environment Configuration
- Extracted hardcoded API URLs in the frontend across `script.js` and `admin.html`.
- Created a `env.js` file exposing a global `window.ENV.API_BASE_URL` configuration object.
- Created `env.example.js` as an example setup file for new developers.
- Added `<script src="env.js"></script>` to `index.html` and `admin.html` prior to API integration scripts.
## 2026-03-15 (18:16)
### Added - Admin Dashboard Summary Grid
- Added a visually slick summary grid (`.admin-summary-grid`) at the top of the admin dashboard (`admin.html`).
- The grid contains 4 stylized metric cards displaying high-level stats: Total Links, Business Leads, Total Clicks, and Emails Sent.
- Implemented JavaScript calculating totals from the fetched API data in `fetchDashboardData()`.
- Enhanced `.admin-summary-card` styling in `styles.css` using modern gradients, hover transformations, and sleek box-shadows.

## 2026-03-15 (16:11)
### Added - "Let's Grow Together" Lead Routing API
- Updated `script.js` to dispatch form payloads via async `fetch` (`POST /api/leads`) rather than relying on standard `mailto:` anchors, matching our new API architecture.
- Added `/api/leads` to `server.js` acting as the unified incoming receiver for these "Submit a Referral" queries.
- Engineered automated Referral Origin Matching: Evaluates the submitter's incoming IP address (`req.headers['x-forwarded-for']`) against the `referralSessions.json` dataset to detect and flag if this particular lead stems natively from a tracked referral URL link code.
- Populates leads into a new data store (`leads.json`) locally. 
- Integrated `appendLog()` globally, safely tracking "Lead Generated" activity and subsequent automated emails payload metrics into `logs.json`.
- Dispatches dual automated Nodemailer events:
  - An Admin notification email with all Lead details prominently identifying the matching Referral Source + Context (if known).
  - A responsive automated "Thank you" reply to the submitter confirming system routing. 
- Enhanced the `admin.html` tracking dashboard by integrating a "Generated Business Leads" live-rendering tracking table fed strictly by `GET /api/admin/leads`.

## 2026-03-15 (16:03)
### Added - System Activity Logs (`logs.json`)
- Implemented a unified system logging architecture in `server.js` using `appendLog()`.
- Captures critical events globally and records their context directly to `logs.json`. Triggered on:
  - Form submission routing 
  - Submitter & Admin outgoing email alerts
  - Custom incoming link visit pings
  - Access points to the centralized Tracking Dashboard
- Injected an active "System Activity Logs" table into `/admin.html` capturing chronological events automatically.

## 2026-03-15 (15:58)

### Added – Admin Dashboard (`admin.html`)
- Built an internal dashboard UI matching the project's layout/styling constraints.
- Connects automatically to the new API endpoints `/api/admin/referrals` and `/api/admin/sessions`.
- Dynamically renders two data reporting tables:
  1. **Generated Referral Links:** Pulls and organizes base `referrals.json` metrics including unique referral codes, email matching, and overarching traffic hit counts.
  2. **Recent Link Clicks:** Directly exposes the `referralSessions.json` dataset to show IP routing and session logging timestamps.
- Modified `styles.css` strictly appending the new Admin tables CSS scope (`.admin-card`, `.admin-table`).

## 2026-03-15 (15:30)

### Added – Node.js Backend API (`server.js`)
- Created `server.js` using Express.js to handle the "Get Your Unique Referral Link" form submission.
- Endpoints:
  - `GET /api/health` — Returns basic API health status.
  - `POST /api/referral-link` — Accepts form data (`firstName`, `lastName`, `email`, `company`, `phone`).
- Validation ensures required fields are provided and the email is well-formed.
- Automatically generates a base-36 unique referral slug based on the name.
- **Saves all successfully generated links and user details persistently into `referrals.json`.**
- Sends two optional email notifications (if SMTP is configured):
  - An alert to the team indicating a new request was generated.
  - A friendly "Welcome" email to the **submitter** directly, thanking them and confirming their referral code and link.
- **Added `GET /ref/:code` endpoint** to capture inbound referral link clicks:
  - Logs visits into a new `referralSessions.json` array file.
  - Identifies unique user sessions by storing their IP address (`req.headers['x-forwarded-for']` or `req.socket.remoteAddress`) as their ID.
  - Increments a `sessionsCount` metric on the matched document within `referrals.json` to monitor the link’s traffic.
  - Seamlessly redirects visitors back to `https://nwcypresslogistics.com`.
- Created `package.json` with `express`, `cors`, `dotenv`, and `nodemailer` dependencies.
- Created `.env.example` to document available environment settings.
- Updated `script.js` so the `get-link-form` posts JSON data via `fetch()` to `http://localhost:3001/api/referral-link` instead of relying on `mailto:`.


## 2026-03-15 (13:06)

### Added – "Get Your Unique Referral Link" panel (`index.html`)
- New two-column panel inserted at the top of the Referral section (above "How It Works")
- **Left column** — headline, description, and 4-perk bullet list (branded URL, multi-channel sharing, auto-tracking, no share limit)
- **Right column** — frosted-glass form box with 5 fields: First Name, Last Name, Email (required), Company, Phone
- On submit:
  - Fires `mailto:` to `contact@nwcypresslogistics.com` with all form data pre-filled
  - Generates a unique referral slug (`firstname-lastname-<base36 timestamp>`)
  - Displays the personalised URL (e.g. `https://nwcypresslogistics.com/ref/jane-doe-lx9f3a`) in a styled result box
  - Provides a **Copy to Clipboard** button
  - Shows green success banner for 8 seconds
- New CSS: `.get-link-panel`, `.get-link-inner`, `.get-link-copy`, `.get-link-perks`, `.get-link-form-box`, `.get-link-fields`, `.link-result`, `.link-url-text`, `.btn-copy`, `#get-link-success`
- Responsive — collapses to single column on mobile
- Snapshot saved to `itterations/2026-03-15_13-06-51/`


## 2026-03-15 (13:00)

### Removed – Reward Tiers section (`index.html`)
- Removed the 💰 Reward Tiers heading and all three tier cards (Seedling, Cypress, Redwood)
- Removed all associated CSS: `.reward-tiers`, `.reward-tier`, `.reward-tier.featured`, `.reward-tier.featured::before`, `.reward-tier:hover`, `.tier-badge`, `.tier-name`, `.tier-referrals`, `.tier-reward`, `.tier-desc`
- Cleaned up the `@media (max-width: 768px)` rule to remove the now-unused `.reward-tiers` selector
- Snapshot saved to `itterations/2026-03-15_13-00-46/`


## 2026-03-15

### Added – Referral Program Section (`index.html`)
- New `#referral` section inserted between the Contact section and Footer
- **"Grow Together, Earn Together"** hero banner with tagline and program description
- **4-step How It Works** process (Submit → We Reach Out → They Ship → Collect Reward)
- **3 Reward Tiers** with hover card animations:
  - 🌱 **Seedling** – $25/referral (1–2 referrals)
  - 🌲 **Cypress** – $60/referral (3–6 referrals) — featured/highlighted tier
  - 🏔️ **Redwood** – $100/referral (7+ referrals)
- **Referral submission form** (Your Name, Your Email, Business Name, Contact, Their Email/Phone, Notes)
  - Submits via `mailto:` to `contact@nwcypresslogistics.com` with pre-formatted subject & body
  - Shows green success banner after submission
- **"Why Refer?" benefit list** with 6 bullet points
- **Navigation link** "Referral Program" added to header nav with gradient accent styling
- All new elements use the existing dark-forest green theme (`#0d1f14`, `#1a2e1a`, `#8bc34a`)
- Fully responsive — collapses to single column on mobile (`max-width: 768px`)
