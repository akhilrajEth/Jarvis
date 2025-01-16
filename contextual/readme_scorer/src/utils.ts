import { RetryConfig } from "./types";

export async function retry<T>(
  fn: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === config.maxRetries) {
        break;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, config.delay * attempt)
      );
    }
  }

  throw lastError || new Error("Unknown error occurred during retry");
}

export function validateRepositoryInput(input: string): {
  owner: string;
  repo: string;
} {
  const parts = input.split("/");

  if (parts.length !== 2) {
    throw new Error(
      'Invalid repository format. Please use "owner/repo" format'
    );
  }

  const [owner, repo] = parts;

  if (!owner || !repo) {
    throw new Error("Both owner and repository name are required");
  }

  return { owner, repo };
}

export function formatOutput(evaluation: {
  score: number;
  reasoning: string;
  suggestions: string[];
}): string {
  return `
README Quality Evaluation
------------------------
Score: ${evaluation.score}/10

Reasoning:
${evaluation.reasoning}

Suggestions for Improvement:
${evaluation.suggestions.map((s) => `- ${s}`).join("\n")}
`;
}
