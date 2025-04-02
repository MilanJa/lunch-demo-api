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
 * tags:
 *   - name: Orders
 *     description: Endpoints related to sandwich orders
 *   - name: Sandwiches
 *     description: Endpoints related to sandwiches
 *   - name: Vendors
 *     description: Endpoints related to vendors
 */

/**
 * @swagger
 * /orders:
 *   get:
 *     tags:
 *       - Orders
 *     summary: List all sandwich orders
 *     description: Retrieve a list of all sandwich orders, including details about the sandwich, user, and order date.
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
 *                     example: 1
 *                   sandwich_name:
 *                     type: string
 *                     example: "Turkey Club"
 *                   bread_type:
 *                     type: string
 *                     example: "Whole Wheat"
 *                   user_name:
 *                     type: string
 *                     example: "John Doe"
 *                   user_email:
 *                     type: string
 *                     example: "john.doe@example.com"
 *                   order_date:
 *                     type: string
 *                     format: date
 *                     example: "2025-04-01"
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
 *     tags:
 *       - Orders
 *     summary: Create a new sandwich order
 *     description: Create a new order by specifying the sandwich, user, and order date.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sandwich_id:
 *                 type: integer
 *                 example: 1
 *               user_id:
 *                 type: integer
 *                 example: 1
 *               order_date:
 *                 type: string
 *                 format: date
 *                 example: "2025-04-02"
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
 *     tags:
 *       - Sandwiches
 *     summary: List all sandwiches
 *     description: Retrieve a list of all available sandwiches, including their names and bread types.
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
 *                     example: 1
 *                   sandwich_name:
 *                     type: string
 *                     example: "Turkey Club"
 *                   bread_type:
 *                     type: string
 *                     example: "Whole Wheat"
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
 *     tags:
 *       - Sandwiches
 *     summary: Add a new sandwich
 *     description: Add a new sandwich to the menu by specifying its name and bread type.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sandwich_name:
 *                 type: string
 *                 example: "Ham and Cheese"
 *               bread_type:
 *                 type: string
 *                 example: "White"
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


/**
 * @swagger
 * /vendors:
 *   get:
 *     tags:
 *       - Vendors
 *     summary: List all vendors
 *     description: Retrieve a list of all vendors, including their names.
 *     responses:
 *       200:
 *         description: A list of vendors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: "Vendor A"
 */
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
 *     tags:
 *       - Vendors
 *     summary: Add a new vendor
 *     description: Add a new vendor and associate it with a list of sandwiches.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Jimmy's"
 *               sandwich_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                   example: 1
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

