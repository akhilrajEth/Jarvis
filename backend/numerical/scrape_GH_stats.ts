import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const API_URL = "https://api.github.com";

// Replace with your GitHub Personal Access Token
const TOKEN = process.env.GITHUB_TOKEN;

// Replace with the owner and repository name
const OWNER = "jasonhedman";
const REPO = "the-hive";

const headers = {
    "Authorization": `token ${TOKEN}`,
    "Accept": "application/vnd.github.v3+json"
};

interface PullRequest {
    state: string;
    user: {
        login: string;
    };
}

interface RepoStats {
    stargazers_count: number;
    forks_count: number;
}

async function getPRStats(): Promise<[number, number, number]> {
    let url: string | null = `${API_URL}/repos/${OWNER}/${REPO}/pulls`;
    let openPRs = 0;
    let closedPRs = 0;
    const authors = new Set<string>();

    while (url) {
        const response = await axios.get<PullRequest[]>(url, { headers, params: { state: 'all', per_page: 100 } });
        const data = response.data;

        for (const pr of data) {
            if (pr.state === "open") {
                openPRs++;
            } else {
                closedPRs++;
            }
            authors.add(pr.user.login);
        }

        url = getNextPageUrl(response.headers.link);
    }

    return [openPRs, closedPRs, authors.size];
}

async function getRepoStats(): Promise<[number, number]> {
    const url = `${API_URL}/repos/${OWNER}/${REPO}`;
    const response = await axios.get<RepoStats>(url, { headers });
    const data = response.data;

    return [data.stargazers_count, data.forks_count];
}

async function getContributorsCount(): Promise<number> {
    const url = `${API_URL}/repos/${OWNER}/${REPO}/contributors`;
    const response = await axios.get(url, { headers, params: { per_page: 1, anon: 1 } });

    if (response.headers.link) {
        const match = response.headers.link.match(/&page=(\d+)>; rel="last"/);
        return match ? parseInt(match[1]) : 0;
    } else {
        return response.data.length;
    }
}

function getNextPageUrl(linkHeader: string | undefined): string | null {
    if (!linkHeader) return null;
    const links = linkHeader.split(', ');
    const nextLink = links.find(link => link.includes('rel="next"'));
    if (!nextLink) return null;
    const match = nextLink.match(/<(.+)>/);
    return match ? match[1] : null;
}

async function main() {
    try {
        const [openPRs, closedPRs, uniqueAuthors] = await getPRStats();
        const [stars, forks] = await getRepoStats();
        const contributors = await getContributorsCount();

        console.log(`Open PRs: ${openPRs}`);
        console.log(`Closed PRs: ${closedPRs}`);
        console.log(`Unique PR Authors: ${uniqueAuthors}`);
        console.log(`Stars: ${stars}`);
        console.log(`Forks: ${forks}`);
        console.log(`Contributors: ${contributors}`);

        // Note: "Used By" count is not directly available through the GitHub API
        console.log("Used By: Not available through GitHub API");
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

main();
