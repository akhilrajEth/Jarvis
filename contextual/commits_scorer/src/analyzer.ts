import OpenAI from "openai";
import { Commit, AnalysisOutput } from "./types";
import { CONFIG } from "./config";

function validateAnalysisOutput(data: any): AnalysisOutput {
  if (typeof data.score !== "number" || data.score < 1 || data.score > 10) {
    throw new Error(
      "Invalid analysis: score must be a number between 1 and 10"
    );
  }
  if (typeof data.reasoning !== "string" || !data.reasoning) {
    throw new Error("Invalid analysis: missing or invalid reasoning");
  }
  if (!Array.isArray(data.suggestions)) {
    throw new Error("Invalid analysis: suggestions must be an array");
  }
  if (!data.suggestions.every((s: string) => typeof s === "string")) {
    throw new Error("Invalid analysis: all suggestions must be strings");
  }

  return {
    score: data.score,
    reasoning: data.reasoning,
    suggestions: data.suggestions,
  };
}

function prepareCommitAnalysisPrompt(commits: Commit[]): string {
  return commits
    .map(
      (commit) => `
Commit: ${commit.sha}
Author: ${commit.author.name}
Date: ${commit.author.date}
Message: ${commit.message}
Changes: +${commit.stats.additions} -${commit.stats.deletions} (${commit.stats.total} total)
`
    )
    .join("\n---\n");
}

export async function analyzeCommits(
  commits: Commit[]
): Promise<AnalysisOutput> {
  try {
    const openai = new OpenAI({ apiKey: CONFIG.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: CONFIG.COMMIT_ANALYSIS_PROMPT,
        },
        {
          role: "user",
          content: prepareCommitAnalysisPrompt(commits),
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response content received from OpenAI");
    }

    const result = JSON.parse(content);
    return validateAnalysisOutput(result);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to analyze commits: ${error.message}`);
    }
    throw new Error("Failed to analyze commits: Unknown error occurred");
  }
}
