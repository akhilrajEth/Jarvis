import OpenAI from "openai";
import { Commit, AnalysisOutput } from "./types";
import { CONFIG } from "./config";

function validateAnalysisOutput(data: any): AnalysisOutput {
  // First check if we have a commits array
  const commits = data.commits || data.commitScores;
  if (!Array.isArray(commits)) {
    throw new Error("Invalid analysis: expected array of commits");
  }

  // Initialize aggregated values
  let totalScore = 0;
  const allReasons: string[] = [];
  const allSuggestions: string[] = [];

  // Validate and collect data from each commit
  commits.forEach((commit, index) => {
    // Validate score
    if (
      typeof commit.score !== "number" ||
      commit.score < 1 ||
      commit.score > 10
    ) {
      throw new Error(
        `Invalid analysis for commit ${index}: score must be a number between 1 and 10`
      );
    }
    totalScore += commit.score;

    // Validate reasoning
    if (typeof commit.reasoning !== "string" || !commit.reasoning) {
      throw new Error(
        `Invalid analysis for commit ${index}: missing or invalid reasoning`
      );
    }
    allReasons.push(commit.reasoning);

    // Validate suggestions array
    if (!Array.isArray(commit.suggestions)) {
      throw new Error(
        `Invalid analysis for commit ${index}: suggestions must be an array`
      );
    }

    // Validate each suggestion is a string
    if (!commit.suggestions.every((s: any) => typeof s === "string")) {
      throw new Error(
        `Invalid analysis for commit ${index}: all suggestions must be strings`
      );
    }
    allSuggestions.push(...commit.suggestions);
  });

  // Calculate average score rounded to nearest integer
  const averageScore = Math.round(totalScore / commits.length);

  // Combine all reasons into a single string
  const combinedReasoning = allReasons.join("; ");

  // Remove duplicate suggestions while preserving order
  const uniqueSuggestions = [...new Set(allSuggestions)];

  return {
    score: averageScore,
    reasoning: combinedReasoning,
    suggestions: uniqueSuggestions,
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

    console.log("CONTENT:", content);

    if (!content) {
      throw new Error("No response content received from OpenAI");
    }

    const result = JSON.parse(content);
    console.log("RESULT:", result);
    return validateAnalysisOutput(result);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to analyze commits: ${error.message}`);
    }
    throw new Error("Failed to analyze commits: Unknown error occurred");
  }
}
