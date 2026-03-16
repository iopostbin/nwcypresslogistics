# NW Cypress Logistics – Referral Program Page

A single-file HTML marketing page for **NW Cypress Logistics LLC**, showcasing the company's services, features, gallery, about section, and the new referral program.

## File Structure

```
referalProgram/
├── index.html   # Markup only — all CSS and JS are external
├── admin.html   # Admin dashboard for viewing referrals and tracking traffic
├── styles.css   # All styles (base, sections, referral program, responsive, admin)
├── script.js    # All JavaScript (forms, animations, scroll effects)
├── package.json # Node.js dependencies
├── server.js    # Express.js API server for processing referral links
├── referrals.json # Persisted data storage for generated links and user info.
├── referralSessions.json # Log of inbound referral visits captured by IP
├── leads.json   # Datastore of form-submitted direct business leads
├── logs.json    # Application-wide system activity event logs 
├── .env.example # Example server environment variables
├── env.example.js # Example frontend environment variables
├── env.js       # Required frontend environment variables
├── README.md    # This file
├── DONE.md      # Changelog
├── FOCUS.md     # Files currently in focus for edits
└── itterations/ # Timestamped snapshots of index.html
```

## Sections

| Section | ID | Description |
|---|---|---|
| Header / Nav | `header` | Fixed navigation bar with smooth-scroll links |
| Hero | `.hero` | Full-screen hero with background image and CTA buttons |
| Services | `#services` | Six service cards (packing, shipping, storage, etc.) |
| Gallery | `#gallery` | Image gallery of logistics operations |
| Features | `#features` | Six "Why Choose Us" feature items |
| About | `#about` | Company story and Pacific Northwest branding |
| **Referral Program** | `#referral` | Get-link panel, how-it-works steps, and contact referral form |
| Contact | `#contact` | Contact info and inquiry form |
| Footer | `footer` | Branding and carrier logos |

## Referral Program Details

- **Get Your Unique Link**: Form allowing users to enter details. Submits via API (`POST /api/referral-link`).
- **Referral Output**: Automatically generates a base-36 tracking URL (e.g., `https://nwcypresslogistics.com/ref/jane-doe-xxxxxx`) and displays it. Inbound hits track visitor IP addresses.
- **Submit a Referral**: Secondary formal lead submission form submitting async via `POST /api/leads`. Maps the submitter’s IP back to the original referral URL visited to securely attribute referral rewards.
- **Admin Dashboard**: A secure internal tracking interface (`admin.html`) dynamically surfacing:
  - Top-Level Summary Grid showing key metrics: Total Links, Business Leads, Total Clicks, and Emails Sent
  - Total newly generated referral links
  - Specific click traffic on distinct links (`/api/admin/sessions`)
  - A chronological ledger of submitted business leads (`/api/admin/leads`)
  - Outbound Nodemailer email records and overarching system activity logs (`/api/admin/logs`)
- **Automated Email Integration**: Features dual-dispatch SMTP mapping (via `nodemailer`) sending real-time lead tracking to site admins and automated welcome/thank you confirmations safely to users.
- Matches existing dark-forest green design system and is fully responsive.

## Running Locally

Because the project now includes an API server for generating referral links, you need to run Node:

1. Copy `.env.example` to `.env` and fill in optional SMTP settings if you want email alerts.
2. Copy `env.example.js` to `env.js` to configure the frontend API URL (defaults to `http://localhost:3001`).
3. Install dependencies: `npm install`
4. Start the API server: `npm run dev` (starts on port 3001)
5. Open the `index.html` file using a live server (e.g. VS Code Live Server extension at `http://localhost:5500`) or deploy it to a static host.
