import axios from "axios";
import { Commit, CommitBatch } from "./types";
import { CONFIG } from "./config";

const headers = {
  Authorization: `token ${CONFIG.GITHUB_TOKEN}`,
};

function parseRepoUrl(url: string): { owner: string; repo: string } {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) {
    throw new Error("Invalid GitHub repository URL");
  }
  return { owner: match[1], repo: match[2].replace(".git", "") };
}

function validateCommit(data: any): Commit {
  if (!data.sha || typeof data.sha !== "string") {
    throw new Error("Invalid commit: missing or invalid SHA");
  }
  if (!data.message || typeof data.message !== "string") {
    throw new Error("Invalid commit: missing or invalid message");
  }
  if (!data.author?.name || !data.author?.date) {
    throw new Error("Invalid commit: missing or invalid author information");
  }
  if (
    typeof data.stats?.additions !== "number" ||
    typeof data.stats?.deletions !== "number" ||
    typeof data.stats?.total !== "number"
  ) {
    throw new Error("Invalid commit: missing or invalid stats");
  }

  return {
    sha: data.sha,
    message: data.message,
    author: {
      name: data.author.name,
      date: data.author.date,
    },
    stats: {
      additions: data.stats.additions,
      deletions: data.stats.deletions,
      total: data.stats.total,
    },
  };
}

function sampleCommits(commits: Commit[], sampleSize: number): Commit[] {
  if (commits.length <= sampleSize) return commits;

  const step = Math.max(1, Math.floor(commits.length / sampleSize));
  const sampledCommits: Commit[] = [];

  // Take evenly spaced commits to get a representative sample
  for (
    let i = 0;
    i < commits.length && sampledCommits.length < sampleSize;
    i += step
  ) {
    sampledCommits.push(commits[i]);
  }

  return sampledCommits;
}

export async function fetchCommits(repoUrl: string): Promise<CommitBatch> {
  const { owner, repo } = parseRepoUrl(repoUrl);
  const commits: Commit[] = [];
  let page = 1;

  try {
    // Fetch enough commits to get a good sample
    while (commits.length < CONFIG.MIN_COMMITS_TO_FETCH) {
      const response = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/commits`,
        {
          headers,
          params: {
            per_page: Math.min(
              100,
              CONFIG.MIN_COMMITS_TO_FETCH - commits.length
            ),
            page,
          },
        }
      );

      if (response.data.length === 0) break;

      const commitDetails = await Promise.all(
        response.data.map(async (commit: any) => {
          const detail = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/commits/${commit.sha}`,
            { headers }
          );

          return validateCommit({
            sha: commit.sha,
            message: commit.commit.message,
            author: {
              name: commit.commit.author?.name || "Unknown",
              date: commit.commit.author?.date || new Date().toISOString(),
            },
            stats: {
              additions: detail.data.stats?.additions || 0,
              deletions: detail.data.stats?.deletions || 0,
              total: detail.data.stats?.total || 0,
            },
          });
        })
      );

      commits.push(...commitDetails);
      page++;
    }

    // Sample the commits to get a representative subset
    const sampledCommits = sampleCommits(commits, CONFIG.SAMPLE_SIZE);

    return {
      commits: sampledCommits,
      totalCommits: commits.length,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Failed to fetch commits: ${
          error.response?.data?.message || error.message
        }`
      );
    }
    throw new Error("Failed to fetch commits: Unknown error occurred");
  }
}
