import { Router, Request, Response, NextFunction } from 'express';
import { automationRepository } from '../../core/database/repositories/automation.repository';

export const automationRouter = Router();

// GET /api/v1/automation - List all automation rules
automationRouter.get('/', (req: Request, res: Response) => {
  const rules = automationRepository.findAll();
  res.json({ success: true, data: rules });
});

// POST /api/v1/automation - Create or update automation rule
automationRouter.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, sessionId, name, conditions, actions, isActive } = req.body;
    if (!name || !conditions || !actions) {
      res.status(400).json({ success: false, message: 'name, conditions, and actions are required' });
      return;
    }

    const ruleId = id || `rule_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    automationRepository.upsert({
      id: ruleId,
      sessionId,
      name,
      conditions,
      actions,
      isActive
    });

    res.json({ success: true, message: 'Automation rule saved', id: ruleId });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/automation/:id - Edit automation rule
automationRouter.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { sessionId, name, conditions, actions, isActive } = req.body;
    const rule = automationRepository.findAll().find((r) => r.id === id);
    if (!rule) {
      res.status(404).json({ success: false, message: 'Rule not found' });
      return;
    }

    automationRepository.upsert({
      id,
      sessionId: sessionId !== undefined ? sessionId : rule.session_id,
      name: name || rule.name,
      conditions: conditions || rule.conditions,
      actions: actions || rule.actions,
      isActive: isActive !== undefined ? isActive : rule.is_active
    });

    res.json({ success: true, message: 'Automation rule updated', id });
  } catch (err) {
    next(err);
  }
});

// Toggle rule active status (supports both PUT and PATCH)
const handleToggle = (req: Request, res: Response) => {
  const id = String(req.params.id);
  const rule = automationRepository.findAll().find((r) => r.id === id);
  if (!rule) {
    res.status(404).json({ success: false, message: 'Rule not found' });
    return;
  }
  const nextState = req.body && typeof req.body.isActive === 'boolean' ? req.body.isActive : !rule.is_active;
  automationRepository.upsert({
    id: rule.id,
    sessionId: rule.session_id,
    name: rule.name,
    conditions: rule.conditions,
    actions: rule.actions,
    isActive: nextState
  });
  res.json({
    success: true,
    message: `Rule ${nextState ? 'diaktifkan' : 'dinonaktifkan'}`,
    isActive: nextState
  });
};

automationRouter.put('/:id/toggle', handleToggle);
automationRouter.patch('/:id/toggle', handleToggle);

// GET /api/v1/automation/config - Get auto-reply config (business hours, cooldown, fallback)
automationRouter.get('/config', (req: Request, res: Response) => {
  const sessionId = req.query.sessionId ? String(req.query.sessionId) : undefined;
  const config = automationRepository.getAutoReplyConfig(sessionId);
  res.json({ success: true, data: config });
});

// POST /api/v1/automation/config - Save auto-reply config
automationRouter.post('/config', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, config } = req.body;
    if (!config) {
      res.status(400).json({ success: false, message: 'config object is required' });
      return;
    }
    automationRepository.saveAutoReplyConfig(config, sessionId ? String(sessionId) : undefined);
    res.json({ success: true, message: 'Auto-reply configuration saved successfully' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/automation/:id - Delete rule
automationRouter.delete('/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  automationRepository.delete(id);
  res.json({ success: true, message: 'Automation rule deleted' });
});
