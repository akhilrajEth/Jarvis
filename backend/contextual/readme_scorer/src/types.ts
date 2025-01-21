export interface GitHubAPIResponse {
  content: string;
  encoding: string;
  name: string;
}

export interface ReadmeEvaluation {
  score: number;
  reasoning: string;
  suggestions: string[];
}

export interface ApiError extends Error {
  status?: number;
  response?: {
    status: number;
    data: any;
  };
}

export interface RetryConfig {
  maxRetries: number;
  delay: number;
}

interface GithubAnalysis {
  readme_score: ReadmeEvaluation | null;
  [key: string]: any;
}

export interface Project {
  id: number;
  github_slug: string;
  project_category: string;
  project_name: string;
  github_analysis: GithubAnalysis;
}
