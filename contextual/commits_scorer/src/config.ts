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
- Meaningful changes (penalize trivial changes like whitespace or variable renames without purpose)
- Size and scope of changes (prefer focused, single-purpose commits)
- Impact and purpose (higher scores for bug fixes, features, or performance improvements)
- Code quality impact (improvements to maintainability, readability, or architecture)

Scoring guide:
10: Perfect commit with clear purpose, tests, and documentation
7-9: Good commits with clear purpose and well-structured changes
4-6: Average commits with room for improvement
1-3: Poor commits (trivial changes, unclear purpose, or mixed concerns)

Respond in JSON format:
{
  "score": number,
  "reasoning": "Brief 50-char max",
  "suggestions": ["1-2 word improvement suggestion", "1-2 word improvement suggestion"]
}`,
};
