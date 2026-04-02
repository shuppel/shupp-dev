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
    twitter: 'https://x.com/KimJungUzi',
    bluesky: 'https://bsky.app/profile/shupp.dev',
    instagram: 'https://instagram.com/erikkshupp',
  },

  // Business / ventures
  ventures: {
    thoughtfulAppCo: {
      name: 'Thoughtful App Co.',
      url: 'https://thoughtfulapp.co',
      email: 'launch@thoughtfulapp.co',
      tagline: 'Building apps for hoomans',
      youtube: 'https://www.youtube.com/@thoughtfulappco',
      tiktok: 'https://www.tiktok.com/@thoughtfulappco',
      github: 'https://github.com/thoughtful-app-co',
    },
    humansOnlyPodcast: {
      name: 'Humans Only',
      url: 'https://humansonly.fm',
      email: 'human@humansonly.fm',
      tagline: 'How emerging tech can better serve humanity',
      spotify: 'https://open.spotify.com/show/5795Q9GCmotmDpParHL1v6?si=6930bfe903dc4286',
      apple: 'https://podcasts.apple.com/us/podcast/humans-only',
      youtube: 'https://www.youtube.com/watch?v=yqPDuuMReKo&list=PLCnYURZ5KeTjo_ZcveQtWT5HFIBzgYYka&index=1',
    },
    booboTheSpinosaur: {
      name: 'Boobo the Spinosaur',
      youtube: 'https://www.youtube.com/playlist?list=PLCnYURZ5KeTixpbRBta_xmeHGj46WFuZI',
    },
  },

  // Default author
  author: {
    name: 'Erikk Shupp',
    title: 'Product Manager & Software Engineer',
    location: 'Arlington, Virginia',
  }
} as const;
