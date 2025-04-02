import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { initializeDatabase, insertDemoData } from './database';

dotenv.config();

const port = process.env.PORT || 3000;

const app = express();

app.use(express.json());

let db: any;

// Initialize the database
initializeDatabase().then(async (database: any) => {
  db = database;
  console.log('Database initialized');

  // Insert demo data if the database is empty
  await insertDemoData(db);
  console.log('Demo data inserted if the database was empty');
});

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: List all sandwich orders
 *     responses:
 *       200:
 *         description: A list of sandwich orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   order_id:
 *                     type: integer
 *                   sandwich_name:
 *                     type: string
 *                   bread_type:
 *                     type: string
 *                   user_name:
 *                     type: string
 *                   user_email:
 *                     type: string
 *                   order_date:
 *                     type: string
 *                     format: date
 */
app.get('/orders', async (req: Request, res: Response) => {
  try {
    const orders = await db.all(`
      SELECT 
        sandwich_orders.id AS order_id,
        sandwiches.sandwich_name,
        sandwiches.bread_type,
        users.name AS user_name,
        users.email AS user_email,
        sandwich_orders.order_date
      FROM sandwich_orders
      JOIN sandwiches ON sandwich_orders.sandwich_id = sandwiches.id
      JOIN users ON sandwich_orders.user_id = users.id
    `);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new sandwich order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sandwich_id:
 *                 type: integer
 *               user_id:
 *                 type: integer
 *               order_date:
 *                 type: string
 *                 format: date
 *             required:
 *               - sandwich_id
 *               - user_id
 *               - order_date
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Invalid input
 */
app.post('/orders', (async (req: Request, res: Response) => {
  const { sandwich_id, user_id, order_date } = req.body;

  const missingFields = [];
  if (!sandwich_id) missingFields.push('sandwich_id');
  if (!user_id) missingFields.push('user_id');
  if (!order_date) missingFields.push('order_date');

  if (missingFields.length > 0) {
    return res.status(400).json({ error: `Missing fields: ${missingFields.join(', ')}` });
  }

  try {
    const result = await db.run(
      'INSERT INTO sandwich_orders (sandwich_id, user_id, order_date) VALUES (?, ?, ?)',
      [sandwich_id, user_id, order_date]
    );
    res.status(201).json({ id: result.lastID });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
}) as express.RequestHandler);

// Add routes for managing sandwiches

/**
 * @swagger
 * /sandwiches:
 *   get:
 *     summary: List all sandwiches
 *     responses:
 *       200:
 *         description: A list of sandwiches
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   sandwich_name:
 *                     type: string
 *                   bread_type:
 *                     type: string
 */
app.get('/sandwiches', async (req: Request, res: Response) => {
  try {
    const sandwiches = await db.all('SELECT * FROM sandwiches');
    res.json(sandwiches);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sandwiches' });
  }
});

/**
 * @swagger
 * /sandwiches:
 *   post:
 *     summary: Add a new sandwich
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sandwich_name:
 *                 type: string
 *               bread_type:
 *                 type: string
 *             required:
 *               - sandwich_name
 *               - bread_type
 *     responses:
 *       201:
 *         description: Sandwich added successfully
 *       400:
 *         description: Invalid input
 */
app.post('/sandwiches', (async (req: Request, res: Response) => {
  const { sandwich_name, bread_type } = req.body;

  if (!sandwich_name || !bread_type) {
    return res.status(400).json({ error: 'Sandwich name and bread type are required' });
  }

  try {
    const result = await db.run(
      'INSERT INTO sandwiches (sandwich_name, bread_type) VALUES (?, ?)',
      [sandwich_name, bread_type]
    );
    res.status(201).json({ id: result.lastID });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add sandwich' });
  }
}) as express.RequestHandler);

// Route to list all vendors
app.get('/vendors', async (req: Request, res: Response) => {
  try {
    const vendors = await db.all('SELECT * FROM vendors');
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

/**
 * @swagger
 * /vendors:
 *   post:
 *     summary: Add a new vendor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               sandwich_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *             required:
 *               - name
 *               - sandwich_ids
 *     responses:
 *       201:
 *         description: Vendor added successfully
 *       400:
 *         description: Invalid input
 */
app.post('/vendors', (async (req: Request, res: Response) => {
  const { name, sandwich_ids } = req.body;

  if (!name || !Array.isArray(sandwich_ids)) {
    return res.status(400).json({ error: 'Vendor name and sandwich_ids are required' });
  }

  try {
    const result = await db.run('INSERT INTO vendors (name) VALUES (?)', [name]);
    const vendorId = result.lastID;

    for (const sandwichId of sandwich_ids) {
      await db.run('INSERT INTO vendor_sandwiches (vendor_id, sandwich_id) VALUES (?, ?)', [vendorId, sandwichId]);
    }

    res.status(201).json({ id: vendorId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add vendor' });
  }
}) as express.RequestHandler);

// Add a route to serve the raw OpenAPI spec
app.get('/openapi.json', (req: Request, res: Response) => {
  res.json(swaggerSpec);
});

console.log('OpenAPI spec available at http://localhost:3000/openapi.json');

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Sandwich Orders API',
    version: '1.0.0',
    description: 'API documentation for the Sandwich Orders application',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
  ],
};

// Options for swagger-jsdoc
const options = {
  swaggerDefinition,
  apis: ['./src/**/*.ts'], // Path to the API docs
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJsdoc(options);

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

console.log('Swagger UI available at http://localhost:3000/api-docs');

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

