import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("Error: GEMINI_API_KEY is not set.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

async function test() {
    try {
        console.log("Testing gemini-2.0-flash...");
        const result = await model.generateContent("Hello");
        const response = await result.response;
        console.log("Success! Response:", response.text());
    } catch (error) {
        console.error("Error:", error);
    }
}

test();
