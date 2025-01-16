import OpenAI from "openai";
import * as dotenv from 'dotenv'

dotenv.config()

const GITHUB_TOKEN = process.env.GITHUB_TOKEN 
const owner = "blorm-network";
const repo = "ZerePy";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface PullRequest {
  number: number;
  title: string;
  body: string;
  closed_at: string;
}

interface PRScore {
  score: number;
  explanation: string;
}

async function getClosedPRs(): Promise<PullRequest[]> {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=closed&sort=updated&direction=desc&per_page=2`, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json"
    }
  });
  
  if (!response.ok) {
    throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data as PullRequest[];
}

async function scorePR(pr: PullRequest): Promise<PRScore> {
  const prompt = `
    Analyze the following GitHub Pull Request and score it on a scale of 1-10 based on:
    1. Comprehensiveness of the feature set
    2. Documentation
    3. Impact on the project

    Title: ${pr.title}
    Description: ${pr.body}

    Provide a brief one-sentence explanation for the score.
    
    Return your response in the following format:
    Score: [numerical score]
    Explanation: [one-sentence explanation]
  `;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 150,
    temperature: 0.7,
  });

  const content = response.choices[0].message?.content?.trim() ?? "No score provided";
  const [scoreLine, explanationLine] = content.split('\n');
  const score = parseInt(scoreLine.split(':')[1].trim());
  const explanation = explanationLine.split(':')[1].trim();

  return { score, explanation };
}

async function main() {
  try {
    const closedPRs = await getClosedPRs();
    const results: Record<number, PRScore> = {};
    
    for (const pr of closedPRs) {
      const score = await scorePR(pr);
      results[pr.number] = score;
    }
    
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

main().catch(console.error);
