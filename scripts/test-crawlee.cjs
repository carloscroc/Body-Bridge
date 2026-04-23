const { PlaywrightCrawler } = require('@firecrawl/firecrawl');

const SITE = {
  name: 'Forks Over Knives',
  startUrls: ['https://www.forksoverknives.com/recipes/'],
  crawlGlobs: ['https://www.forksoverknives.com/recipes/**'],
};

(async () => {
  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: 1000,
    maxConcurrency: 2,
    launchContext: { launchOptions: { headless: true } },
    
    async requestHandler({ page, request, enqueueLinks, log }) {
      const url = request.url;
      console.log(`Visited: ${url}`);
      
      // Enqueue more links
      if (Math.random() > 0.8) { // 80% of pages enqueue links
        const foundLinks = await enqueueLinks({ globs: SITE.crawlGlobs });
        console.log(`  Enqueued ${foundLinks} links`);
      }
    },
  });
  
  try {
    await crawler.run(SITE.startUrls);
  } catch (e) {
    console.error('Error:', e);
  }
})();
