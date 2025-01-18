import * as dotenv from "dotenv";

dotenv.config();

export const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export const RETRY_CONFIG = {
  maxRetries: 3,
  delay: 1000,
};

export const GITHUB_API_BASE = "https://api.github.com";

export const README_EVALUATION_PROMPT = `
Analyze this GitHub README and evaluate its quality on a scale of 1 to 10 based on the following criteria:
- Clear project description and purpose
- Installation and setup instructions
- Usage examples and documentation
- Contribution guidelines
- Code structure explanation
- Dependencies and requirements listing
- License information

Provide your response in the following JSON format:
{
  "score": number,
  "reasoning": "Brief 50-char max evaluation of key strengths/weaknesses",
  "suggestions": ["1-2 word improvement suggestion", "1-2 word improvement suggestion"]
}
`;
