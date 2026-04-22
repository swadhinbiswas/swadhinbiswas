export const prerender = false;

function escapeMarkdown(text: string): string {
    return text.replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}



export const POST = async ({ request }: { request: Request }) => {
    const data = await request.json();
    const { name, email, subject, message } = data;

    const missing = [];
    if (!name) missing.push("name");
    if (!email) missing.push("email");
    if (!subject) missing.push("subject");
    if (!message) missing.push("message");

    if (missing.length > 0) {
        console.warn("Contact form missing fields:", missing);
        return new Response(JSON.stringify({ error: `Missing required fields: ${missing.join(", ")}` }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    const BOT_TOKEN = import.meta.env.BOT_TOKEN || process.env.BOT_TOKEN;
    const CHAT_ID = import.meta.env.CHAT_ID || process.env.CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
        console.error("Missing Telegram credentials");
        return new Response(
            JSON.stringify({ error: "Server configuration error" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }

    const telegramMessage = `
📩 *New Contact Form Submission*

👤 *Name:* ${escapeMarkdown(name)}
📧 *Email:* ${escapeMarkdown(email)}
📝 *Subject:* ${escapeMarkdown(subject)}

💬 *Message:*
${escapeMarkdown(message)}
  `;

    try {
        const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        const response = await fetch(telegramUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: telegramMessage,
                parse_mode: "Markdown",
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Telegram API Error:", errorText);
            throw new Error(`Telegram API failed: ${response.statusText}`);
        }

        return new Response(
            JSON.stringify({ message: "Message sent successfully" }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );
    } catch (error) {
        console.error("Failed to send telegram message:", error);
        return new Response(JSON.stringify({ error: "Failed to send message" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
