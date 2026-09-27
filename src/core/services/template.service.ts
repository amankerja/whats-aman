import { templateRepository, MessageTemplateRecord } from '../database/repositories/template.repository';
import { ValidationError, NotFoundError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export class TemplateService {
  public createTemplate(data: {
    sessionId?: string | null;
    name: string;
    category?: string;
    content: string;
  }): MessageTemplateRecord {
    if (!data.name?.trim()) {
      throw new ValidationError('Template name is required');
    }
    if (!data.content?.trim()) {
      throw new ValidationError('Template content is required');
    }

    const id = `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const template = templateRepository.create({
      id,
      sessionId: data.sessionId,
      name: data.name.trim(),
      category: data.category?.trim() || 'general',
      content: data.content.trim()
    });

    logger.info({ templateId: template.id, name: template.name }, 'Message template created');
    return template;
  }

  public getTemplates(sessionId?: string): MessageTemplateRecord[] {
    return templateRepository.findAll(sessionId);
  }

  public getTemplateById(id: string): MessageTemplateRecord {
    const template = templateRepository.findById(id);
    if (!template) {
      throw new NotFoundError(`Template with ID ${id} not found`);
    }
    return template;
  }

  public updateTemplate(
    id: string,
    data: { name?: string; category?: string; content?: string; sessionId?: string | null }
  ): MessageTemplateRecord {
    this.getTemplateById(id); // verifies existence
    templateRepository.update(id, data);
    logger.info({ templateId: id }, 'Message template updated');
    return templateRepository.findById(id)!;
  }

  public deleteTemplate(id: string): void {
    this.getTemplateById(id);
    templateRepository.delete(id);
    logger.info({ templateId: id }, 'Message template deleted');
  }
}

export const templateService = new TemplateService();
