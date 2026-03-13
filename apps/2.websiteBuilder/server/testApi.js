import dotenv from 'dotenv';

dotenv.config();

const openRouterUrl = "https://openrouter.ai/api/v1/chat/completions";
const model = "deepseek/deepseek-chat";

async function testConnection() {
    const key = process.env.OPENROUTER_API_KEY;
    console.log("Testing OpenRouter API Key:", key ? key.slice(0, 20) + "..." : "MISSING");

    try {
        const res = await fetch(openRouterUrl, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${key}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: "system", content: "Reply with exactly one word: Success." },
                    { role: 'user', content: "Test." },
                ],
                temperature: 0.1,
                max_tokens: 10
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            console.log("STATUS:", res.status);
            console.log("ERROR:", JSON.stringify(data));
            return;
        }

        console.log("STATUS: OK (" + res.status + ")");
        console.log("RESPONSE:", data.choices[0].message.content);
        console.log("MODEL USED:", data.model);
        console.log("TEST PASSED!");
    } catch (error) {
        console.log("NETWORK ERROR:", error.message);
    }
}

testConnection();
