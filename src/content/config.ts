// Import utilities from `astro:content`
import { z, defineCollection } from 'astro:content';

// Define a `type` and `schema` for blog posts
const blogCollection = defineCollection({
  type: 'content', // v2.5.0 and later
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    author: z.string(),
    categories: z.array(z.string()),
    tags: z.array(z.string()).optional(),
    readTime: z.string().optional(),
    featuredImage: z.string().optional(),
    featured: z.boolean().default(false), // Added featured flag for promoting posts
    relatedProjects: z.union([z.array(z.string()), z.null()]).optional(), // Related project slugs or null if N/A
  }),
});

// Define a schema for project items
const projectCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    projectDate: z.date(),
    completed: z.boolean().default(true),
    technologies: z.array(z.string()),
    featured: z.boolean().default(false),
    projectImage: z.string().optional(),
    projectUrl: z.string().url().optional(),
    githubUrl: z.string().url().optional(),
    relatedBlogPosts: z.union([z.array(z.string()), z.null()]).optional(), // Related blog post slugs or null if N/A
  }),
});

// Define a schema for roadmap items
const roadmapCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    phase: z.enum(['current', 'upcoming', 'future']),
    status: z.enum(['now', 'next', 'later', 'exploring']),
    order: z.number(),
    features: z.array(z.string()).optional(),
    goals: z.array(z.string()).optional(),
    timeframe: z.string().optional(),
    relatedRoadmapItems: z.array(z.string()).optional(),
    completedItems: z.array(z.string()).default([]),
  }),
});

// Define a schema for author bio
const authorCollection = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    title: z.string(),
    email: z.string().email(),
    location: z.string(),
    avatar: z.string().optional(),
    shortBio: z.string(),
    longBio: z.string(),
    socialLinks: z.object({
      github: z.string().url().optional(),
      linkedin: z.string().url().optional(),
      twitter: z.string().url().optional(),
      bluesky: z.string().url().optional(),
      website: z.string().url().optional(),
    }),
    skills: z.array(z.string()).optional(),
    interests: z.array(z.string()).optional(),
  }),
});

// Define a schema for resume sections
const resumeCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    order: z.number(), // To control display order
    icon: z.string().optional(), // Icon name for the section
    visible: z.boolean().default(true), // Whether to display this section
  }),
});

// Define a schema for experience entries
const experienceCollection = defineCollection({
  type: 'content',
  schema: z.object({
    company: z.string(),
    position: z.string(),
    location: z.string(),
    startDate: z.date(),
    endDate: z.date().optional(), // Optional for current positions
    current: z.boolean().default(false),
    description: z.string(),
    achievements: z.array(z.string()),
    technologies: z.array(z.string()).optional(),
    order: z.number(), // To control display order
    visible: z.boolean().default(true),
  }),
});

// Define a schema for education entries
const educationCollection = defineCollection({
  type: 'content',
  schema: z.object({
    institution: z.string(),
    degree: z.string(),
    field: z.string(),
    location: z.string(),
    startDate: z.date(),
    endDate: z.date().optional(),
    current: z.boolean().default(false),
    description: z.string().optional(),
    achievements: z.array(z.string()).optional(),
    order: z.number(),
    visible: z.boolean().default(true),
  }),
});

// Define a schema for credential badges
const credentialCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(), // Name of the credential
    organization: z.string(), // Issuing organization
    issueDate: z.date(),
    expirationDate: z.date().optional().nullable(),
    description: z.string(),
    credentialId: z.string().optional(),
    credentialUrl: z.string().url().optional(),
    badgeImage: z.string(), // Path to badge image
    featured: z.boolean().default(false),
    skills: z.array(z.string()).optional(),
    category: z.string(), // Certification category
    visible: z.boolean().default(true),
  }),
});

// Define a schema for skills
const skillCollection = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    category: z.string(), // Technical, Soft, etc.
    level: z.number().min(1).max(5).optional(), // Skill level from 1-5
    yearsOfExperience: z.number().optional(),
    featured: z.boolean().default(false),
    icon: z.string().optional(),
    order: z.number(),
    visible: z.boolean().default(true),
  }),
});

// Define a schema for principles
const principleCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number(),
  }),
});

// Define a schema for Thoughtful App Co. concepts
const thoughtfulAppsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    oneLiner: z.string(),
    status: z.enum(['concept', 'exploring', 'prototyping', 'shelved']),
    category: z.string(),
    problem: z.string(),
    mainMockup: z.string().optional(), // TLDraw embed URL
    features: z.array(z.object({
      name: z.string(),
      what: z.string(),
      why: z.string(),
      mockup: z.string().optional(),
    })),
    userJourney: z.array(z.string()),
    technicalArchitecture: z.object({
      frontend: z.string(),
      backend: z.string(),
      data: z.string(),
      apis: z.array(z.string()),
      hosting: z.string(),
    }),
    moonshotFeatures: z.array(z.string()),
    marketResearch: z.object({
      similarTo: z.array(z.string()),
      differentBecause: z.string(),
      targetUsers: z.string(),
    }),
    openQuestions: z.array(z.string()),
    resources: z.array(z.object({
      title: z.string(),
      url: z.string().url(),
    })).optional(),
    githubUrl: z.string().url().optional(), // GitHub repository URL for prototyping apps
    lastUpdated: z.date(),
    feasibility: z.number().min(1).max(5),
    excitement: z.number().min(1).max(5),
    voteCount: z.number().default(0), // Will be updated dynamically
  }),
});

// Export a single `collections` object to register your collections
export const collections = {
  'blog': blogCollection,
  'projects': projectCollection,
  'roadmap': roadmapCollection,
  'authors': authorCollection,
  'resume': resumeCollection,
  'experience': experienceCollection,
  'education': educationCollection,
  'credentials': credentialCollection,
  'skills': skillCollection,
  'principles': principleCollection,
  'thoughtful-apps': thoughtfulAppsCollection,
};