import { Router, Request, Response, NextFunction } from 'express';
import { groupService } from '../../core/services/group.service';

export const groupRouter = Router();

// GET /api/v1/groups - List all groups for session with admin & auto-reply toggle state
groupRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) {
      res.status(400).json({ success: false, message: 'sessionId is required' });
      return;
    }

    const cached = groupService.getCachedGroups(String(sessionId));
    let groups: any[] = [];
    try {
      groups = await groupService.getGroups(String(sessionId));
    } catch (err: any) {
      // Fallback gracefully to cached groups from database if live socket is temporarily busy or reconnecting
      groups = cached.map(c => ({
        jid: c.jid,
        name: c.name,
        topic: c.topic,
        memberCount: c.memberCount,
        participants: []
      }));
    }

    // If live call returned empty but database has cached groups, use cache
    if ((!groups || groups.length === 0) && cached.length > 0) {
      groups = cached.map(c => ({
        jid: c.jid,
        name: c.name,
        topic: c.topic,
        memberCount: c.memberCount,
        participants: []
      }));
    }

    const enriched = groups.map((g) => {
      const dbGroup = cached.find((c) => c.jid === g.jid);
      return {
        ...g,
        isAdmin: dbGroup?.isAdmin ?? false,
        autoReplyEnabled: dbGroup?.autoReplyEnabled ?? false
      };
    });

    res.json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/groups/export-all - Export all groups to a single consolidated Excel file
groupRouter.get('/export-all', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) {
      res.status(400).json({ success: false, message: 'Silakan pilih sesi WhatsApp terlebih dahulu' });
      return;
    }
    const { buffer, totalGroups, totalMembers } = await groupService.exportAllGroupsToExcel(String(sessionId));
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="semua_grup_members_${sessionId}.xlsx"`);
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Gagal mengekspor seluruh grup' });
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
    const jid = decodeURIComponent(String(req.params.jid));
    const group = await groupService.getGroupMetadata(String(sessionId), jid);
    res.json({ success: true, data: group });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/groups/:jid/export - Export group members to Excel
groupRouter.get('/:jid/export', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) {
      res.status(400).json({ success: false, message: 'Silakan pilih sesi WhatsApp terlebih dahulu' });
      return;
    }
    const rawJid = String(req.params.jid || '');
    const jid = decodeURIComponent(rawJid);
    const { buffer, groupName, count } = await groupService.exportGroupMembersToExcel(String(sessionId), jid);
    const safeName = groupName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'group';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="group_${safeName}_members.xlsx"`);
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Gagal mengekspor anggota grup' });
  }
});

// POST /api/v1/groups/:jid/auto-reply - Enable or disable auto reply for specific group
groupRouter.post('/:jid/auto-reply', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, enabled } = req.body;
    if (!sessionId) {
      res.status(400).json({ success: false, message: 'sessionId is required' });
      return;
    }
    const jid = decodeURIComponent(String(req.params.jid));
    groupService.setGroupAutoReply(String(sessionId), jid, Boolean(enabled));
    res.json({
      success: true,
      message: `Auto-reply untuk grup ini berhasil ${enabled ? 'diaktifkan' : 'dinonaktifkan'}`
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/groups/:jid/import-to-contacts or /api/v1/groups/import-to-contacts
const handleGroupImportToContacts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.body;
    const jid = decodeURIComponent(String(req.params.jid || req.body.jid || ''));
    if (!sessionId || !jid) {
      res.status(400).json({ success: false, message: 'sessionId and jid are required' });
      return;
    }
    const result = await groupService.importGroupMembersToContacts(String(sessionId), jid);
    res.json({
      success: true,
      message: `Berhasil menyimpan ${result.count} nomor anggota grup "${result.groupName}" ke Kontak`,
      count: result.count
    });
  } catch (err) {
    next(err);
  }
};
groupRouter.post('/import-to-contacts', handleGroupImportToContacts);
groupRouter.post('/:jid/import-to-contacts', handleGroupImportToContacts);
