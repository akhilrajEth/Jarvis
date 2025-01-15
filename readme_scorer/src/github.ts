import axios from "axios";
import { GITHUB_TOKEN, GITHUB_API_BASE, RETRY_CONFIG } from "./config";
import { GitHubAPIResponse, ApiError } from "./types";
import { retry } from "./utils";

export async function getRepositoryReadme(
  owner: string,
  repo: string
): Promise<string> {
  const headers = {
    Accept: "application/vnd.github.v3+json",
    Authorization: `Bearer ${GITHUB_TOKEN}`,
  };

  console.log("OWNER:", owner);
  console.log("REPO:", repo);

  console.log(
    `Fetching README from: ${GITHUB_API_BASE}/repos/${owner}/${repo}/readme`
  );

  console.log("Token exists:", !!GITHUB_TOKEN);

  try {
    const response = await retry(async () => {
      const result = await axios.get<GitHubAPIResponse>(
        `${GITHUB_API_BASE}/repos/${owner}/${repo}/readme`,
        { headers }
      );
      return result;
    }, RETRY_CONFIG);

    const { content, encoding } = response.data;

    if (encoding === "base64") {
      return Buffer.from(content, "base64").toString("utf-8");
    }

    throw new Error("Unsupported README encoding");
  } catch (error) {
    const apiError = error as ApiError;
    if (apiError.response?.status === 404) {
      throw new Error("README not found in repository");
    }
    if (apiError.response?.status === 403) {
      throw new Error("GitHub API rate limit exceeded or invalid token");
    }
    throw new Error(`Failed to fetch README: ${apiError.message}`);
  }
}
