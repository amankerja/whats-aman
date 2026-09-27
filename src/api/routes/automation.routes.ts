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

// DELETE /api/v1/automation/:id - Delete rule
automationRouter.delete('/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  automationRepository.delete(id);
  res.json({ success: true, message: 'Automation rule deleted' });
});
