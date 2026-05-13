import { ImapFlow } from "imapflow";

export async function otpFetch(): Promise<string | undefined> {
    if (!process.env.AH_GMAIL_ADDRESS || !process.env.AH_GMAIL_PASSWORD) {
        throw new Error("No AH credentials provided.");
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

    let lock = await client.getMailboxLock('INBOX');

    try {
        if (!client.mailbox) {
            throw new Error("Mailbox not found");
        }

        if (client.mailbox.exists === 0) {
            throw new Error("No messages in mailbox");            
        }

        let range = Math.max(1, client.mailbox.exists - 9) + ':*'
        let messages = (await client.fetchAll(range, { 
            envelope: true, 
            source: true
        })).reverse();

        for (let message of messages) {
            if (!message || !message.envelope || !message.envelope.from) {
                continue;
            }

            if (message.envelope.from[0].address === "archershub.no-reply@dlsu.edu.ph" && message.envelope.subject === "OTP for Authentication") {
                emailBody = message.source?.toString();
                break;
            }
        }
    } catch (error: any) {
        return;
    } finally {
        lock.release();
        await client.logout();
    }

    if (!emailBody) {
        throw new Error("Recent OTP email not found");
    }

    const otpString = emailBody.match(/(<strong>)\d{6}(<\/strong>)/g);

    if (!otpString) {
        throw new Error("Recent OTP not found");
    }

    let otp = otpString[0].replace("<strong>", "").replace("</strong>", "");

    return otp;
}