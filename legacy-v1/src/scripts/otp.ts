import { ImapFlow } from "imapflow";

export async function otpFetch(): Promise<string | undefined> {
    if (!process.env.AH_GMAIL_ADDRESS || !process.env.AH_GMAIL_PASSWORD) {
        throw new Error("OTP Error: No AH credentials provided.");
    }

    let emailBody;
    
    const client = new ImapFlow({
        host: 'imap.gmail.com',
        port: 993,
        secure: true,
        auth: {
            user: process.env.AH_GMAIL_ADDRESS as string,
            pass: process.env.AH_GMAIL_PASSWORD
        },
        logger: false
    });

    await client.connect();

    const lock = await client.getMailboxLock('INBOX');

    try {
        if (!client.mailbox) {
            throw new Error("OTP Error: Mailbox not found");
        }

        if (client.mailbox.exists === 0) {
            throw new Error("OTP Error: No messages in mailbox");            
        }

        const range = Math.max(1, client.mailbox.exists - 9) + ':*'
        const messages = (await client.fetchAll(range, {
            envelope: true, 
            source: true
        })).reverse();

        for (const message of messages) {
            if (!message || !message.envelope || !message.envelope.from) {
                continue;
            }

            if (message.envelope.from[0].address === "archershub.no-reply@dlsu.edu.ph" && message.envelope.subject === "OTP for Authentication") {
                emailBody = message.source?.toString();
                break;
            }
        }
    } catch {
        return;
    } finally {
        lock.release();
        await client.logout();
    }

    if (!emailBody) {
        throw new Error("OTP Error: Recent OTP email not found");
    }

    const otpString = emailBody.match(/(<strong>)\d{6}(<\/strong>)/g);

    if (!otpString) {
        throw new Error("OTP Error: Recent OTP not found");
    }

    const otp = otpString[0].replace("<strong>", "").replace("</strong>", "");

    return otp;
}