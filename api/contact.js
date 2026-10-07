// Build With Us contact form handler.
//
// Requires the RESEND_API_KEY environment variable to be set in the
// Vercel project (Settings -> Environment Variables). The sending/
// receiving addresses below must belong to a domain verified in Resend.
//
// On a valid submission this sends two emails:
//   1. A bilingual "thank you" confirmation to the person who submitted
//      the form, in the language the form was filled in (EN or ES).
//   2. An internal notification to the DBL team with the submission
//      details, with Reply-To set to the submitter so the team can
//      just hit reply.

var FROM_EMAIL = 'Digital Business Lab <info@digitalbusinesslab.io>';
var TO_EMAIL = 'info@digitalbusinesslab.io';

var MAX_LEN = { name: 200, email: 320, phone: 40, company: 200, idea: 5000 };

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function layout(bodyHtml) {
  return (
    '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f4f4f4;' +
    'font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 16px;">' +
    '<tr><td align="center">' +
    '<table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;">' +
    '<tr><td style="background:#000000;padding:24px 32px;">' +
    '<span style="color:#E1FF3C;font-size:20px;font-weight:800;letter-spacing:-0.02em;">DBL</span>' +
    '<span style="color:#ffffff;font-size:13px;margin-left:8px;">Digital Business Lab</span>' +
    '</td></tr>' +
    '<tr><td style="padding:32px;color:#111111;font-size:15px;line-height:1.6;">' +
    bodyHtml +
    '</td></tr>' +
    '<tr><td style="padding:20px 32px;border-top:1px solid #eeeeee;color:#888888;font-size:12px;">' +
    'Digital Business Lab &middot; 990 Biscayne Blvd, Ste 501-16, Miami, FL, United States, 33132' +
    '</td></tr>' +
    '</table></td></tr></table></body></html>'
  );
}

function confirmationHtml(locale, name) {
  if (locale === 'es') {
    return layout(
      '<p style="margin:0 0 16px;">Hola ' + name + ',</p>' +
      '<p style="margin:0 0 16px;">Gracias por compartir tu idea con <strong>Digital Business Lab</strong>. ' +
      'Ya recibimos tu formulario y nuestro equipo la va a revisar personalmente.</p>' +
      '<p style="margin:0 0 16px;">Podes esperar una respuesta nuestra dentro de los próximos ' +
      '<strong>2 días hábiles</strong> con los siguientes pasos.</p>' +
      '<p style="margin:0;">Mientras tanto, si tenes alguna pregunta, simplemente responde a este email.</p>' +
      '<p style="margin:24px 0 0;">— El equipo de DBL</p>'
    );
  }
  return layout(
    '<p style="margin:0 0 16px;">Hi ' + name + ',</p>' +
    '<p style="margin:0 0 16px;">Thank you for sharing your idea with <strong>Digital Business Lab</strong>. ' +
    'We\'ve received your submission and our team will review it personally.</p>' +
    '<p style="margin:0 0 16px;">You can expect to hear back from us within the next ' +
    '<strong>2 business days</strong> with next steps.</p>' +
    '<p style="margin:0;">In the meantime, if you have any questions, just reply to this email.</p>' +
    '<p style="margin:24px 0 0;">— The DBL team</p>'
  );
}

function notifyHtml(fields) {
  var row = function (label, value) {
    if (!value) return '';
    return (
      '<p style="margin:0 0 10px;"><strong style="color:#555;">' + label + ':</strong> ' + value + '</p>'
    );
  };
  return layout(
    '<p style="margin:0 0 20px;font-weight:700;">New idea submission (' + fields.locale.toUpperCase() + ')</p>' +
    row('Name', fields.name) +
    row('Email', fields.email) +
    row('Phone', fields.phone) +
    row('Company / Project', fields.company) +
    '<p style="margin:16px 0 6px;"><strong style="color:#555;">Idea:</strong></p>' +
    '<p style="margin:0;white-space:pre-wrap;background:#f7f7f7;border-radius:8px;padding:12px 14px;">' + fields.idea + '</p>'
  );
}

// Best-effort in-memory rate limit (max 5 submissions/IP/hour). This only
// holds for the lifetime of a warm serverless instance — it resets on cold
// starts and isn't shared across concurrent instances — but it's a free,
// zero-dependency backstop on top of the honeypot and input validation
// above. For stronger guarantees, add Vercel KV or Upstash Redis here.
var RATE_LIMIT_MAX = 5;
var RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
var rateLimitHits = new Map();

function isRateLimited(ip) {
  var now = Date.now();
  var hits = (rateLimitHits.get(ip) || []).filter(function (t) { return now - t < RATE_LIMIT_WINDOW_MS; });
  hits.push(now);
  rateLimitHits.set(ip, hits);
  if (rateLimitHits.size > 5000) rateLimitHits.clear(); // guard against unbounded growth
  return hits.length > RATE_LIMIT_MAX;
}

function sendEmail(apiKey, payload) {
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }).then(function (response) {
    if (!response.ok) {
      return response.text().then(function (text) {
        throw new Error('Resend request failed (' + response.status + '): ' + text);
      });
    }
    return response.json();
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ ok: false, error: 'method_not_allowed' });
    return;
  }

  var body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (err) {
      body = {};
    }
  }
  body = body || {};

  // Honeypot: bots that auto-fill every field trip this hidden input.
  // Report success without sending anything, so the bot doesn't retry.
  if (body.website) {
    res.status(200).json({ ok: true });
    return;
  }

  var ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
    res.status(429).json({ ok: false, error: 'rate_limited' });
    return;
  }

  var name = typeof body.name === 'string' ? body.name.trim() : '';
  var email = typeof body.email === 'string' ? body.email.trim() : '';
  var idea = typeof body.idea === 'string' ? body.idea.trim() : '';
  var phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  var company = typeof body.company === 'string' ? body.company.trim() : '';
  var locale = body.lang === 'es' ? 'es' : 'en';

  if (
    !name || !email || !idea ||
    !isValidEmail(email) ||
    name.length > MAX_LEN.name ||
    email.length > MAX_LEN.email ||
    phone.length > MAX_LEN.phone ||
    company.length > MAX_LEN.company ||
    idea.length > MAX_LEN.idea
  ) {
    res.status(400).json({ ok: false, error: 'invalid_input' });
    return;
  }

  var apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not set');
    res.status(500).json({ ok: false, error: 'server_not_configured' });
    return;
  }

  var safeName = escapeHtml(name);
  var safeEmail = escapeHtml(email);
  var safePhone = escapeHtml(phone);
  var safeCompany = escapeHtml(company);
  var safeIdea = escapeHtml(idea);

  try {
    await Promise.all([
      sendEmail(apiKey, {
        from: FROM_EMAIL,
        to: email,
        subject: locale === 'es'
          ? 'Recibimos tu idea — gracias por compartirla con DBL'
          : "We've received your idea — thank you for sharing it with DBL",
        html: confirmationHtml(locale, safeName),
      }),
      sendEmail(apiKey, {
        from: FROM_EMAIL,
        to: TO_EMAIL,
        reply_to: email,
        subject: 'New idea submission: ' + name,
        html: notifyHtml({ name: safeName, email: safeEmail, phone: safePhone, company: safeCompany, idea: safeIdea, locale: locale }),
      }),
    ]);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Failed to send contact form emails:', err);
    res.status(502).json({ ok: false, error: 'email_send_failed' });
  }
};
