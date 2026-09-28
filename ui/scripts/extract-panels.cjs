/**
 * Refactor step 2: extract per-tab JSX bodies from App.tsx into panels/*.tsx
 * and rewire App.tsx to render them via React.lazy + Suspense.
 *
 * Single source of truth: CTX_FIELDS drives the PanelCtx interface (ctx.ts),
 * the per-panel destructuring, and the panelCtx object inserted into AppShell.
 *
 * Idempotence guard: aborts if src/panels already exists.
 * App.tsx is only written at the very end (after all extraction checks pass).
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src', 'App.tsx');
const PANELS_DIR = path.join(__dirname, '..', 'src', 'panels');

if (fs.existsSync(PANELS_DIR)) {
  console.error('src/panels already exists — extraction appears done. Aborting.');
  process.exit(1);
}

const TABS = [
  'dashboard', 'sessions', 'chats', 'crm', 'contacts', 'groups',
  'campaigns', 'tester', 'automation', 'integrations', 'infrastructure', 'logs'
];
const PANEL_NAMES = {
  dashboard: 'DashboardPanel', sessions: 'SessionsPanel', chats: 'ChatsPanel',
  crm: 'CrmPanel', contacts: 'ContactsPanel', groups: 'GroupsPanel',
  campaigns: 'CampaignsPanel', tester: 'TesterPanel', automation: 'AutomationPanel',
  integrations: 'IntegrationsPanel', infrastructure: 'InfrastructurePanel', logs: 'LogsPanel'
};

// ---------------------------------------------------------------------------
// CTX_FIELDS: [name, type]. Drives ctx.ts interface, panel destructuring and
// the panelCtx object literal. Names must exist verbatim in AppShell scope.
// ---------------------------------------------------------------------------
const CTX_FIELDS = [
  ['t', 'any'],
  ['lang', 'Language'],
  ['showToast', '(message: string, type?: ToastType) => void'],
  ['appConfirm', '(message: string, options?: { confirmLabel?: string; cancelLabel?: string; danger?: boolean }) => Promise<boolean>'],
  ['previewTemplate', '(template: string, sampleName?: string) => string'],
  ['addLog', "(text: string, type?: 'info' | 'success' | 'warn') => void"],
  ['messagesEndRef', 'React.RefObject<HTMLDivElement | null>'],
  ['liveLogs', "Array<{ id: string; time: string; text: string; type: 'info' | 'success' | 'warn' }>"],

  ['sessions', 'SessionMeta[]'],
  ['selectedSessionId', 'string'],
  ['setSelectedSessionId', '(v: string) => void'],
  ['campaigns', 'Campaign[]'],
  ['contacts', 'Contact[]'],
  ['setContacts', 'React.Dispatch<React.SetStateAction<Contact[]>>'],
  ['groups', 'Group[]'],
  ['rules', 'AutoRule[]'],
  ['activeSession', 'SessionMeta | null'],
  ['isGlobalConnected', 'boolean'],
  ['setActiveTab', '(tab: TabKey) => void'],

  ['fetchSessions', '() => Promise<void>'],
  ['fetchSystemStatus', '() => Promise<void>'],
  ['fetchCampaigns', '() => Promise<void>'],
  ['fetchContacts', '(sessionId: string) => Promise<void>'],
  ['fetchGroups', '(sessionId: string) => Promise<void>'],
  ['fetchChats', '(sessionId: string) => Promise<void>'],
  ['fetchChatMessages', '(sessionId: string, chatJid: string) => Promise<void>'],
  ['fetchTags', '(sessionId: string) => Promise<void>'],
  ['fetchCRMTasks', '(sessionId: string) => Promise<void>'],
  ['fetchCRMSequences', '(sessionId: string) => Promise<void>'],
  ['fetchSalesAnalytics', "(sessionId: string, range?: 'today' | '7d' | '30d' | '90d' | 'all') => Promise<void>"],
  ['fetchAuditLogs', '() => Promise<void>'],
  ['fetchBackups', '() => Promise<void>'],
  ['fetchIntegrationLogs', '() => Promise<void>'],

  // Chats page
  ['chats', 'ChatItem[]'],
  ['setChats', 'React.Dispatch<React.SetStateAction<ChatItem[]>>'],
  ['activeChatJid', 'string | null'],
  ['setActiveChatJid', '(v: string | null) => void'],
  ['chatMessages', 'ChatMessage[]'],
  ['setChatMessages', 'React.Dispatch<React.SetStateAction<ChatMessage[]>>'],
  ['chatSearchQuery', 'string'],
  ['setChatSearchQuery', '(v: string) => void'],
  ['chatsSidebarTab', "'chats' | 'contacts' | 'groups' | 'channels'"],
  ['setChatsSidebarTab', "(v: 'chats' | 'contacts' | 'groups' | 'channels') => void"],
  ['chatFilter', "'all' | 'personal' | 'groups' | 'channels' | 'unread'"],
  ['setChatFilter', "(v: 'all' | 'personal' | 'groups' | 'channels' | 'unread') => void"],
  ['chatReplyText', 'string'],
  ['setChatReplyText', '(v: string) => void'],
  ['isNewChatModal', 'boolean'],
  ['setIsNewChatModal', '(v: boolean) => void'],
  ['newChatPhone', 'string'],
  ['setNewChatPhone', '(v: string) => void'],
  ['isRefreshingChats', 'boolean'],
  ['refreshSuccess', 'boolean'],
  ['isRefreshingThread', 'boolean'],
  ['setIsRefreshingThread', '(v: boolean) => void'],
  ['isSendMediaModal', 'boolean'],
  ['setIsSendMediaModal', '(v: boolean) => void'],
  ['chatMediaFile', 'File | null'],
  ['setChatMediaFile', '(v: File | null) => void'],
  ['chatMediaCaption', 'string'],
  ['setChatMediaCaption', '(v: string) => void'],
  ['unreadChatsCount', 'number'],
  ['contactsMap', 'Map<string, Contact>'],
  ['groupsMap', 'Map<string, Group>'],
  ['filteredChats', 'ChatItem[]'],
  ['filteredContacts', 'Contact[]'],
  ['filteredGroups', 'Group[]'],
  ['filteredChannels', 'ChatItem[]'],
  ['findContact', '(phoneOrJid?: string | null) => Contact | null'],
  ['handleManualRefreshChats', '() => Promise<void>'],
  ['handleRefreshActiveThread', '() => Promise<void>'],
  ['handleSendChatMessage', '(textOverride?: string) => Promise<void>'],
  ['handleSendChatMedia', '() => Promise<void>'],
  ['handleStartNewChat', '() => void'],
  ['botConfig', 'AutoReplyConfig'],
  ['setBotConfig', 'React.Dispatch<React.SetStateAction<AutoReplyConfig>>'],
  ['handleToggleAutoReplyGlobal', '(enabled: boolean) => Promise<void>'],
  ['setIsChatAutoReplyModal', '(v: boolean) => void'],
  ['setIsChatBroadcastModal', '(v: boolean) => void'],

  // Sessions page
  ['sessionSearchQuery', 'string'],
  ['setSessionSearchQuery', '(v: string) => void'],
  ['sessionStatusFilter', 'string'],
  ['setSessionStatusFilter', '(v: string) => void'],
  ['copiedPairingCode', 'boolean'],
  ['setCopiedPairingCode', '(v: boolean) => void'],
  ['abHealth', 'Record<string, { stats: any; events: any[] }>'],
  ['abResetting', 'string | null'],
  ['handleResetCircuitBreaker', '(sessionId: string) => Promise<void>'],
  ['handleDisconnectSession', '(id: string) => Promise<void>'],
  ['handleLogoutSession', '(id: string) => Promise<void>'],
  ['handleDeleteSession', '(id: string) => Promise<void>'],
  ['handleConnectSessionDirect', '(id: string) => Promise<void>'],
  ['activeQrModal', '{ open: boolean; session: SessionMeta | null }'],
  ['setActiveQrModal', '(v: { open: boolean; session: SessionMeta | null }) => void'],
  ['connectOptionModal', "{ open: boolean; sessionId: string; method: 'qr' | 'pairing'; phone: string }"],
  ['setConnectOptionModal', "(v: { open: boolean; sessionId: string; method: 'qr' | 'pairing'; phone: string }) => void"],

  // CRM page
  ['crmStageFilter', "'ALL' | 'lead' | 'prospect' | 'customer' | 'churned'"],
  ['setCrmStageFilter', "(v: 'ALL' | 'lead' | 'prospect' | 'customer' | 'churned') => void"],
  ['crmSearchQuery', 'string'],
  ['setCrmSearchQuery', '(v: string) => void'],
  ['crmTasks', 'FollowUpTask[]'],
  ['crmTaskFilter', "'ALL' | 'PENDING' | 'COMPLETED' | 'CANCELLED'"],
  ['setCrmTaskFilter', "(v: 'ALL' | 'PENDING' | 'COMPLETED' | 'CANCELLED') => void"],
  ['crmSequences', 'Sequence[]'],
  ['crmAnalytics', 'SalesAnalytics | null'],
  ['crmTimeRange', "'today' | '7d' | '30d' | '90d' | 'all'"],
  ['setCrmTimeRange', "(v: 'today' | '7d' | '30d' | '90d' | 'all') => void"],
  ['crmAutoDispatch', 'boolean'],
  ['handleToggleCrmAutoDispatch', '() => Promise<void>'],
  ['isNewTaskModal', 'boolean'],
  ['setIsNewTaskModal', '(v: boolean) => void'],
  ['newTaskPhone', 'string'],
  ['setNewTaskPhone', '(v: string) => void'],
  ['newTaskName', 'string'],
  ['setNewTaskName', '(v: string) => void'],
  ['newTaskTitle', 'string'],
  ['setNewTaskTitle', '(v: string) => void'],
  ['newTaskTemplate', 'string'],
  ['setNewTaskTemplate', '(v: string) => void'],
  ['newTaskDueHours', 'number'],
  ['setNewTaskDueHours', '(v: number) => void'],
  ['handleCreateFollowUpTask', '() => Promise<void>'],
  ['handleExecuteFollowUp', '(taskId: string) => Promise<void>'],
  ['handleCancelFollowUp', '(taskId: string) => Promise<void>'],
  ['handleDeleteFollowUp', '(taskId: string) => Promise<void>'],
  ['isApplySeqModal', 'boolean'],
  ['setIsApplySeqModal', '(v: boolean) => void'],
  ['applySeqContact', 'Contact | null'],
  ['setApplySeqContact', '(v: Contact | null) => void'],
  ['selectedSeqId', 'string'],
  ['setSelectedSeqId', '(v: string) => void'],
  ['handleApplySequence', '() => Promise<void>'],
  ['isNotesModal', 'boolean'],
  ['setIsNotesModal', '(v: boolean) => void'],
  ['selectedContactForNotes', 'Contact | null'],
  ['setSelectedContactForNotes', '(v: Contact | null) => void'],
  ['contactNotesText', 'string'],
  ['setContactNotesText', '(v: string) => void'],
  ['handleSaveContactNotes', '() => Promise<void>'],

  // Contacts page
  ['contactSearchQuery', 'string'],
  ['setContactSearchQuery', '(v: string) => void'],
  ['availableTags', 'Array<{ tag: string; count: number }>'],
  ['selectedTagFilter', 'string'],
  ['setSelectedTagFilter', '(v: string) => void'],
  ['isAddContactModal', 'boolean'],
  ['setIsAddContactModal', '(v: boolean) => void'],
  ['newContactPhone', 'string'],
  ['setNewContactPhone', '(v: string) => void'],
  ['newContactName', 'string'],
  ['setNewContactName', '(v: string) => void'],
  ['newContactTags', 'string'],
  ['setNewContactTags', '(v: string) => void'],
  ['handleAddContact', '() => Promise<void>'],
  ['isEditContactTagsModal', 'boolean'],
  ['setIsEditContactTagsModal', '(v: boolean) => void'],
  ['editingContactPhone', 'string'],
  ['editingContactName', 'string'],
  ['editingContactTags', 'string'],
  ['setEditingContactTags', '(v: string) => void'],
  ['setEditingContactPhone', '(v: string) => void'],
  ['setEditingContactName', '(v: string) => void'],
  ['setIsAddSessionModal', '(v: boolean) => void'],
  ['setChatBroadcastSessionId', '(v: string) => void'],
  ['fetchIntegrationConfigs', '() => Promise<void>'],
  ['fetchOutgoingWebhooks', '() => Promise<void>'],
  ['setEditRuleId', '(v: string) => void'],
  ['openEditTagsModal', '(contact: Contact) => void'],
  ['handleSaveContactTags', '() => Promise<void>'],
  ['handleToggleOptOut', '(phone: string, currentStatus: boolean) => Promise<void>'],
  ['handleDeleteContact', '(phone: string) => Promise<void>'],
  ['handleImportGroupToContacts', '(jid: string) => Promise<void>'],
  ['handleUpdateContactStage', "(phone: string, stage: 'lead' | 'prospect' | 'customer' | 'churned') => Promise<void>"],
  ['handleOpenChatWithContact', '(phone: string, name?: string) => void'],

  // Campaigns page
  ['isNewCampaignModal', 'boolean'],
  ['setIsNewCampaignModal', '(v: boolean) => void'],
  ['campName', 'string'],
  ['setCampName', '(v: string) => void'],
  ['campAudienceMode', "'group' | 'manual'"],
  ['setCampAudienceMode', "(v: 'group' | 'manual') => void"],
  ['campSelectedTag', 'string'],
  ['setCampSelectedTag', '(v: string) => void'],
  ['campTemplate', 'string'],
  ['setCampTemplate', '(v: string) => void'],
  ['campRecipientsRaw', 'string'],
  ['setCampRecipientsRaw', '(v: string) => void'],
  ['campRandomDelayMin', 'number'],
  ['setCampRandomDelayMin', '(v: number) => void'],
  ['campRandomDelayMax', 'number'],
  ['setCampRandomDelayMax', '(v: number) => void'],
  ['messageTemplates', 'Array<{ id: string; name: string; category: string; content: string }>'],
  ['handleCreateCampaign', '() => Promise<void>'],
  ['handleStartCampaign', '(id: string) => Promise<void>'],
  ['handlePauseCampaign', '(id: string) => Promise<void>'],
  ['handleDeleteCampaign', '(id: string) => Promise<void>'],
  ['isViewRecipientsModal', 'boolean'],
  ['setIsViewRecipientsModal', '(v: boolean) => void'],
  ['viewRecipientsList', 'any[]'],
  ['viewCampaignTitle', 'string'],
  ['handleViewRecipients', '(id: string, title: string) => Promise<void>'],
  ['handleFillRecipientsFromGroup', '() => Promise<void>'],

  // Automation page
  ['isNewRuleModal', 'boolean'],
  ['setIsNewRuleModal', '(v: boolean) => void'],
  ['ruleName', 'string'],
  ['setRuleName', '(v: string) => void'],
  ['ruleTriggerText', 'string'],
  ['setRuleTriggerText', '(v: string) => void'],
  ['ruleOperator', "'contains' | 'equals' | 'starts_with' | 'regex'"],
  ['setRuleOperator', "(v: 'contains' | 'equals' | 'starts_with' | 'regex') => void"],
  ['ruleReplyText', 'string'],
  ['setRuleReplyText', '(v: string) => void'],
  ['ruleAddTagEnabled', 'boolean'],
  ['setRuleAddTagEnabled', '(v: boolean) => void'],
  ['ruleActionTag', 'string'],
  ['setRuleActionTag', '(v: string) => void'],
  ['ruleSetStageEnabled', 'boolean'],
  ['setRuleSetStageEnabled', '(v: boolean) => void'],
  ['ruleActionStage', "'lead' | 'prospect' | 'customer' | 'churned'"],
  ['setRuleActionStage', "(v: 'lead' | 'prospect' | 'customer' | 'churned') => void"],
  ['isEditRuleModal', 'boolean'],
  ['setIsEditRuleModal', '(v: boolean) => void'],
  ['editRuleId', 'string'],
  ['editRuleName', 'string'],
  ['setEditRuleName', '(v: string) => void'],
  ['editRuleTriggerText', 'string'],
  ['setEditRuleTriggerText', '(v: string) => void'],
  ['editRuleOperator', "'contains' | 'equals' | 'starts_with' | 'regex'"],
  ['setEditRuleOperator', "(v: 'contains' | 'equals' | 'starts_with' | 'regex') => void"],
  ['editRuleReplyText', 'string'],
  ['setEditRuleReplyText', '(v: string) => void'],
  ['editRuleAddTagEnabled', 'boolean'],
  ['setEditRuleAddTagEnabled', '(v: boolean) => void'],
  ['editRuleActionTag', 'string'],
  ['setEditRuleActionTag', '(v: string) => void'],
  ['editRuleSetStageEnabled', 'boolean'],
  ['setEditRuleSetStageEnabled', '(v: boolean) => void'],
  ['editRuleActionStage', "'lead' | 'prospect' | 'customer' | 'churned'"],
  ['setEditRuleActionStage', "(v: 'lead' | 'prospect' | 'customer' | 'churned') => void"],
  ['simTestInput', 'string'],
  ['setSimTestInput', '(v: string) => void'],
  ['simMatchedRule', 'AutoRule | null'],
  ['simEvaluatedReply', 'string'],
  ['handleToggleRule', '(id: string, currentActive: boolean) => Promise<void>'],
  ['handleCreateRule', '() => Promise<void>'],
  ['handleSaveEditRule', '() => Promise<void>'],
  ['handleDeleteRule', '(id: string) => Promise<void>'],
  ['handleSaveBotConfig', '() => Promise<void>'],

  // Tester page
  ['testerType', "'text' | 'media' | 'poll' | 'location' | 'contact'"],
  ['setTesterType', "(v: 'text' | 'media' | 'poll' | 'location' | 'contact') => void"],
  ['testerRecipient', 'string'],
  ['setTesterRecipient', '(v: string) => void'],
  ['testerMessage', 'string'],
  ['setTesterMessage', '(v: string) => void'],
  ['testerMediaFile', 'File | null'],
  ['setTesterMediaFile', '(v: File | null) => void'],
  ['testerMediaCaption', 'string'],
  ['setTesterMediaCaption', '(v: string) => void'],
  ['testerPollName', 'string'],
  ['setTesterPollName', '(v: string) => void'],
  ['testerPollValues', 'string'],
  ['setTesterPollValues', '(v: string) => void'],
  ['testerPollMulti', 'number'],
  ['setTesterPollMulti', '(v: number) => void'],
  ['testerLatitude', 'string'],
  ['setTesterLatitude', '(v: string) => void'],
  ['testerLongitude', 'string'],
  ['setTesterLongitude', '(v: string) => void'],
  ['testerLocName', 'string'],
  ['setTesterLocName', '(v: string) => void'],
  ['testerLocAddress', 'string'],
  ['setTesterLocAddress', '(v: string) => void'],
  ['testerContactName', 'string'],
  ['setTesterContactName', '(v: string) => void'],
  ['testerContactPhone', 'string'],
  ['setTesterContactPhone', '(v: string) => void'],
  ['testerContactOrg', 'string'],
  ['setTesterContactOrg', '(v: string) => void'],
  ['testerLoading', 'boolean'],
  ['testerResponse', 'any'],
  ['handleRunTester', '() => Promise<void>'],

  // Integrations page
  ['integrationConfigs', 'IntegrationConfig[]'],
  ['outgoingWebhooks', 'OutgoingWebhook[]'],
  ['integrationLogs', 'IntegrationLog[]'],
  ['selectedIntegrationTab', "'google_form' | 'woocommerce' | 'cf7' | 'elementor' | 'caldera' | 'formidable' | 'outgoing' | 'logs'"],
  ['setSelectedIntegrationTab', "(v: 'google_form' | 'woocommerce' | 'cf7' | 'elementor' | 'caldera' | 'formidable' | 'outgoing' | 'logs') => void"],
  ['copiedWebhookUrl', 'boolean'],
  ['setCopiedWebhookUrl', '(v: boolean) => void'],
  ['copiedScriptCode', 'boolean'],
  ['setCopiedScriptCode', '(v: boolean) => void'],
  ['isTestIntegrationModal', 'boolean'],
  ['setIsTestIntegrationModal', '(v: boolean) => void'],
  ['testIntegrationPhone', 'string'],
  ['setTestIntegrationPhone', '(v: string) => void'],
  ['testIntegrationName', 'string'],
  ['setTestIntegrationName', '(v: string) => void'],
  ['testIntegrationFormName', 'string'],
  ['setTestIntegrationFormName', '(v: string) => void'],
  ['testIntegrationResult', 'any'],
  ['testIntegrationLoading', 'boolean'],
  ['handleTestIncomingWebhook', '() => Promise<void>'],
  ['handleSaveIntegrationConfig', '(conf: Partial<IntegrationConfig>) => Promise<void>'],
  ['handleTestOutgoingWebhook', '(id: string) => Promise<void>'],
  ['handleCreateOutgoingWebhook', '() => Promise<void>'],
  ['handleDeleteOutgoingWebhook', '(id: string) => Promise<void>'],
  ['isAddOutgoingWebhookModal', 'boolean'],
  ['setIsAddOutgoingWebhookModal', '(v: boolean) => void'],
  ['newWebhookName', 'string'],
  ['setNewWebhookName', '(v: string) => void'],
  ['newWebhookUrl', 'string'],
  ['setNewWebhookUrl', '(v: string) => void'],
  ['newWebhookSecret', 'string'],
  ['setNewWebhookSecret', '(v: string) => void'],
  ['newWebhookEvents', 'string[]'],
  ['editIntegrationConfig', 'IntegrationConfig | null'],
  ['setEditIntegrationConfig', '(v: IntegrationConfig | null) => void'],
  ['isEditIntegrationModal', 'boolean'],
  ['setIsEditIntegrationModal', '(v: boolean) => void'],

  // Infrastructure & logs
  ['systemStatus', 'SystemStatus | null'],
  ['backups', 'any[]'],
  ['handleCreateBackup', '() => Promise<void>'],
  ['auditLogs', 'AuditLog[]'],
  ['logFilter', 'string'],
  ['setLogFilter', '(v: string) => void']
];

const CTX_NAMES = CTX_FIELDS.map(f => f[0]);
const dup = CTX_NAMES.filter((n, i) => CTX_NAMES.indexOf(n) !== i);
if (dup.length) { console.error('Duplicate ctx names:', dup); process.exit(1); }

// ---------------------------------------------------------------------------
// Read App.tsx and locate tab blocks
// ---------------------------------------------------------------------------
const lines = fs.readFileSync(SRC, 'utf8').split('\n');

const starts = {};
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(/\{activeTab === '(\w+)' && \(/);
  if (m && !starts[m[1]]) starts[m[1]] = i + 1; // 1-based
}
for (const t of TABS) {
  if (!starts[t]) { console.error('start not found for tab:', t); process.exit(1); }
}

// IMPORTANT: use the LAST </main> (the first one belongs to the chats room)
let mainLineIdx = -1; // 0-based
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('</main>')) mainLineIdx = i;
}
if (mainLineIdx === -1) { console.error('</main> not found'); process.exit(1); }

// Compute each tab's end from tabs sorted by start line (robust to TABS order)
const sortedTabs = TABS.slice().sort((a, b) => starts[a] - starts[b]);
const ends = {}; // 1-based inclusive
for (let k = 0; k < sortedTabs.length; k++) {
  const startLine = lines[starts[sortedTabs[k]] - 1];
  const indent = startLine.match(/^\s*/)[0];
  // From the opener, scan forward for the matching ')}' at the SAME indent level.
  // Nesting is trivial here because inner closers are always deeper-indented.
  let end = -1;
  const tabName = sortedTabs[k];
  const stopAt = k + 1 < sortedTabs.length ? starts[sortedTabs[k + 1]] - 1 : lines.length;
  for (let j = starts[sortedTabs[k]]; j < stopAt; j++) {
    const l = lines[j];
    if (l.trim() === ')}' && l.startsWith(indent) && !l.startsWith(indent + ' ')) { end = j + 1; break; }
  }
  void tabName;
  if (end === -1) { console.error('closer not found for tab', sortedTabs[k]); process.exit(1); }
  ends[sortedTabs[k]] = end;
}

// Extract bodies: the ')}' closer shares the tab's start-line indentation
// (tab bodies contain deeper closers, so match on column, not just trim).
const bodies = {};
for (const t of TABS) {
  const startLine = lines[starts[t] - 1];
  const indent = startLine.match(/^\s*/)[0];
  let end = ends[t];
  while (end > starts[t] && lines[end - 1].trim() !== ')}') end--;
  // Guard: closer must be at the same indent level as the opener
  if (lines[end - 1].trim() === ')}' && !lines[end - 1].startsWith(indent)) {
    console.error(`closer indent mismatch for ${t}: '${lines[end - 1]}'`);
    process.exit(1);
  }
  const body = lines.slice(starts[t] - 1, end); // includes the `)}` line
  if (body.length === 0 || body[body.length - 1].trim() !== ')}') {
    console.error(`block ${t} does not end with ')}' (end=${end})`);
    process.exit(1);
  }
  ends[t] = end;
  // Drop the opener line itself (`{activeTab === 'x' && (`) — the panel is
  // rendered unconditionally by App.tsx's Suspense switch.
  bodies[t] = body.slice(1, -1).map(l => (l.startsWith('        ') ? l.slice(8) : l));
}

// Extract lucide-react icon names from App.tsx import block
const lucideEnd = lines.findIndex(l => l.includes("} from 'lucide-react'"));
let lucideStart = lucideEnd;
while (lucideStart > 0 && !lines[lucideStart].startsWith('import {')) lucideStart--;
const iconNames = [];
for (let i = lucideStart; i <= lucideEnd; i++) {
  for (const tok of lines[i].replace(/import|from|'lucide-react'|[{};,]/g, ' ').split(/\s+/)) {
    if (/^[A-Z][A-Za-z0-9]*$/.test(tok) && !iconNames.includes(tok)) iconNames.push(tok);
  }
}
if (iconNames.length < 10) { console.error('lucide import extraction failed'); process.exit(1); }

// ---------------------------------------------------------------------------
// Write panel files
// ---------------------------------------------------------------------------
fs.mkdirSync(PANELS_DIR, { recursive: true });

for (const t of TABS) {
  const pascal = t.charAt(0).toUpperCase() + t.slice(1);
  const file = [
    `// Extracted verbatim from App.tsx during refactor step 2.`,
    `// JSX for the '${t}' tab. State and handlers live in AppShell (App.tsx)`,
    `// and are provided via PanelCtx.`,
    ``,
    `import React from 'react';`,
    `import { ${iconNames.join(', ')} } from 'lucide-react';`,
    `import { ChatAvatar, ChatInputBox, ChatMessageBubble } from '../components/chat';`,
    `import { parsePhoneFromJid, isSameChat, formatPhoneForDisplay, formatWhatsAppTimestamp, formatDateSeparator, parseRecipientLines, getAvatarBgColor } from '../utils/format';`,
    `import { PanelCtx } from './ctx';`,
    ``,
    `const ${PANEL_NAMES[t]}: React.FC<{ ctx: PanelCtx }> = ({ ctx }) => {`,
    `  const {`,
    `    ${CTX_NAMES.join(',\n    ')}`,
    `  } = ctx;`,
    ``,
    `  return (`,
    `    <>`,
    ...bodies[t],
    `    </>`,
    `  );`,
    `};`,
    ``,
    `export default ${PANEL_NAMES[t]};`,
    ``
  ].join('\n');
  fs.writeFileSync(path.join(PANELS_DIR, pascal + 'Panel.tsx'), file);
}

// ---------------------------------------------------------------------------
// Write ctx.ts (interface generated from CTX_FIELDS)
// ---------------------------------------------------------------------------
const tabKeyUnion = TABS.map(t => `'${t}'`).join(' | ');
const ctxTs = [
  `// Shared context for lazily-loaded tab panels (refactor step 2).`,
  `// AppShell owns all state/handlers and provides them via panelCtx;`,
  `// panels consume them through a single typed destructure.`,
  ``,
  `import React from 'react';`,
  `import type {`,
  `  SessionMeta, Campaign, Contact, Group, AutoRule, AuditLog, ChatItem, ChatMessage,`,
  `  FollowUpTask, Sequence, SalesAnalytics, AutoReplyConfig, SystemStatus,`,
  `  IntegrationConfig, OutgoingWebhook, IntegrationLog`,
  `} from '../types';`,
  `import type { ToastType } from '../components/toast';`,
  `import type { Language } from '../i18n';`,
  ``,
  `export type TabKey = ${tabKeyUnion};`,
  ``,
  `export interface PanelCtx {`,
  ...CTX_FIELDS.map(([n, ty]) => `  ${n}: ${ty};`),
  `}`,
  ``
].join('\n');
fs.writeFileSync(path.join(PANELS_DIR, 'ctx.ts'), ctxTs);

// ---------------------------------------------------------------------------
// Rewire App.tsx: remove tab bodies, insert Suspense block, lazy imports,
// PanelCtx import and the panelCtx object.
// ---------------------------------------------------------------------------
const removed = new Set();
for (const t of TABS) {
  // Remove the whole block INCLUDING the `{activeTab === 'x' && (` opener line
  for (let ln = starts[t]; ln <= ends[t]; ln++) removed.add(ln);
}
const kept = lines.filter((_, i) => !removed.has(i + 1));

// Drop dangling section comments left above removed blocks (avoid double blank gaps)
const cleaned = [];
for (let i = 0; i < kept.length; i++) {
  const line = kept[i];
  const isSectionComment = /====================/.test(line) && /\*\/\s*$/.test(line);
  const prevNonEmpty = cleaned.length ? cleaned[cleaned.length - 1] : '';
  const nextNonEmpty = kept[i + 1] || '';
  if (
    isSectionComment &&
    prevNonEmpty.trim() === '' &&
    (nextNonEmpty.trim() === '' || nextNonEmpty.includes('{/* Per-tab panels'))
  ) {
    continue; // skip stray comment followed by blank line
  }
  cleaned.push(line);
}
kept.length = 0;
kept.push(...cleaned);

// 1) lazy imports + PanelCtx type import after the i18n import
const i18nIdx = kept.findIndex(l => l.includes("from './i18n'"));
if (i18nIdx === -1) { console.error('i18n import not found'); process.exit(1); }
const lazyImports = [
  ``,
  `// Lazy-loaded per-tab panels — each page only ships when first visited`,
  `const DashboardPanel = React.lazy(() => import('./panels/DashboardPanel'));`,
  `const SessionsPanel = React.lazy(() => import('./panels/SessionsPanel'));`,
  `const ChatsPanel = React.lazy(() => import('./panels/ChatsPanel'));`,
  `const CrmPanel = React.lazy(() => import('./panels/CrmPanel'));`,
  `const ContactsPanel = React.lazy(() => import('./panels/ContactsPanel'));`,
  `const GroupsPanel = React.lazy(() => import('./panels/GroupsPanel'));`,
  `const CampaignsPanel = React.lazy(() => import('./panels/CampaignsPanel'));`,
  `const TesterPanel = React.lazy(() => import('./panels/TesterPanel'));`,
  `const AutomationPanel = React.lazy(() => import('./panels/AutomationPanel'));`,
  `const IntegrationsPanel = React.lazy(() => import('./panels/IntegrationsPanel'));`,
  `const InfrastructurePanel = React.lazy(() => import('./panels/InfrastructurePanel'));`,
  `const LogsPanel = React.lazy(() => import('./panels/LogsPanel'));`,
  `import type { PanelCtx } from './panels/ctx';`
];
kept.splice(i18nIdx + 1, 0, ...lazyImports);

// 2) panelCtx object before `const navItems = [`
const navIdx = kept.findIndex(l => l.includes('const navItems = ['));
if (navIdx === -1) { console.error('navItems not found'); process.exit(1); }
const panelCtxBlock = [
  `  // Everything the lazy panels need, provided as one typed object`,
  `  const panelCtx: PanelCtx = {`,
  `    ${CTX_NAMES.join(',\n    ')}`,
  `  };`,
  ``
];
kept.splice(navIdx, 0, ...panelCtxBlock);

// 3) Suspense render block right before </main>
let mainKeptIdx = -1;
for (let i = 0; i < kept.length; i++) {
  if (kept[i].includes('</main>')) mainKeptIdx = i;
}
if (mainKeptIdx === -1) { console.error('</main> not found after removal'); process.exit(1); }
const suspenseBlock = [
  ``,
  `        {/* Per-tab panels — lazy-loaded so each page only ships when visited */}`,
  `        <React.Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat halaman...</div>}>`,
  `          {activeTab === 'dashboard' && <DashboardPanel ctx={panelCtx} />}`,
  `          {activeTab === 'sessions' && <SessionsPanel ctx={panelCtx} />}`,
  `          {activeTab === 'chats' && <ChatsPanel ctx={panelCtx} />}`,
  `          {activeTab === 'crm' && <CrmPanel ctx={panelCtx} />}`,
  `          {activeTab === 'contacts' && <ContactsPanel ctx={panelCtx} />}`,
  `          {activeTab === 'groups' && <GroupsPanel ctx={panelCtx} />}`,
  `          {activeTab === 'campaigns' && <CampaignsPanel ctx={panelCtx} />}`,
  `          {activeTab === 'tester' && <TesterPanel ctx={panelCtx} />}`,
  `          {activeTab === 'automation' && <AutomationPanel ctx={panelCtx} />}`,
  `          {activeTab === 'integrations' && <IntegrationsPanel ctx={panelCtx} />}`,
  `          {activeTab === 'infrastructure' && <InfrastructurePanel ctx={panelCtx} />}`,
  `          {activeTab === 'logs' && <LogsPanel ctx={panelCtx} />}`,
  `        </React.Suspense>`,
  ``
];
kept.splice(mainKeptIdx, 0, ...suspenseBlock);

fs.writeFileSync(SRC, kept.join('\n'));
console.log('Extraction complete:', TABS.length, 'panels written. App.tsx now', kept.length, 'lines.');
