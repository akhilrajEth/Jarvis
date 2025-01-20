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
    name: "Omni AGI",
    category: "DeFi Agents",
    githubScore: 6,
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
    name: "SupplyVest",
    category: "DeFi Agents",
    githubScore: 5,
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
    name: "Solmate",
    category: "DeFi Agents",
    githubScore: 4,
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
    name: "Divinity Protocol",
    category: "DeFi Agents",
    githubScore: 3,
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
    name: "Memecoin.fun",
    category: "DeFi Agents",
    githubScore: 2,
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
