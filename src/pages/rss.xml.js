import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { siteConfig } from '../config/site';

export async function GET(context) {
  const galaxy = await getCollection('galaxy');
  
  // Sort by formed date, newest first
  const sortedPosts = galaxy.sort((a, b) => 
    new Date(b.data.formed).getTime() - new Date(a.data.formed).getTime()
  );
  
  return rss({
    title: `${siteConfig.siteName} - Galaxy`,
    description: 'A universe of interconnected ideas—celestial bodies of knowledge that form, evolve, and orbit together.',
    site: context.site || siteConfig.siteUrl,
    items: sortedPosts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.formed,
      description: post.data.description,
      link: `/galaxy/${post.id}/`,
      categories: [post.data.constellation],
    })),
    customData: `
      <language>en-us</language>
      <copyright>Copyright ${new Date().getFullYear()} ${siteConfig.author.name}</copyright>
      <webMaster>${siteConfig.email} (${siteConfig.author.name})</webMaster>
      <managingEditor>${siteConfig.email} (${siteConfig.author.name})</managingEditor>
      <generator>Astro RSS</generator>
      <docs>https://cyber.harvard.edu/rss/rss.html</docs>
      <ttl>60</ttl>
      <image>
        <url>${siteConfig.siteUrl}/og-default.png</url>
        <title>${siteConfig.siteName}</title>
        <link>${siteConfig.siteUrl}</link>
      </image>
    `,
    stylesheet: '/rss-styles.xsl',
  });
}
