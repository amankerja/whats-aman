export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'WhatsApp Local Hub REST API',
    version: '1.0.0',
    description: 'REST API untuk WhatsApp Local Hub (Inspirasi arsitektur WAHA + OpenWA berbasis Baileys Engine)'
  },
  servers: [
    {
      url: 'http://localhost:3000/api/v1',
      description: 'Localhost API Server'
    }
  ],
  paths: {
    '/sessions': {
      get: {
        summary: 'List all WhatsApp sessions',
        responses: { '200': { description: 'Successful response' } }
      },
      post: {
        summary: 'Create a new session',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'marketing' },
                  name: { type: 'string', example: 'Marketing WA' }
                },
                required: ['id']
              }
            }
          }
        },
        responses: { '201': { description: 'Session created' } }
      }
    },
    '/sessions/{id}/connect': {
      post: {
        summary: 'Connect a session (QR or 8-digit Pairing Code)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  usePairingCode: { type: 'boolean', example: false },
                  phoneNumber: { type: 'string', example: '628123456789' }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Connection initiated' } }
      }
    },
    '/sessions/{id}/disconnect': {
      post: {
        summary: 'Disconnect a session',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Session disconnected' } }
      }
    },
    '/messages/text': {
      post: {
        summary: 'Send text message',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  sessionId: { type: 'string', example: 'marketing' },
                  to: { type: 'string', example: '628123456789' },
                  text: { type: 'string', example: 'Halo dari WhatsApp Local Hub!' }
                },
                required: ['sessionId', 'to', 'text']
              }
            }
          }
        },
        responses: { '200': { description: 'Message sent' } }
      }
    },
    '/messages/media': {
      post: {
        summary: 'Send media message (image, video, document)',
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  sessionId: { type: 'string' },
                  to: { type: 'string' },
                  type: { type: 'string', enum: ['image', 'video', 'audio', 'document'] },
                  caption: { type: 'string' },
                  file: { type: 'string', format: 'binary' }
                },
                required: ['sessionId', 'to', 'type']
              }
            }
          }
        },
        responses: { '200': { description: 'Media sent' } }
      }
    },
    '/contacts': {
      get: {
        summary: 'Get all contacts',
        parameters: [{ name: 'sessionId', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Contacts list' } }
      }
    },
    '/groups': {
      get: {
        summary: 'List all participating groups (Group Grabber)',
        parameters: [{ name: 'sessionId', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Groups list' } }
      }
    },
    '/campaigns': {
      get: {
        summary: 'List all campaigns',
        responses: { '200': { description: 'Campaigns list' } }
      },
      post: {
        summary: 'Create a new broadcast campaign',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  sessionId: { type: 'string', example: 'marketing' },
                  name: { type: 'string', example: 'Promo Akhir Pekan' },
                  templateText: { type: 'string', example: '{Halo|Hai} {{name}}, dapatkan diskon 20%!' },
                  recipients: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        phone: { type: 'string', example: '628123456789' },
                        name: { type: 'string', example: 'Budi' }
                      }
                    }
                  }
                },
                required: ['sessionId', 'name', 'templateText']
              }
            }
          }
        },
        responses: { '201': { description: 'Campaign created' } }
      }
    },
    '/system/status': {
      get: {
        summary: 'Get system health, memory usage, and portable storage status',
        responses: { '200': { description: 'System health' } }
      }
    }
  }
};
