export interface Commit {
  sha: string;
  message: string;
  author: {
    name: string;
    date: string;
  };
  stats: {
    additions: number;
    deletions: number;
    total: number;
  };
}

export interface AnalysisOutput {
  score: number; // 1-10
  reasoning: string;
  suggestions: string[];
}

export interface CommitBatch {
  commits: Commit[];
  totalCommits: number;
}
