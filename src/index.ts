import { config } from "./config";
import { checkInbox } from "./email";
import { sendToKindle } from "./email";
import { extractArxivId, convertArxivToPdf } from "./arxiv";

async function poll() {
  try {
    console.log(`[${new Date().toISOString()}] Checking inbox...`);
    const emails = await checkInbox();

    if (emails.length === 0) {
      console.log("No new emails found.");
      return;
    }

    console.log(`Found ${emails.length} new email(s).`);

    for (const email of emails) {
      const sender = email.from.toLowerCase();
      if (!config.allowedSenders.includes(sender)) {
        console.log(`Ignoring email from unauthorized sender: ${sender}`);
        continue;
      }

      const arxivId =
        extractArxivId(email.subject) || extractArxivId(email.text);

      if (!arxivId) {
        console.log(
          `No arXiv ID found in email from ${sender}: "${email.subject}"`,
        );
        continue;
      }

      console.log(`Processing arXiv ${arxivId} from ${sender}...`);

      const { filePath, title } = await convertArxivToPdf(arxivId);
      console.log(`PDF generated: ${filePath}`);

      await sendToKindle(filePath, title);
      console.log(`Sent "${title}" to ${config.kindleEmail}`);
    }
  } catch (err) {
    console.error("Poll error:", err);
  }
}

async function main() {
  console.log("arxiv2kindle worker started");
  console.log(`Polling every ${config.pollIntervalMs / 1000}s`);
  console.log(`Allowed senders: ${config.allowedSenders.join(", ")}`);

  process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down");
    process.exit(0);
  });

  process.on("SIGINT", () => {
    console.log("SIGINT received, shutting down");
    process.exit(0);
  });

  await poll();
  setInterval(poll, config.pollIntervalMs);
}

main();
