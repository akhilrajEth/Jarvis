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
  console.log(data)
  return data as PullRequest[];
}

async function scorePR(pr: PullRequest): Promise<string> {
  const prompt = `
    Analyze the following GitHub Pull Request and score it on a scale of 1-10 based on:
    1. Comprehensiveness of the feature set
    2. Documentation
    3. Impact on the project

    Title: ${pr.title}
    Description: ${pr.body}

    Provide a brief one-sentence explanation for the score.
  `;

  const response = await client.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 150,
    temperature: 0.7,
  });

  return response.choices[0].message?.content?.trim() ?? "No score provided";
}

async function main() {
  try {
    const closedPRs = await getClosedPRs();
    for (const pr of closedPRs) {
      console.log(`Analyzing PR #${pr.number}: ${pr.title}`);
      const score = await scorePR(pr);
      console.log(`Score: ${score}\n`);
    }
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

main().catch(console.error);
