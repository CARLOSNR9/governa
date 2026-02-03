import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY!;

if (!apiKey) {
    console.warn("GEMINI_API_KEY is not defined in environment variables");
}

const genAI = new GoogleGenerativeAI(apiKey || "INSERT_API_KEY_HERE");

export const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function generateContent(prompt: string) {
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error connecting to Gemini:", error);
        return null;
    }
}
