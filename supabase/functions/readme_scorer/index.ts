// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// console.log("Hello from Functions!")

// Deno.serve(async (req) => {
//   const { name } = await req.json()
//   const data = {
//     message: `Hello ${name}!`,
//   }

//   return new Response(
//     JSON.stringify(data),
//     { headers: { "Content-Type": "application/json" } },
//   )
// })

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/readme_scorer' \
    --header 'Authorization: Bearer ' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { OpenAI } from "https://esm.sh/openai@4.28.0";

// Types
interface GitHubAPIResponse {
  content: string;
  encoding: string;
  name: string;
}

interface ReadmeEvaluation {
  score: number;
  reasoning: string;
  suggestions: string[];
}

interface ApiError extends Error {
  status?: number;
  response?: {
    status: number;
    data: any;
  };
}

interface RetryConfig {
  maxRetries: number;
  delay: number;
}

interface GithubAnalysis {
  readme_score: ReadmeEvaluation | null;
  [key: string]: any;
}

interface Project {
  id: number;
  github_slug: string;
  project_category: string;
  project_name: string;
  github_analysis: GithubAnalysis;
}

// Constants
const RETRY_CONFIG = {
  maxRetries: 3,
  delay: 1000,
};

const GITHUB_API_BASE = "https://api.github.com";

const README_EVALUATION_PROMPT = `
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

// Utility functions
async function retry<T>(fn: () => Promise<T>, config: RetryConfig): Promise<T> {
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

function validateRepositoryInput(input: string): {
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

// GitHub API interaction
async function getRepositoryReadme(
  owner: string,
  repo: string,
  githubToken: string
): Promise<string> {
  const headers = {
    Accept: "application/vnd.github.v3+json",
    Authorization: `Bearer ${githubToken}`,
  };

  try {
    const response = await retry(async () => {
      const result = await fetch(
        `${GITHUB_API_BASE}/repos/${owner}/${repo}/readme`,
        { headers }
      );
      if (!result.ok) {
        const error = new Error(
          `GitHub API error: ${result.status}`
        ) as ApiError;
        error.status = result.status;
        throw error;
      }
      return result;
    }, RETRY_CONFIG);

    const data = (await response.json()) as GitHubAPIResponse;
    const { content, encoding } = data;

    if (encoding === "base64") {
      return atob(content);
    }

    throw new Error("Unsupported README encoding");
  } catch (error) {
    const apiError = error as ApiError;
    if (apiError.status === 404) {
      throw new Error("README not found in repository");
    }
    if (apiError.status === 403) {
      throw new Error("GitHub API rate limit exceeded or invalid token");
    }
    throw new Error(`Failed to fetch README: ${apiError.message}`);
  }
}

// OpenAI evaluation
async function evaluateReadme(
  readmeContent: string,
  openaiApiKey: string
): Promise<ReadmeEvaluation> {
  // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
  const openai = new OpenAI({ apiKey: openaiApiKey });

  try {
    const response = await retry(async () => {
      return await openai.chat.completions.create({
        model: "gpt-4o",
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

async function processRepository(
  project: Project,
  supabase: any,
  githubToken: string,
  openaiApiKey: string
): Promise<void> {
  try {
    const { owner, repo } = validateRepositoryInput(project.github_slug);

    // Fetch README content
    console.log(`Fetching README from ${owner}/${repo}...`);
    const readmeContent = await getRepositoryReadme(owner, repo, githubToken);

    // Evaluate README
    console.log(`Evaluating README quality for ${project.github_slug}...`);
    const evaluation = await evaluateReadme(readmeContent, openaiApiKey);

    // Update only the readme_score while preserving all other properties
    const updatedAnalysis = {
      ...project.github_analysis,
      readme_score: evaluation,
    };

    // Update the database
    const { error } = await supabase
      .from("jarvis_projects")
      .update({ github_analysis: updatedAnalysis })
      .eq("github_slug", project.github_slug);

    if (error) {
      throw new Error(
        `Failed to update database for ${project.github_slug}: ${error.message}`
      );
    }

    console.log(
      `Successfully processed and updated evaluation for ${project.github_slug}`
    );
  } catch (error) {
    console.error(
      `Error processing ${project.github_slug}:`,
      (error as Error).message
    );
  }
}

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const githubToken = Deno.env.get("GITHUB_TOKEN");
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !githubToken || !openaiApiKey) {
      throw new Error("Missing required environment variables");
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch projects where readme_score is null
    const { data: projects, error } = await supabase
      .from("jarvis_projects")
      .select("*")
      .filter("github_analysis->readme_score", "eq", null);

    if (error) {
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }

    if (!projects || projects.length === 0) {
      return new Response(
        JSON.stringify({
          message: "No projects found that need README evaluation",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    console.log(`Found ${projects.length} projects to process`);

    // Process each repository sequentially to avoid rate limiting
    for (const project of projects) {
      await processRepository(project, supabase, githubToken, openaiApiKey);
    }

    return new Response(
      JSON.stringify({
        message: "Completed processing all repositories",
        processed: projects.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
