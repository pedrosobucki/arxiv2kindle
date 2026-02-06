import { ImapFlow } from "imapflow";
import nodemailer from "nodemailer";
import path from "path";
import { config } from "./config";

export interface IncomingEmail {
  uid: number;
  from: string;
  subject: string;
  text: string;
}

export async function checkInbox(): Promise<IncomingEmail[]> {
  const client = new ImapFlow({
    host: config.emailImapHost,
    port: config.emailImapPort,
    secure: true,
    auth: {
      user: config.emailUser,
      pass: config.emailPassword,
    },
    logger: false,
  });

  const emails: IncomingEmail[] = [];

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");

    try {
      const uids = await client.search({ seen: false }, { uid: true });

      if (!uids || uids.length === 0) {
        return emails;
      }

      const messages = client.fetch(
        uids.join(","),
        {
          uid: true,
          envelope: true,
          bodyParts: ["1"],
        },
        { uid: true },
      );

      for await (const msg of messages) {
        const from = msg.envelope?.from?.[0]?.address || "";
        const subject = msg.envelope?.subject || "";
        const bodyPart = msg.bodyParts?.get("1");
        const text = bodyPart ? bodyPart.toString() : "";
        emails.push({
          uid: msg.uid,
          from,
          subject,
          text,
        });
      }

      // Mark all fetched as seen after iteration is complete
      if (emails.length > 0) {
        await client.messageFlagsAdd(uids.join(","), ["\\Seen"], {
          uid: true,
        });
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (err) {
    console.error("IMAP error:", err);
    try {
      await client.close();
    } catch {}
  }

  return emails;
}

export async function sendToKindle(
  pdfPath: string,
  title: string,
): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: config.emailSmtpHost,
    port: config.emailSmtpPort,
    secure: config.emailSmtpPort === 465,
    auth: {
      user: config.emailUser,
      pass: config.emailPassword,
    },
  });

  await transporter.sendMail({
    from: config.emailUser,
    to: config.kindleEmail,
    subject: title,
    text: "",
    attachments: [
      {
        filename: path.basename(pdfPath),
        path: pdfPath,
      },
    ],
  });
}
