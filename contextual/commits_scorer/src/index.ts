import { fetchCommits } from "./github";
import { analyzeCommits } from "./analyzer";
import { CONFIG } from "./config";
import { Commit } from "./types";

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 1) {
    console.error("Usage: npx ts-node src/index.ts <owner/repo>");
    process.exit(1);
  }

  const repoUrl = args[0];

  try {
    console.log("Fetching commits...");
    const { commits, totalCommits } = await fetchCommits(repoUrl);

    if (!commits.length) {
      throw new Error("No commits found in the repository");
    }

    console.log(
      `Analyzing ${commits.length} sample commits from a total of ${totalCommits} commits...`
    );

    // Process commits in smaller batches for efficient API usage
    const batches: Commit[][] = [];
    for (let i = 0; i < commits.length; i += CONFIG.COMMITS_PER_BATCH) {
      batches.push(commits.slice(i, i + CONFIG.COMMITS_PER_BATCH));
    }

    let totalScore = 0;
    const allSuggestions = new Set<string>();
    const combinedReasoning: string[] = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`Analyzing batch ${i + 1}/${batches.length}...`);

      try {
        const analysis = await analyzeCommits(batch);
        totalScore += analysis.score;
        analysis.suggestions.forEach((suggestion) =>
          allSuggestions.add(suggestion)
        );
        combinedReasoning.push(analysis.reasoning);
      } catch (error) {
        console.error(
          `Failed to analyze batch ${i + 1}:`,
          error instanceof Error ? error.message : "Unknown error"
        );
        // Continue with next batch instead of failing completely
        continue;
      }
    }

    if (combinedReasoning.length === 0) {
      throw new Error("Failed to analyze any commits successfully");
    }

    const averageScore = totalScore / combinedReasoning.length;

    console.log("\n=== Commit Analysis Results ===\n");
    console.log(`Repository: ${repoUrl}`);
    console.log(
      `Analyzed: ${commits.length} sample commits out of ${totalCommits} total commits`
    );
    console.log(`Overall Score: ${averageScore.toFixed(1)}/10`);
    console.log("\nReasoning:");
    combinedReasoning.forEach((reason, index) => {
      console.log(`\nBatch ${index + 1}:`);
      console.log(reason);
    });

    console.log("\nSuggestions for Improvement:");
    Array.from(allSuggestions).forEach((suggestion, index) => {
      console.log(`${index + 1}. ${suggestion}`);
    });
  } catch (error) {
    console.error(
      "Error:",
      error instanceof Error ? error.message : "Unknown error occurred"
    );
    process.exit(1);
  }
}

// Handle any unhandled promise rejections
process.on("unhandledRejection", (error) => {
  console.error(
    "Unhandled promise rejection:",
    error instanceof Error ? error.message : "Unknown error"
  );
  process.exit(1);
});

main();
