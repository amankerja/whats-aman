import { Router, Request, Response, NextFunction } from 'express';
import { groupService } from '../../core/services/group.service';

export const groupRouter = Router();

// GET /api/v1/groups - List all groups for session
groupRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) {
      res.status(400).json({ success: false, message: 'sessionId is required' });
      return;
    }
    const groups = await groupService.getGroups(String(sessionId));
    res.json({ success: true, data: groups });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/groups/:jid - Get group details and participants
groupRouter.get('/:jid', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) {
      res.status(400).json({ success: false, message: 'sessionId is required' });
      return;
    }
    const jid = String(req.params.jid);
    const group = await groupService.getGroupMetadata(String(sessionId), jid);
    res.json({ success: true, data: group });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/groups/:jid/export - Export group members to Excel
groupRouter.get('/:jid/export', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) {
      res.status(400).json({ success: false, message: 'sessionId is required' });
      return;
    }
    const jid = String(req.params.jid);
    const { buffer, groupName } = await groupService.exportGroupMembersToExcel(String(sessionId), jid);
    const safeName = groupName.replace(/[^a-zA-Z0-9_-]/g, '_');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="group_${safeName}_members.xlsx"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});
