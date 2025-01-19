export interface Project {
  id: string;
  name: string;
  category: string;
  githubScore: number;
  description: string;
  imagePath?: string;
  githubAnalysis: {
    readme: number;
    readmeDetails: string;
    commits: number;
    commitsDetails: string;
    prs: number;
  };
  metrics: string[];
}

export const projects: Project[] = [
  {
    id: "1",
    name: "The Hive",
    category: "DeFi Agents",
    githubScore: 7,
    description:
      "Lorem ipsum dolor sit amet. Est doloremque suscipit non mollitia dicta est explicabo dolor! In repudiandae dolores qui praesentium debitis ut corrupti enim sed.",
    imagePath: "/images/project-placeholder.svg",
    githubAnalysis: {
      readme: 9,
      readmeDetails: "Comprehensive content but lacks concise sections",
      commits: 5,
      commitsDetails: "Analyzed 20 sample commits out of 100 total commits",
      prs: 6,
    },
    metrics: ["25 Stars", "25 Forks", "25 Forks", "25 Forks"],
  },
  {
    id: "2",
    name: "The Hive",
    category: "DeFi Agents",
    githubScore: 7,
    description:
      "Lorem ipsum dolor sit amet. Est doloremque suscipit non mollitia dicta est explicabo dolor! In repudiandae dolores qui praesentium debitis ut corrupti enim sed.",
    imagePath: "/images/project-placeholder.svg",
    githubAnalysis: {
      readme: 9,
      readmeDetails: "Comprehensive content but lacks concise sections",
      commits: 5,
      commitsDetails: "Analyzed 20 sample commits out of 100 total commits",
      prs: 6,
    },
    metrics: ["25 Stars", "25 Forks", "25 Forks", "25 Forks"],
  },
  {
    id: "3",
    name: "The Hive",
    category: "DeFi Agents",
    githubScore: 7,
    description:
      "Lorem ipsum dolor sit amet. Est doloremque suscipit non mollitia dicta est explicabo dolor! In repudiandae dolores qui praesentium debitis ut corrupti enim sed.",
    imagePath: "/images/project-placeholder.svg",
    githubAnalysis: {
      readme: 9,
      readmeDetails: "Comprehensive content but lacks concise sections",
      commits: 5,
      commitsDetails: "Analyzed 20 sample commits out of 100 total commits",
      prs: 6,
    },
    metrics: ["25 Stars", "25 Forks", "25 Forks", "25 Forks"],
  },
  {
    id: "4",
    name: "The Hive",
    category: "DeFi Agents",
    githubScore: 7,
    description:
      "Lorem ipsum dolor sit amet. Est doloremque suscipit non mollitia dicta est explicabo dolor! In repudiandae dolores qui praesentium debitis ut corrupti enim sed.",
    imagePath: "/images/project-placeholder.svg",
    githubAnalysis: {
      readme: 9,
      readmeDetails: "Comprehensive content but lacks concise sections",
      commits: 5,
      commitsDetails: "Analyzed 20 sample commits out of 100 total commits",
      prs: 6,
    },
    metrics: ["25 Stars", "25 Forks", "25 Forks", "25 Forks"],
  },
  {
    id: "5",
    name: "The Hive",
    category: "DeFi Agents",
    githubScore: 7,
    description:
      "Lorem ipsum dolor sit amet. Est doloremque suscipit non mollitia dicta est explicabo dolor! In repudiandae dolores qui praesentium debitis ut corrupti enim sed.",
    imagePath: "/images/project-placeholder.svg",
    githubAnalysis: {
      readme: 9,
      readmeDetails: "Comprehensive content but lacks concise sections",
      commits: 5,
      commitsDetails: "Analyzed 20 sample commits out of 100 total commits",
      prs: 6,
    },
    metrics: ["25 Stars", "25 Forks", "25 Forks", "25 Forks"],
  },
  {
    id: "6",
    name: "The Hive",
    category: "DeFi Agents",
    githubScore: 7,
    description:
      "Lorem ipsum dolor sit amet. Est doloremque suscipit non mollitia dicta est explicabo dolor! In repudiandae dolores qui praesentium debitis ut corrupti enim sed.",
    imagePath: "/images/project-placeholder.svg",
    githubAnalysis: {
      readme: 9,
      readmeDetails: "Comprehensive content but lacks concise sections",
      commits: 5,
      commitsDetails: "Analyzed 20 sample commits out of 100 total commits",
      prs: 6,
    },
    metrics: ["25 Stars", "25 Forks", "25 Forks", "25 Forks"],
  },
];
