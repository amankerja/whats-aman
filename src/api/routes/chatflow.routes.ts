import { Router, Request, Response, NextFunction } from 'express';
import { chatFlowRepository } from '../../core/database/repositories/chatflow.repository';

export const chatFlowRouter = Router();

// GET /api/v1/chatflows - List all chat flows
chatFlowRouter.get('/', (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string | undefined;
  const flows = chatFlowRepository.findAllFlows(sessionId);
  res.json({ success: true, data: flows });
});

// POST /api/v1/chatflows - Create a new multi-step chat flow
chatFlowRouter.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, triggerKeyword, triggerType, steps, isActive, sessionId } = req.body;

    if (!name || !triggerKeyword || !Array.isArray(steps) || steps.length === 0) {
      res.status(400).json({
        success: false,
        message: 'name, triggerKeyword, and a non-empty steps array are required'
      });
      return;
    }

    const created = chatFlowRepository.createFlow({
      name,
      description,
      triggerKeyword,
      triggerType,
      steps,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      sessionId
    });

    res.status(201).json({
      success: true,
      message: 'Chatflow created successfully',
      data: created
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/chatflows/:id - Get chat flow details
chatFlowRouter.get('/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const flow = chatFlowRepository.findFlowById(id);

  if (!flow) {
    res.status(404).json({ success: false, message: 'Chatflow not found' });
    return;
  }

  res.json({ success: true, data: flow });
});

// PUT /api/v1/chatflows/:id - Update chat flow
chatFlowRouter.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { name, description, triggerKeyword, triggerType, steps, isActive, sessionId } = req.body;

    const updated = chatFlowRepository.updateFlow(id, {
      name,
      description,
      triggerKeyword,
      triggerType,
      steps,
      isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      sessionId
    });

    if (!updated) {
      res.status(404).json({ success: false, message: 'Chatflow not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Chatflow updated successfully',
      data: updated
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/chatflows/:id - Delete chat flow
chatFlowRouter.delete('/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const deleted = chatFlowRepository.deleteFlow(id);

  if (!deleted) {
    res.status(404).json({ success: false, message: 'Chatflow not found' });
    return;
  }

  res.json({ success: true, message: 'Chatflow deleted successfully' });
});

// GET /api/v1/chatflows/:id/sessions - Get user responses & sessions for flow
chatFlowRouter.get('/:id/sessions', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  const sessions = chatFlowRepository.findSessionsByFlow(id, limit);

  res.json({
    success: true,
    total: sessions.length,
    data: sessions
  });
});
