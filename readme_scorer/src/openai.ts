import OpenAI from "openai";
import {
  OPENAI_API_KEY,
  README_EVALUATION_PROMPT,
  RETRY_CONFIG,
} from "./config";
import { ReadmeEvaluation, ApiError } from "./types";
import { retry } from "./utils";

// To-Do: Change to a cheaper model
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export async function evaluateReadme(
  readmeContent: string
): Promise<ReadmeEvaluation> {
  try {
    const response = await retry(async () => {
      return await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a documentation expert who evaluates GitHub READMEs for clarity and completeness.",
          },
          {
            role: "user",
            content: `${README_EVALUATION_PROMPT}\n\nREADME Content:\n${readmeContent}`,
          },
        ],
        response_format: { type: "json_object" },
      });
    }, RETRY_CONFIG);

    if (!response.choices[0].message.content) {
      throw new Error("Empty response from OpenAI API");
    }

    const result = JSON.parse(
      response.choices[0].message.content
    ) as ReadmeEvaluation;

    // Validate response format
    if (
      !result.score ||
      !result.reasoning ||
      !Array.isArray(result.suggestions)
    ) {
      throw new Error("Invalid response format from OpenAI API");
    }

    // Ensure score is between 1 and 10
    result.score = Math.max(1, Math.min(10, Math.round(result.score)));

    return result;
  } catch (error) {
    throw new Error(`Failed to evaluate README: ${(error as Error).message}`);
  }
}
