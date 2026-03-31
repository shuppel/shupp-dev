// Site configuration
export const siteConfig = {
  // Contact information
  email: 'erikk@shupp.dev',

  // Site metadata
  siteName: 'shupp.dev',
  siteUrl: 'https://shupp.dev',
  tagline: 'building apps for hoomans',

  // Personal social links
  social: {
    github: 'https://github.com/shuppel',
    linkedin: 'https://www.linkedin.com/in/shupp-erikk/',
    twitter: 'https://twitter.com/erikkshupp',
    bluesky: 'https://bsky.app/profile/shupp.dev',
    instagram: 'https://instagram.com/erikkshupp',
  },

  // Business / ventures
  ventures: {
    thoughtfulAppCo: {
      name: 'Thoughtful App Co.',
      url: 'https://thoughtfulapp.co',
      tagline: 'Building apps for hoomans',
      twitter: 'https://twitter.com/thoughtfulappco',
      github: 'https://github.com/thoughtful-app-co',
    },
    humansOnlyPodcast: {
      name: 'Humans Only',
      url: 'https://humansonly.fm',
      tagline: 'How emerging tech can better serve humanity',
      spotify: 'https://open.spotify.com/show/5795Q9GCmotmDpParHL1v6?si=6930bfe903dc4286',
      apple: 'https://podcasts.apple.com/us/podcast/humans-only',
      youtube: 'https://youtube.com/@humansonlyfm',
    },
  },

  // Default author
  author: {
    name: 'Erikk Shupp',
    title: 'Product Manager & Software Engineer',
    location: 'Arlington, Virginia',
  }
} as const;
