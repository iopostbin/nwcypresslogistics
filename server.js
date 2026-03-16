// ─── NW Cypress Logistics – Referral Link API ───────────────────────────────
// Loads environment variables from .env
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
    origin: process.env.ALLOWED_ORIGIN || '*',   // Lock this down in production
    methods: ['GET', 'POST'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Turn a name string into a URL-safe slug.
 * e.g. "Jane Doe" → "jane-doe"
 */
function slugify(str) {
    return String(str)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
}

/**
 * Generate a unique referral code.
 * Format: <first>-<last>-<8 hex chars>
 */
function generateReferralCode(firstName, lastName) {
    const namePart = slugify(`${firstName}-${lastName}`);
    const uniquePart = crypto.randomBytes(4).toString('hex');
    return `${namePart}-${uniquePart}`;
}

/**
 * Build the full referral URL from a code.
 */
function buildReferralUrl(code) {
    const base = process.env.REFERRAL_BASE_URL || 'https://nwcypresslogistics.com/ref';
    return `${base}/${code}`;
}

// ── (Optional) Email transport ────────────────────────────────────────────────
// Set SMTP_* env vars to enable email notifications.
// Leave them blank to skip sending and just log to console.
function createTransport() {
    if (!process.env.SMTP_HOST) return null;
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
}

// ── System Logging Helper ───────────────────────────────────────────────────
async function appendLog(event, details) {
    try {
        const logPath = path.join(__dirname, 'logs.json');
        let logs = [];
        try {
            const content = await fs.readFile(logPath, 'utf8');
            logs = JSON.parse(content);
            if (!Array.isArray(logs)) logs = [];
        } catch (err) {
            logs = [];
        }

        logs.push({
            id: crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'),
            event,
            details,
            timestamp: new Date().toISOString()
        });

        await fs.writeFile(logPath, JSON.stringify(logs, null, 2), 'utf8');
    } catch (e) {
        console.error('[Logging Error]', e);
    }
}

// ── Routes ────────────────────────────────────────────────────────────────────

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'NW Cypress Referral API' });
});

/**
 * POST /api/referral-link
 *
 * Accepts JSON or URL-encoded body:
 *   { firstName, lastName, email, company?, phone? }
 *
 * Returns:
 *   { success: true, referralUrl, referralCode }
 */
app.post('/api/referral-link', async (req, res) => {
    try {
        const { firstName, lastName, email, company, phone } = req.body;

        // ── Validation ──────────────────────────────────────────────────────────
        const errors = [];
        if (!firstName || !firstName.trim()) errors.push('firstName is required');
        if (!lastName || !lastName.trim()) errors.push('lastName is required');
        if (!email || !email.trim()) errors.push('email is required');
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            errors.push('email is not valid');

        if (errors.length) {
            return res.status(400).json({ success: false, errors });
        }

        // ── Generate referral link ──────────────────────────────────────────────
        const referralCode = generateReferralCode(firstName.trim(), lastName.trim());
        const referralUrl = buildReferralUrl(referralCode);

        const newReferralData = {
            id: crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            company: company ? company.trim() : null,
            phone: phone ? phone.trim() : null,
            referralCode,
            referralUrl,
            sessionsCount: 0,
            timestamp: new Date().toISOString(),
        };

        // ── Save to JSON file ───────────────────────────────────────────────────
        try {
            const dataFilePath = path.join(__dirname, 'referrals.json');
            let data = [];
            try {
                const fileContent = await fs.readFile(dataFilePath, 'utf8');
                data = JSON.parse(fileContent);
                if (!Array.isArray(data)) data = [];
            } catch (err) {
                // If file doesn't exist or is invalid JSON, start fresh array
                data = [];
            }
            data.push(newReferralData);
            await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
        } catch (err) {
            console.error('[Referral Link] Error saving to referrals.json:', err);
            // We ignore failure here so the user still gets their link.
        }

        // ── Log the request (always) ────────────────────────────────────────────
        const requestDetails = {
            name: `${newReferralData.firstName} ${newReferralData.lastName}`,
            email: newReferralData.email,
            company: newReferralData.company || '—',
            phone: newReferralData.phone || '—',
            referralCode: newReferralData.referralCode,
            referralUrl: newReferralData.referralUrl,
            timestamp: newReferralData.timestamp,
        };
        console.log('[Referral Link Request]', requestDetails);
        await appendLog('Request Link Submission', { email: newReferralData.email, code: newReferralData.referralCode });

        // ── Send email notification (optional) ─────────────────────────────────
        const transport = createTransport();
        if (transport) {
            const notifyAddress = process.env.NOTIFY_EMAIL || 'contact@nwcypresslogistics.com';

            await transport.sendMail({
                from: process.env.SMTP_FROM || `"NW Cypress Referral" <${process.env.SMTP_USER}>`,
                to: notifyAddress,
                subject: `New Referral Link Request – ${newReferralData.firstName} ${newReferralData.lastName}`,
                text: [
                    'A new referral link has been requested.',
                    '',
                    `Name:          ${newReferralData.firstName} ${newReferralData.lastName}`,
                    `Email:         ${newReferralData.email}`,
                    `Company:       ${newReferralData.company || 'Not provided'}`,
                    `Phone:         ${newReferralData.phone || 'Not provided'}`,
                    '',
                    `Referral Code: ${newReferralData.referralCode}`,
                    `Referral URL:  ${newReferralData.referralUrl}`,
                    '',
                    `Requested at:  ${newReferralData.timestamp}`,
                ].join('\n'),
                html: `
          <h2>New Referral Link Request</h2>
          <table cellpadding="6" cellspacing="0">
            <tr><td><strong>Name</strong></td><td>${newReferralData.firstName} ${newReferralData.lastName}</td></tr>
            <tr><td><strong>Email</strong></td><td>${newReferralData.email}</td></tr>
            <tr><td><strong>Company</strong></td><td>${newReferralData.company || '—'}</td></tr>
            <tr><td><strong>Phone</strong></td><td>${newReferralData.phone || '—'}</td></tr>
            <tr><td><strong>Referral Code</strong></td><td><code>${newReferralData.referralCode}</code></td></tr>
            <tr><td><strong>Referral URL</strong></td><td><a href="${newReferralData.referralUrl}">${newReferralData.referralUrl}</a></td></tr>
          </table>
        `,
            });
            console.log(`[Referral Link] Notification email sent to ${notifyAddress}`);
            await appendLog('Email Sent', { to: notifyAddress, type: 'Admin Alert', subject: 'New Referral Link Request' });

            // Send polite reply directly to the submitter
            await transport.sendMail({
                from: process.env.SMTP_FROM || `"NW Cypress Referral" <${process.env.SMTP_USER}>`,
                to: newReferralData.email,
                subject: 'Welcome to the NW Cypress Logistics Referral Program! 🌱',
                text: [
                    `Hello ${newReferralData.firstName},`,
                    '',
                    'Thank you for joining our Referral Program! We are thrilled to have you grow with us.',
                    'Your unique referral link is fully generated and ready to be shared with businesses that could benefit from reliable logistics.',
                    '',
                    `Your Referral Code: ${newReferralData.referralCode}`,
                    `Your Referral Link: ${newReferralData.referralUrl}`,
                    '',
                    'Whenever a new business signs up and ships using your link, your rewards will grow!',
                    '',
                    'Best regards,',
                    'The NW Cypress Logistics Team',
                ].join('\n'),
                html: `
                  <div style="font-family: sans-serif; color: #333; line-height: 1.6;">
                    <h2 style="color: #4caf50;">Welcome to the NW Cypress Logistics Referral Program! 🌱</h2>
                    <p>Hello ${newReferralData.firstName},</p>
                    <p>Thank you for joining our Referral Program! We are thrilled to have you grow with us. Your unique referral link is fully generated and ready to be shared with businesses that could benefit from reliable logistics.</p>
                    <div style="background-color: #f1f8e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0 0 10px 0;"><strong>Your Referral Code:</strong> <span style="font-family: monospace; font-size: 1.1em;">${newReferralData.referralCode}</span></p>
                        <p style="margin: 0;"><strong>Your Referral Link:</strong> <a href="${newReferralData.referralUrl}" style="color: #4caf50;">${newReferralData.referralUrl}</a></p>
                    </div>
                    <p>Whenever a new business signs up and ships using your link, your rewards will grow!</p>
                    <p>Best regards,<br><strong>The NW Cypress Logistics Team</strong></p>
                  </div>
                `,
            });
            console.log(`[Referral Link] Submitter email sent to ${newReferralData.email}`);
            await appendLog('Email Sent', { to: newReferralData.email, type: 'Welcome Confirm', subject: 'Welcome to the NW Cypress...' });

        } else {
            console.log('[Referral Link] SMTP not configured – skipping email notification.');
        }

        // ── Respond ─────────────────────────────────────────────────────────────
        return res.status(201).json({
            success: true,
            referralUrl: newReferralData.referralUrl,
            referralCode: newReferralData.referralCode,
            message: 'Your referral link has been generated successfully.',
        });

    } catch (err) {
        console.error('[Referral Link] Unhandled error:', err);
        return res.status(500).json({
            success: false,
            errors: ['An unexpected error occurred. Please try again.'],
        });
    }
});

/**
 * POST /api/leads
 * Handles the "Let's grow together" / Submit a referral form.
 */
app.post('/api/leads', async (req, res) => {
    try {
        const { yourName, yourEmail, bizName, bizContact, bizEmail, notes } = req.body;

        // ── Validation ──────────────────────────────────────────────────────────
        const errors = [];
        if (!yourName || !yourName.trim()) errors.push('Your name is required');
        if (!yourEmail || !yourEmail.trim()) errors.push('Your email is required');
        if (!bizName || !bizName.trim()) errors.push('Referred business name is required');

        if (errors.length) {
            return res.status(400).json({ success: false, errors });
        }

        // ── Detect referral session by IP ───────────────────────────────────────
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        let matchedReferralCode = null;
        let matchedReferrerInfo = null;

        try {
            const sessionsRaw = await fs.readFile(path.join(__dirname, 'referralSessions.json'), 'utf8');
            const sessions = JSON.parse(sessionsRaw);

            if (Array.isArray(sessions)) {
                // Find all sessions from this IP, sort newest first
                const ipSessions = sessions.filter(s => s.ipAddress === ip);
                if (ipSessions.length > 0) {
                    ipSessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                    matchedReferralCode = ipSessions[0].referralCode;

                    // Fetch the parent user data of this code
                    const referralsRaw = await fs.readFile(path.join(__dirname, 'referrals.json'), 'utf8');
                    const referrals = JSON.parse(referralsRaw);
                    const matchedUser = referrals.find(r => r.referralCode === matchedReferralCode);
                    if (matchedUser) {
                        matchedReferrerInfo = `${matchedUser.firstName} ${matchedUser.lastName} (${matchedUser.email})`;
                    }
                }
            }
        } catch (err) {
            console.error('[Leads] Warning: failed reading session block for IP match', err);
        }

        // ── Assemble Data Payload ───────────────────────────────────────────────
        const newLeadData = {
            id: crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'),
            yourName: yourName.trim(),
            yourEmail: yourEmail.trim(),
            bizName: bizName.trim(),
            bizContact: bizContact ? bizContact.trim() : null,
            bizEmail: bizEmail ? bizEmail.trim() : null,
            notes: notes ? notes.trim() : null,
            referralCode: matchedReferralCode,
            matchedReferrer: matchedReferrerInfo,
            timestamp: new Date().toISOString()
        };

        // ── Save to leads.json ──────────────────────────────────────────────────
        try {
            const leadsFilePath = path.join(__dirname, 'leads.json');
            let leads = [];
            try {
                const logsContent = await fs.readFile(leadsFilePath, 'utf8');
                leads = JSON.parse(logsContent);
                if (!Array.isArray(leads)) leads = [];
            } catch (err) {
                // Ignore missing file, assume empty
                leads = [];
            }
            leads.push(newLeadData);
            await fs.writeFile(leadsFilePath, JSON.stringify(leads, null, 2), 'utf8');
        } catch (err) {
            console.error('[Leads] Error persisting lead', err);
        }

        await appendLog('Lead Generated', {
            email: newLeadData.yourEmail,
            business: newLeadData.bizName,
            referredBy: newLeadData.referralCode || 'None'
        });

        // ── Email routing ───────────────────────────────────────────────────────
        const transport = createTransport();
        if (transport) {
            const notifyAddress = process.env.NOTIFY_EMAIL || 'contact@nwcypresslogistics.com';

            let referralSourceTxt = 'Direct load (No referral link tracking detected for this submitter via IP)';
            if (matchedReferralCode) {
                referralSourceTxt = `ATTENTION REWARD: Originates from Referral Link Code [${matchedReferralCode}]\n` +
                    `Referrer Info: ${matchedReferrerInfo || 'N/A'}`;
            }

            // Mail 1: To the business administration team
            await transport.sendMail({
                from: process.env.SMTP_FROM || `"NW Cypress Admin" <${process.env.SMTP_USER}>`,
                to: notifyAddress,
                subject: `New Lead Generated! – ${newLeadData.bizName} from ${newLeadData.yourName}`,
                text: [
                    'A new business lead was just submitted on the website.',
                    '',
                    '-- Tracking Attribution --',
                    referralSourceTxt,
                    '',
                    '-- Submitter Info --',
                    `Name:  ${newLeadData.yourName}`,
                    `Email: ${newLeadData.yourEmail}`,
                    '',
                    '-- Referred Business Info --',
                    `Company: ${newLeadData.bizName}`,
                    `Contact: ${newLeadData.bizContact || 'Not provided'}`,
                    `Email:   ${newLeadData.bizEmail || 'Not provided'}`,
                    `Notes:   ${newLeadData.notes || 'None'}`,
                    '',
                    `Timestamp: ${newLeadData.timestamp}`,
                ].join('\n')
            });
            await appendLog('Email Sent', { to: notifyAddress, type: 'Admin Alert', subject: `New Lead Generated! – ${newLeadData.bizName}` });

            // Mail 2: Polite thank-you back to the form submitter
            await transport.sendMail({
                from: process.env.SMTP_FROM || `"NW Cypress Admin" <${process.env.SMTP_USER}>`,
                to: newLeadData.yourEmail,
                subject: 'Thank You! We received your referral details 🌱',
                text: [
                    `Hello ${newLeadData.yourName},`,
                    '',
                    `Thank you for reaching out to build connections with NW Cypress Logistics!`,
                    `We are thrilled to receive your details regarding ${newLeadData.bizName}.`,
                    'Our team will be in touch shortly to handle this prospect.',
                    '',
                    'We appreciate your submission!',
                    'The NW Cypress Logistics Team'
                ].join('\n')
            });
            await appendLog('Email Sent', { to: newLeadData.yourEmail, type: 'Lead Received Welcome', subject: 'Thank You! We received...' });
        }

        return res.status(201).json({
            success: true,
            message: 'Your lead was successfully submitted!'
        });

    } catch (err) {
        console.error('[Leads] Error unhandled:', err);
        return res.status(500).json({ success: false, errors: ['Failed to process lead'] });
    }
});

// ── Track Referral Visits ─────────────────────────────────────────────────────
app.get('/ref/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        // 1. Log session
        const sessionData = {
            id: crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'),
            referralCode: code,
            ipAddress: ip,
            timestamp: new Date().toISOString(),
        };

        await appendLog('Referral URL Visited', { code, ip });

        const sessionsFilePath = path.join(__dirname, 'referralSessions.json');
        let sessions = [];
        try {
            const sessionsContent = await fs.readFile(sessionsFilePath, 'utf8');
            sessions = JSON.parse(sessionsContent);
            if (!Array.isArray(sessions)) sessions = [];
        } catch (err) {
            sessions = [];
        }
        sessions.push(sessionData);
        await fs.writeFile(sessionsFilePath, JSON.stringify(sessions, null, 2), 'utf8');

        // 2. Increment count in referrals.json
        const referralsFilePath = path.join(__dirname, 'referrals.json');
        let referrals = [];
        try {
            const referralsContent = await fs.readFile(referralsFilePath, 'utf8');
            referrals = JSON.parse(referralsContent);
            if (!Array.isArray(referrals)) referrals = [];
        } catch (err) {
            referrals = [];
        }

        let updated = false;
        referrals = referrals.map(ref => {
            if (ref.referralCode === code) {
                updated = true;
                return {
                    ...ref,
                    sessionsCount: (ref.sessionsCount || 0) + 1
                };
            }
            return ref;
        });

        if (updated) {
            await fs.writeFile(referralsFilePath, JSON.stringify(referrals, null, 2), 'utf8');
        }

        // 3. Redirect
        console.log(`[Referral Tracking] Redirecting visit for code ${code}`);
        res.redirect('https://nwcypresslogistics.com');

    } catch (err) {
        console.error('[Referral Tracking] Error:', err);
        res.redirect('https://nwcypresslogistics.com');
    }
});

// ── Admin API ─────────────────────────────────────────────────────────────────
app.get('/api/admin/referrals', async (req, res) => {
    try {
        const filePath = path.join(__dirname, 'referrals.json');
        const content = await fs.readFile(filePath, 'utf8');
        res.json(JSON.parse(content));
    } catch (err) {
        res.json([]);
    }
});

app.get('/api/admin/sessions', async (req, res) => {
    try {
        const filePath = path.join(__dirname, 'referralSessions.json');
        const content = await fs.readFile(filePath, 'utf8');
        res.json(JSON.parse(content));
    } catch (err) {
        res.json([]);
    }
});

app.get('/api/admin/leads', async (req, res) => {
    try {
        const filePath = path.join(__dirname, 'leads.json');
        const content = await fs.readFile(filePath, 'utf8');
        res.json(JSON.parse(content));
    } catch (err) {
        res.json([]);
    }
});

app.get('/api/admin/logs', async (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    await appendLog('Dashboard Visited', { ip });
    try {
        const filePath = path.join(__dirname, 'logs.json');
        const content = await fs.readFile(filePath, 'utf8');
        res.json(JSON.parse(content));
    } catch (err) {
        res.json([]);
    }
});

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, errors: ['Route not found'] });
});

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🌲 NW Cypress Referral API running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`   POST:   http://localhost:${PORT}/api/referral-link\n`);
});

module.exports = app; // Export for testing
