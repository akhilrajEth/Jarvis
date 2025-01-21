import { createClient } from "@supabase/supabase-js";
import { getRepositoryReadme } from "./github";
import { evaluateReadme } from "./openai";
import { validateRepositoryInput, formatOutput } from "./utils";
import { Project } from "./types";

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials in environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function processRepository(project: Project): Promise<void> {
  try {
    const { owner, repo } = validateRepositoryInput(project.github_slug);

    // Fetch README content
    console.log(`Fetching README from ${owner}/${repo}...`);
    const readmeContent = await getRepositoryReadme(owner, repo);

    // Evaluate README
    console.log(`Evaluating README quality for ${project.github_slug}...`);
    const evaluation = await evaluateReadme(readmeContent);

    // Update only the readme_score while preserving all other properties
    const updatedAnalysis = {
      ...project.github_analysis, // Spread the existing analysis to keep all properties
      readme_score: evaluation, // Update only the readme_score
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
    // Continue with other repositories even if one fails
  }
}

async function main() {
  try {
    // Fetch projects where readme_score is null
    const { data: projects, error } = await supabase
      .from("jarvis_projects")
      .select("*")
      .filter("github_analysis->readme_score", "eq", null);

    if (error) {
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }

    if (!projects || projects.length === 0) {
      console.log("No projects found that need README evaluation");
      return;
    }

    console.log(`Found ${projects.length} projects to process`);

    // Process each repository sequentially to avoid rate limiting
    for (const project of projects) {
      await processRepository(project);
    }

    console.log("Completed processing all repositories");
  } catch (error) {
    console.error("Error:", (error as Error).message);
    process.exit(1);
  }
}

main();
