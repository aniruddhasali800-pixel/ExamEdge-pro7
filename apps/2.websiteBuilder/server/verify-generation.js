import fs from 'fs';
import dotenv from 'dotenv';
import { generateResponse } from './config/openRouter.js';
import extractJson from './utils/extractJson.js';

dotenv.config();

const masterPrompt = `
YOU ARE A PRINCIPAL FRONTEND ARCHITECT
... [TRUNCATED FOR BREVITY IN CODE BUT I WILL USE THE FULL ONE BELOW] ...
`;

// Re-using the actual master prompt from controllers to be 100% accurate
const getMasterPrompt = async () => {
    const filePath = './controllers/website.controllers.js';
    const content = fs.readFileSync(filePath, 'utf8');
    const startMatch = 'const masterPrompt = `';
    const start = content.indexOf(startMatch) + startMatch.length;
    const end = content.indexOf('`;', start);
    return content.slice(start, end);
};

const verify = async (userPrompt) => {
    console.log("Starting Verification for prompt:", userPrompt);

    try {
        const fullMasterPrompt = await getMasterPrompt();
        const finalPrompt = fullMasterPrompt.replace("{USER_PROMPT}", userPrompt);

        console.log("Calling AI (this may take a minute)...");
        const raw = await generateResponse(finalPrompt);
        const parsed = await extractJson(raw);

        if (!parsed || !parsed.code) {
            console.error("AI returned invalid response:", raw);
            return;
        }

        const fileName = 'test-output.html';
        fs.writeFileSync(fileName, parsed.code);

        console.log("------------------------------------------");
        console.log("SUCCESS!");
        console.log("Message from AI:", parsed.message);
        console.log("Website generated and saved to:", fileName);
        console.log("You can open this file in your browser to view it.");
        console.log("------------------------------------------");

    } catch (error) {
        console.error("Verification failed:", error.message);
    }
};

const prompt = process.argv[2] || "A modern portfolios website for a photographer";
verify(prompt);
