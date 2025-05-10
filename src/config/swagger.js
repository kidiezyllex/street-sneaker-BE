import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Swagger configuration options
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'street-sneaker BE API',
      version: '1.0.0',
      description: 'API documentation for street-sneaker BE',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: 'https://street-sneaker-be.onrender.com/api',
        description: 'Production API Server',
      },
      {
        url: '/api',
        description: 'Local API Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Statistics',
        description: 'Các API liên quan đến thống kê hệ thống',
      },
      {
        name: 'VNPay',
        description: 'Các API liên quan đến thanh toán qua VNPay',
      },
    ],
  },
  // Paths to the API docs
  apis: [
    './src/routes/*.ts',
    './src/routes/*.js',
    './src/models/*.ts',
    './src/models/*.js',
    './src/controllers/*.ts',
    './src/controllers/*.js',
    './src/swagger-docs/*.js'
  ],
};

// Initialize swagger-jsdoc
const specs = swaggerJsdoc(options);

/**
 * Set up Swagger UI
 * @param app Express application
 */
export const setupSwagger = (app) => {
  // Serve swagger docs - both with and without trailing slash
  app.use('/api-docs', swaggerUi.serve);
  app.get('/api-docs', swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'street-sneaker BE API Documentation',
  }));
  
  app.use('/api-docs/', swaggerUi.serve);
  app.get('/api-docs/', swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'street-sneaker BE API Documentation',
  }));

  // Serve swagger spec as JSON
  app.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};

export default setupSwagger; 