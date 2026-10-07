import { Router, Request, Response } from 'express';
import { CrawlerService } from '../services/crawler.service';

const router = Router();

router.post('/scan', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required to crawl' });
    }

    const result = await CrawlerService.crawlPage(url);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Crawl error: ' + err.message });
  }
});

export default router;
