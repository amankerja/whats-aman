import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { campaignService } from '../../core/services/campaign.service';
import { campaignRepository } from '../../core/database/repositories/campaign.repository';
import { AuditService } from '../../core/services/audit.service';

const upload = multer({ storage: multer.memoryStorage() });
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
      isRecurring,
      cronExpression,
      maxRuns,
      recipients,
      settings
    } = req.body;

    if (!sessionId || !name || !templateText) {
      res.status(400).json({ success: false, message: 'sessionId, name, and templateText are required' });
      return;
    }

    const delayMin = randomDelayMin ?? settings?.randomDelayMinSeconds ?? settings?.randomDelayMin;
    const delayMax = randomDelayMax ?? settings?.randomDelayMaxSeconds ?? settings?.randomDelayMax;

    const campaignId = campaignService.createCampaign({
      sessionId,
      name,
      templateText,
      mediaPath,
      mediaType,
      scheduleAt,
      rateLimitPerMin,
      randomDelayMin: delayMin,
      randomDelayMax: delayMax,
      isRecurring: Boolean(isRecurring),
      cronExpression,
      maxRuns: maxRuns ? Number(maxRuns) : undefined,
      recipients: recipients || []
    });

    const created = campaignRepository.findCampaignById(campaignId);
    AuditService.log('user', 'create', 'campaign', { campaignId, name, recipients: (recipients || []).length });
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/campaigns/quick-csv - Create campaign directly from CSV/Excel and auto-start
campaignRouter.post('/quick-csv', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      sessionId,
      name,
      templateText,
      mediaPath,
      mediaType,
      randomDelayMin,
      randomDelayMax,
      autoStart
    } = req.body;

    if (!sessionId || !templateText) {
      res.status(400).json({ success: false, message: 'sessionId and templateText are required' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ success: false, message: 'File CSV/Excel is required' });
      return;
    }

    const recipients = campaignService.parseRecipientsFromBuffer(req.file.buffer, req.file.originalname);
    if (recipients.length === 0) {
      res.status(400).json({ success: false, message: 'No valid phone numbers found in file' });
      return;
    }

    const campaignName = name || `Broadcast CSV ${new Date().toLocaleDateString('id-ID')} (${recipients.length})`;
    const { isRecurring, cronExpression, maxRuns } = req.body;

    const campaignId = campaignService.createCampaign({
      sessionId,
      name: campaignName,
      templateText,
      mediaPath,
      mediaType,
      randomDelayMin: randomDelayMin ? parseInt(String(randomDelayMin), 10) : 5,
      randomDelayMax: randomDelayMax ? parseInt(String(randomDelayMax), 10) : 15,
      isRecurring: isRecurring === 'true' || isRecurring === true,
      cronExpression,
      maxRuns: maxRuns ? parseInt(String(maxRuns), 10) : undefined,
      recipients
    });

    const shouldAutoStart = autoStart !== 'false' && autoStart !== false;
    if (shouldAutoStart) {
      await campaignService.startCampaign(campaignId);
    }

    const created = campaignRepository.findCampaignById(campaignId);
    res.status(201).json({
      success: true,
      message: shouldAutoStart ? 'Campaign created and started' : 'Campaign created',
      data: {
        campaignId,
        totalRecipients: recipients.length,
        status: created?.status
      }
    });
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
    AuditService.log('user', 'start', 'campaign', { campaignId: id });
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
    AuditService.log('user', 'delete', 'campaign', { campaignId: id });
    res.json({ success: true, message: 'Campaign deleted' });
  } catch (err) {
    next(err);
  }
});
