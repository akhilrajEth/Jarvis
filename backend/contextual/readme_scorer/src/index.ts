import { getRepositoryReadme } from "./github";
import { evaluateReadme } from "./openai";
import { validateRepositoryInput, formatOutput } from "./utils";

async function main() {
  try {
    // Get repository from command line arguments
    const repoArg = process.argv[2];
    if (!repoArg) {
      console.error('Please provide a repository in the format "owner/repo"');
      process.exit(1);
    }

    // Validate repository input
    const { owner, repo } = validateRepositoryInput(repoArg);

    // Fetch README content
    console.log(`Fetching README from ${owner}/${repo}...`);
    const readmeContent = await getRepositoryReadme(owner, repo);

    // Evaluate README
    console.log("Evaluating README quality...");
    const evaluation = await evaluateReadme(readmeContent);

    // Output results
    console.log(formatOutput(evaluation));
  } catch (error) {
    console.error("Error:", (error as Error).message);
    process.exit(1);
  }
}

// function main() {
//   console.log("TESTING THIS OUT RN");
// }

main();
