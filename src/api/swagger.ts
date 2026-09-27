export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'WhatsAman REST API',
    version: '1.0.0',
    description: 'REST API untuk WhatsAman — WhatsApp Dashboard by Aman Kerja Studio (Berbasis Baileys Engine)'
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
                  text: { type: 'string', example: 'Halo dari WhatsAman!' }
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
    '/messages/location': {
      post: {
        summary: 'Send location pin message',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  sessionId: { type: 'string', example: 'marketing' },
                  to: { type: 'string', example: '628123456789' },
                  latitude: { type: 'number', example: -6.2088 },
                  longitude: { type: 'number', example: 106.8456 },
                  name: { type: 'string', example: 'Kantor Pusat' },
                  address: { type: 'string', example: 'Jl. Sudirman No. 1, Jakarta' }
                },
                required: ['sessionId', 'to', 'latitude', 'longitude']
              }
            }
          }
        },
        responses: { '200': { description: 'Location sent' } }
      }
    },
    '/messages/contact': {
      post: {
        summary: 'Send contact vCard message (Sprint 5)',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  sessionId: { type: 'string', example: 'marketing' },
                  to: { type: 'string', example: '628123456789' },
                  contact: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', example: 'Dr. Tirta' },
                      phone: { type: 'string', example: '628111222333' },
                      organization: { type: 'string', example: 'Klinik Sehat' }
                    },
                    required: ['name', 'phone']
                  }
                },
                required: ['sessionId', 'to', 'contact']
              }
            }
          }
        },
        responses: { '200': { description: 'Contact vCard sent' } }
      }
    },
    '/messages/poll': {
      post: {
        summary: 'Send interactive WhatsApp poll (Sprint 5)',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  sessionId: { type: 'string', example: 'marketing' },
                  to: { type: 'string', example: '628123456789' },
                  poll: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', example: 'Kapan waktu pengiriman terbaik Anda?' },
                      values: {
                        type: 'array',
                        items: { type: 'string' },
                        example: ['Pagi (08:00 - 12:00)', 'Siang (13:00 - 17:00)', 'Malam (19:00 - 21:00)']
                      },
                      selectableCount: { type: 'integer', example: 1 }
                    },
                    required: ['name', 'values']
                  }
                },
                required: ['sessionId', 'to', 'poll']
              }
            }
          }
        },
        responses: { '200': { description: 'Poll message sent' } }
      }
    },
    '/messages/send': {
      post: {
        summary: 'Unified message dispatcher (text, media, or location)',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  sessionId: { type: 'string', example: 'marketing' },
                  to: { type: 'string', example: '628123456789' },
                  message: { type: 'string', example: 'Halo dari unified endpoint!' },
                  mediaUrl: { type: 'string', example: 'https://example.com/image.jpg' },
                  latitude: { type: 'number', example: -6.2088 },
                  longitude: { type: 'number', example: 106.8456 },
                  name: { type: 'string', example: 'Lokasi Kantor' },
                  address: { type: 'string', example: 'Jakarta' }
                },
                required: ['sessionId', 'to']
              }
            }
          }
        },
        responses: { '200': { description: 'Message sent via unified endpoint' } }
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
                  },
                  isRecurring: { type: 'boolean', example: false },
                  cronExpression: { type: 'string', example: '0 9 * * *' },
                  maxRuns: { type: 'integer', example: 0 }
                },
                required: ['sessionId', 'name', 'templateText']
              }
            }
          }
        },
        responses: { '201': { description: 'Campaign created' } }
      }
    },
    '/campaigns/quick-csv': {
      post: {
        summary: 'Create and launch campaign directly from CSV/Excel file (Sprint 3)',
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary', description: 'CSV or XLSX file with phone/nomor column' },
                  sessionId: { type: 'string', example: 'marketing' },
                  name: { type: 'string', example: 'Broadcast CSV Pelanggan' },
                  templateText: { type: 'string', example: '{Halo|Hai} {name}, diskon spesial untuk nomor {phone}!' },
                  mediaPath: { type: 'string', example: 'https://example.com/banner.jpg' },
                  mediaType: { type: 'string', enum: ['image', 'video', 'document', 'audio'] },
                  randomDelayMin: { type: 'integer', example: 5 },
                  randomDelayMax: { type: 'integer', example: 15 },
                  autoStart: { type: 'boolean', example: true }
                },
                required: ['file', 'sessionId', 'templateText']
              }
            }
          }
        },
        responses: { '201': { description: 'Campaign created from CSV/Excel and queued/started' } }
      }
    },
    '/templates': {
      get: {
        summary: 'List message templates',
        parameters: [{ name: 'sessionId', in: 'query', schema: { type: 'string' } }],
        responses: { '200': { description: 'Templates list' } }
      },
      post: {
        summary: 'Create message template',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  sessionId: { type: 'string', example: 'marketing' },
                  name: { type: 'string', example: 'Promo Gajian' },
                  category: { type: 'string', example: 'promo' },
                  content: { type: 'string', example: '{Halo|Hai} {name}, diskon 50% untuk pesanan {produk} Anda!' }
                },
                required: ['name', 'content']
              }
            }
          }
        },
        responses: { '201': { description: 'Template created' } }
      }
    },
    '/templates/{id}': {
      get: {
        summary: 'Get message template by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Template details' } }
      },
      put: {
        summary: 'Update message template by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  category: { type: 'string' },
                  content: { type: 'string' }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Template updated' } }
      },
      delete: {
        summary: 'Delete message template',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Template deleted' } }
      }
    },
    '/webhooks': {
      get: {
        summary: 'List all registered outbound webhooks (Sprint 4)',
        parameters: [{ name: 'sessionId', in: 'query', schema: { type: 'string' } }],
        responses: { '200': { description: 'Webhooks list' } }
      },
      post: {
        summary: 'Register a new outbound webhook subscriber (Sprint 4)',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'CRM Integration Webhook' },
                  targetUrl: { type: 'string', example: 'https://webhook.site/my-endpoint' },
                  events: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['message.received', 'message.ack', 'session.status']
                  },
                  sessionId: { type: 'string', example: 'marketing' },
                  secretKey: { type: 'string', example: 'whsec_my_secure_secret_123' },
                  isActive: { type: 'boolean', example: true }
                },
                required: ['name', 'targetUrl']
              }
            }
          }
        },
        responses: { '201': { description: 'Webhook created' } }
      }
    },
    '/webhooks/{id}': {
      get: {
        summary: 'Get webhook details by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Webhook details' } }
      },
      put: {
        summary: 'Update webhook details',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  targetUrl: { type: 'string' },
                  events: { type: 'array', items: { type: 'string' } },
                  sessionId: { type: 'string' },
                  secretKey: { type: 'string' },
                  isActive: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Webhook updated' } }
      },
      delete: {
        summary: 'Delete webhook by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Webhook deleted' } }
      }
    },
    '/webhooks/{id}/test': {
      post: {
        summary: 'Send a test ping payload to verify destination webhook URL',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Test ping result' } }
      }
    },
    '/chatflows': {
      get: {
        summary: 'List all multi-step interactive chat flows (Sprint 6)',
        parameters: [{ name: 'sessionId', in: 'query', schema: { type: 'string' } }],
        responses: { '200': { description: 'Chat flows list' } }
      },
      post: {
        summary: 'Create a new interactive chat flow (Sprint 6)',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  sessionId: { type: 'string', example: 'marketing' },
                  name: { type: 'string', example: 'Pendaftaran Konsultasi' },
                  description: { type: 'string', example: 'Kuesioner interaktif pengumpulan data calon klien' },
                  triggerKeyword: { type: 'string', example: 'konsultasi' },
                  triggerType: { type: 'string', enum: ['contains', 'equals', 'starts_with'], example: 'contains' },
                  steps: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        promptText: { type: 'string' },
                        variableName: { type: 'string' },
                        validationType: { type: 'string', enum: ['any', 'email', 'phone', 'number', 'options'] },
                        options: { type: 'array', items: { type: 'string' } },
                        errorMessage: { type: 'string' }
                      }
                    }
                  },
                  isActive: { type: 'boolean', example: true }
                },
                required: ['name', 'triggerKeyword', 'steps']
              }
            }
          }
        },
        responses: { '201': { description: 'Chat flow created' } }
      }
    },
    '/chatflows/{id}': {
      get: {
        summary: 'Get chat flow details by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Chat flow details' } }
      },
      put: {
        summary: 'Update chat flow by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  triggerKeyword: { type: 'string' },
                  triggerType: { type: 'string' },
                  steps: { type: 'array' },
                  isActive: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Chat flow updated' } }
      },
      delete: {
        summary: 'Delete chat flow by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Chat flow deleted' } }
      }
    },
    '/chatflows/{id}/sessions': {
      get: {
        summary: 'Get collected user responses and form submission sessions for this flow',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Sessions and collected data' } }
      }
    },
    '/integrations/webhook/{provider}/{sessionId}': {
      post: {
        summary: 'Ingest third-party webhook and send automated WhatsApp notification (Fitur #20-25)',
        description: 'Supports Google Form (namedValues), Contact Form 7, WooCommerce, Elementor Form, Caldera, and Formidable Form.',
        parameters: [
          { name: 'provider', in: 'path', required: true, schema: { type: 'string', enum: ['google_form', 'cf7', 'woocommerce', 'elementor', 'caldera', 'formidable'] } },
          { name: 'sessionId', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                description: 'Provider specific payload containing phone, name, and custom fields'
              }
            }
          }
        },
        responses: {
          '200': { description: 'Webhook processed and WhatsApp message sent' },
          '401': { description: 'Unauthorized secret token' }
        }
      }
    },
    '/integrations/configs': {
      get: {
        summary: 'List all third-party integration configs',
        parameters: [{ name: 'sessionId', in: 'query', schema: { type: 'string' } }],
        responses: { '200': { description: 'List of integration templates' } }
      },
      post: {
        summary: 'Create or update integration template & admin alert config',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  provider: { type: 'string', enum: ['google_form', 'cf7', 'woocommerce', 'elementor', 'caldera', 'formidable'] },
                  name: { type: 'string' },
                  templateText: { type: 'string' },
                  adminPhone: { type: 'string' },
                  adminTemplateText: { type: 'string' },
                  secretToken: { type: 'string' },
                  isActive: { type: 'boolean' }
                },
                required: ['provider', 'name', 'templateText']
              }
            }
          }
        },
        responses: { '201': { description: 'Config saved' } }
      }
    },
    '/integrations/logs': {
      get: {
        summary: 'Get third-party webhook ingestion logs',
        parameters: [
          { name: 'sessionId', in: 'query', schema: { type: 'string' } },
          { name: 'provider', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'number', default: 50 } }
        ],
        responses: { '200': { description: 'Webhook ingestion audit logs' } }
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
