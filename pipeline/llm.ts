/**
 * OpenAI GPT-4o-mini Wrapper
 * ──────────────────────────
 * Provides a simple interface to the OpenAI API (gpt-4o-mini model)
 * for fallback decisions (e.g., alternative Pexels queries when
 * the original returns no results).
 *
 * Primary creative decisions come from Gemini via the topic JSON.
 * This wrapper is for runtime fallbacks only.
 */

import https from "https";

interface LLMConfig {
    apiKey: string;
    model?: string;
}

interface LLMResponse {
    content: string;
    usage: {
        promptTokens: number;
        completionTokens: number;
    };
}

/**
 * Call OpenAI chat completions API.
 */
export async function askLLM(
    prompt: string,
    config: LLMConfig,
    systemPrompt?: string,
): Promise<LLMResponse> {
    const model = config.model || "gpt-4o-mini";

    const messages: Array<{ role: string; content: string }> = [];
    if (systemPrompt) {
        messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const body = JSON.stringify({
        model,
        messages,
        max_tokens: 500,
    });

    return new Promise((resolve, reject) => {
        const options = {
            hostname: "api.openai.com",
            path: "/v1/chat/completions",
            method: "POST",
            headers: {
                "Authorization": `Bearer ${config.apiKey}`,
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(body),
            },
        };

        const req = https.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
                try {
                    const json = JSON.parse(data);

                    if (res.statusCode && res.statusCode >= 400) {
                        reject(new Error(`OpenAI API error ${res.statusCode}: ${JSON.stringify(json)}`));
                        return;
                    }

                    const choice = json.choices?.[0];
                    if (!choice) {
                        reject(new Error(`No choices in OpenAI response: ${data}`));
                        return;
                    }

                    resolve({
                        content: choice.message?.content || "",
                        usage: {
                            promptTokens: json.usage?.prompt_tokens || 0,
                            completionTokens: json.usage?.completion_tokens || 0,
                        },
                    });
                } catch {
                    reject(new Error(`Failed to parse OpenAI response: ${data}`));
                }
            });
        });

        req.on("error", reject);
        req.write(body);
        req.end();
    });
}

/**
 * Suggest an alternative Pexels search query when the original returns no results.
 */
export async function suggestAlternativeQuery(
    originalQuery: string,
    context: string,
    config: LLMConfig,
): Promise<string> {
    const prompt = `The Pexels stock media search for "${originalQuery}" returned no results.
Context: ${context}

Suggest ONE alternative search query (3-5 words, simple, generic stock footage terms).
Reply with ONLY the query, no quotes, no explanation.`;

    const response = await askLLM(prompt, config);
    return response.content.trim();
}

// ── CLI entry point ──────────────────────────────────────────────────────────
if (process.argv[1]?.endsWith("llm.ts") || process.argv[1]?.endsWith("llm.js")) {
    const dotenv = require("dotenv");
    dotenv.config();

    const prompt = process.argv[2] || "What is 2+2?";
    const apiKey = process.env.OPENAI_API_KEY || process.env.PERPLEXITY_API_KEY;

    if (!apiKey) {
        console.error("❌ Missing OPENAI_API_KEY in .env");
        process.exit(1);
    }

    console.log("🤖 OpenAI GPT-4o-mini Test");
    console.log(`  Prompt: ${prompt}`);

    askLLM(prompt, { apiKey })
        .then((res) => {
            console.log(`\n  Response: ${res.content}`);
            console.log(`  Tokens: ${res.usage.promptTokens} prompt, ${res.usage.completionTokens} completion`);
        })
        .catch((err) => {
            console.error("❌ Failed:", err.message);
            process.exit(1);
        });
}
