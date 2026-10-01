/**
 * One-off SMTP smoke test. Reads api/.env; does not print the password.
 */
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

function loadEnv(file) {
  const out = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (!m) continue;
    out[m[1]] = m[2].replace(/^"|"$/g, '');
  }
  return out;
}

async function main() {
  const env = loadEnv(path.join(__dirname, '..', '.env'));
  if (env.EMAIL_MODE !== 'smtp') {
    throw new Error(`EMAIL_MODE is ${env.EMAIL_MODE}, expected smtp`);
  }
  const transporter = nodemailer.createTransport({
    host: env.EMAIL_SMTP_HOST,
    port: Number(env.EMAIL_SMTP_PORT || 587),
    secure: env.EMAIL_SMTP_SECURE === 'true',
    auth: {
      user: env.EMAIL_SMTP_USER,
      pass: env.EMAIL_SMTP_PASS,
    },
  });
  await transporter.verify();
  const info = await transporter.sendMail({
    from: env.EMAIL_FROM || env.EMAIL_SMTP_USER,
    to: env.EMAIL_SMTP_USER,
    subject: 'AWOH-B SMTP test — receipt email ready',
    text: 'SMTP is configured. Paid orders will email the PDF receipt automatically.',
  });
  console.log('SMTP_OK', info.messageId || 'sent');
}

main().catch((err) => {
  console.error('SMTP_FAIL', err.message);
  process.exit(1);
});
