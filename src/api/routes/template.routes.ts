import { Router, Request, Response, NextFunction } from 'express';
import { templateService } from '../../core/services/template.service';

export const templateRouter = Router();

// GET /api/v1/templates - List templates
templateRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.query.sessionId ? String(req.query.sessionId) : undefined;
    const templates = templateService.getTemplates(sessionId);
    res.json({ success: true, data: templates });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/templates - Create new template
templateRouter.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, name, category, content } = req.body;
    const created = templateService.createTemplate({
      sessionId,
      name,
      category,
      content
    });
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/templates/:id - Get template by ID
templateRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const template = templateService.getTemplateById(id);
    res.json({ success: true, data: template });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/templates/:id - Update template by ID
templateRouter.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { name, category, content, sessionId } = req.body;
    const updated = templateService.updateTemplate(id, {
      name,
      category,
      content,
      sessionId
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/templates/:id - Delete template by ID
templateRouter.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    templateService.deleteTemplate(id);
    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (err) {
    next(err);
  }
});
