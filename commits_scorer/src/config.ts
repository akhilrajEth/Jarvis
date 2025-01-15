import * as dotenv from "dotenv";

dotenv.config();

if (!process.env.GITHUB_TOKEN || !process.env.OPENAI_API_KEY) {
  console.error(
    "Missing required environment variables: GITHUB_TOKEN and/or OPENAI_API_KEY"
  );
  process.exit(1);
}

export const CONFIG = {
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  SAMPLE_SIZE: 20, // Number of commits to analyze
  COMMITS_PER_BATCH: 5, // Number of commits to analyze in each OpenAI API call
  MIN_COMMITS_TO_FETCH: 100, // Minimum number of commits to fetch for sampling
  COMMIT_ANALYSIS_PROMPT: `Analyze the following git commits and provide:
1. A quality score (1-10)
2. Reasoning for the score
3. Suggestions for improvement

Consider:
- Commit message clarity and completeness
- Size and scope of changes
- Consistency and convention following
- Impact and purpose of changes

Respond in JSON format:
{
  "score": number,
  "reasoning": string,
  "suggestions": string[]
}`,
};
