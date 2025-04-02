import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
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

// Update the GET /orders route to include user and sandwich details
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

// Update the POST /orders route to ensure it uses the new schema
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

// Route to list all sandwiches
app.get('/sandwiches', async (req: Request, res: Response) => {
  try {
    const sandwiches = await db.all('SELECT * FROM sandwiches');
    res.json(sandwiches);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sandwiches' });
  }
});

// Fix the type error by ensuring the route handler is properly typed
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

// Fix the type error by explicitly casting the route handler to express.RequestHandler
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

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

