import { Router, Request, Response, NextFunction } from 'express';
import { crmService } from '../../core/services/crm.service';

export const crmRouter = Router();

// GET /api/v1/crm/tasks - List follow-up tasks
crmRouter.get('/tasks', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, status, phone, limit, offset } = req.query;
    if (!sessionId) {
      res.status(400).json({ success: false, message: 'sessionId is required' });
      return;
    }
    const result = crmService.getTasks(String(sessionId), {
      status: status ? String(status) : undefined,
      phone: phone ? String(phone) : undefined,
      limit: limit ? parseInt(String(limit), 10) : 100,
      offset: offset ? parseInt(String(offset), 10) : 0
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/crm/tasks - Create follow-up task
crmRouter.post('/tasks', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, contactPhone, contactName, title, messageTemplate, dueAt, sequenceId, stepNumber, notes } = req.body;
    if (!sessionId || !contactPhone || !title || !messageTemplate || !dueAt) {
      res.status(400).json({
        success: false,
        message: 'sessionId, contactPhone, title, messageTemplate, and dueAt are required'
      });
      return;
    }

    const task = crmService.createTask({
      sessionId,
      contactPhone,
      contactName,
      title,
      messageTemplate,
      dueAt: Number(dueAt),
      sequenceId,
      stepNumber: stepNumber ? Number(stepNumber) : 1,
      notes
    });

    res.json({ success: true, message: 'Follow-up task created', data: task });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/crm/tasks/:id/execute - 1-Click execute follow-up task
crmRouter.post('/tasks/:id/execute', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id || '');
    const result = await crmService.executeTask(taskId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/crm/tasks/:id/cancel - Cancel task
crmRouter.post('/tasks/:id/cancel', (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id || '');
    const { reason } = req.body;
    crmService.cancelTask(taskId, reason);
    res.json({ success: true, message: 'Task cancelled' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/crm/tasks/:id - Delete task
crmRouter.delete('/tasks/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id || '');
    crmService.deleteTask(taskId);
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/crm/sequences - List sequences
crmRouter.get('/sequences', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) {
      res.status(400).json({ success: false, message: 'sessionId is required' });
      return;
    }
    const sequences = crmService.getSequences(String(sessionId));
    res.json({ success: true, data: sequences });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/crm/sequences - Create or update sequence
crmRouter.post('/sequences', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, id, name, description, steps } = req.body;
    if (!sessionId || !name || !Array.isArray(steps) || steps.length === 0) {
      res.status(400).json({
        success: false,
        message: 'sessionId, name, and steps array are required'
      });
      return;
    }

    const seq = crmService.createSequence({
      sessionId,
      id,
      name,
      description,
      steps
    });

    res.json({ success: true, message: 'Sequence saved', data: seq });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/crm/sequences/:id - Delete sequence
crmRouter.delete('/sequences/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const seqId = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id || '');
    crmService.deleteSequence(seqId);
    res.json({ success: true, message: 'Sequence deleted' });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/crm/sequences/apply - Apply sequence to contact
crmRouter.post('/sequences/apply', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, phone, sequenceId, contactName } = req.body;
    if (!sessionId || !phone || !sequenceId) {
      res.status(400).json({
        success: false,
        message: 'sessionId, phone, and sequenceId are required'
      });
      return;
    }

    const task = crmService.applySequenceToContact(sessionId, phone, sequenceId, contactName);
    res.json({
      success: true,
      message: 'Sequence applied to contact. Step 1 follow-up scheduled.',
      data: task
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/crm/analytics - Sales CRM Funnel Analytics
crmRouter.get('/analytics', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, range } = req.query;
    if (!sessionId) {
      res.status(400).json({ success: false, message: 'sessionId is required' });
      return;
    }

    const timeRange = (range as any) || '7d';
    const analytics = crmService.getSalesAnalytics(String(sessionId), timeRange);
    res.json({ success: true, data: analytics });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/crm/export-csv - Export CRM & Follow-up report as CSV
crmRouter.get('/export-csv', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) {
      res.status(400).json({ success: false, message: 'sessionId is required' });
      return;
    }

    const csvContent = crmService.exportReportCSV(String(sessionId));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="crm_report_${sessionId}.csv"`);
    res.send(csvContent);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/crm/auto-dispatch - Get auto-dispatch status
crmRouter.get('/auto-dispatch', (req: Request, res: Response) => {
  res.json({ success: true, enabled: crmService.isAutoDispatchActive() });
});

// POST /api/v1/crm/auto-dispatch - Toggle auto-dispatch
crmRouter.post('/auto-dispatch', (req: Request, res: Response) => {
  const { enabled } = req.body;
  crmService.setAutoDispatch(Boolean(enabled));
  res.json({ success: true, enabled: crmService.isAutoDispatchActive() });
});
