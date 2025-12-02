import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { siteConfig } from '../config/site';

export async function GET(context) {
  const blog = await getCollection('blog');
  
  // Sort by date, newest first
  const sortedPosts = blog.sort((a, b) => 
    new Date(b.data.pubDate).getTime() - new Date(a.data.pubDate).getTime()
  );
  
  return rss({
    title: `${siteConfig.siteName} - Blog`,
    description: 'Latest articles on software engineering, product management, and building thoughtful apps for hoomans.',
    site: context.site || siteConfig.siteUrl,
    items: sortedPosts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.slug}/`,
      author: `${post.data.author} (${siteConfig.email})`,
      categories: post.data.categories,
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