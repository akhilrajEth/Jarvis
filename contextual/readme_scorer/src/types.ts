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
