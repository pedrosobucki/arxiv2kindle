import dotenv from "dotenv";
dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

export const config = {
  emailUser: required("EMAIL_USER"),
  emailPassword: required("EMAIL_PASSWORD"),
  emailImapHost: required("EMAIL_IMAP_HOST"),
  emailImapPort: parseInt(process.env.EMAIL_IMAP_PORT || "993", 10),
  emailSmtpHost: required("EMAIL_SMTP_HOST"),
  emailSmtpPort: parseInt(process.env.EMAIL_SMTP_PORT || "587", 10),
  kindleEmail: required("KINDLE_EMAIL"),
  allowedSenders: required("ALLOWED_SENDERS")
    .split(",")
    .map((s) => s.trim().toLowerCase()),
  pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || "30000", 10),
  chromePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
};
