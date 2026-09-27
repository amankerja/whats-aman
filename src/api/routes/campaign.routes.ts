import { Router, Request, Response, NextFunction } from 'express';
import { campaignService } from '../../core/services/campaign.service';
import { campaignRepository } from '../../core/database/repositories/campaign.repository';

export const campaignRouter = Router();

// GET /api/v1/campaigns - List all campaigns
campaignRouter.get('/', (req: Request, res: Response) => {
  const { sessionId } = req.query;
  const campaigns = campaignRepository.findAllCampaigns(sessionId ? String(sessionId) : undefined);
  res.json({ success: true, data: campaigns });
});

// POST /api/v1/campaigns - Create campaign
campaignRouter.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      sessionId,
      name,
      templateText,
      mediaPath,
      mediaType,
      scheduleAt,
      rateLimitPerMin,
      randomDelayMin,
      randomDelayMax,
      recipients
    } = req.body;

    if (!sessionId || !name || !templateText) {
      res.status(400).json({ success: false, message: 'sessionId, name, and templateText are required' });
      return;
    }

    const campaignId = campaignService.createCampaign({
      sessionId,
      name,
      templateText,
      mediaPath,
      mediaType,
      scheduleAt,
      rateLimitPerMin,
      randomDelayMin,
      randomDelayMax,
      recipients: recipients || []
    });

    const created = campaignRepository.findCampaignById(campaignId);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/campaigns/:id - Get campaign details
campaignRouter.get('/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const campaign = campaignRepository.findCampaignById(id);
  if (!campaign) {
    res.status(404).json({ success: false, message: 'Campaign not found' });
    return;
  }
  res.json({ success: true, data: campaign });
});

// POST /api/v1/campaigns/:id/start - Start campaign runner
campaignRouter.post('/:id/start', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    await campaignService.startCampaign(id);
    res.json({ success: true, message: 'Campaign started' });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/campaigns/:id/pause - Pause campaign runner
campaignRouter.post('/:id/pause', (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    campaignService.pauseCampaign(id);
    res.json({ success: true, message: 'Campaign paused' });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/campaigns/:id/recipients - Get recipients list with statuses
campaignRouter.get('/:id/recipients', (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 100;
    const recipients = campaignService.getRecipients(id, limit);
    res.json({ success: true, data: recipients });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/campaigns/:id - Delete campaign
campaignRouter.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    campaignService.deleteCampaign(id);
    res.json({ success: true, message: 'Campaign deleted' });
  } catch (err) {
    next(err);
  }
});
