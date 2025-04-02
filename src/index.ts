import express, { Request, Response } from 'express';
import { initializeDatabase } from './database';

const app = express();
const port = 3000;

app.use(express.json());

let db: any;

// Initialize the database
initializeDatabase().then((database: any) => {
  db = database;
  console.log('Database initialized');
});

// Route to list all sandwich orders
app.get('/orders', async (req: Request, res: Response) => {
  try {
    const orders = await db.all('SELECT * FROM sandwich_orders');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Explicitly cast the route handler to the correct type
app.post('/orders', (async (req: Request, res: Response) => {
  const { sandwich_name, bread_type, user_id, order_date } = req.body;

  if (!sandwich_name || !bread_type || !user_id || !order_date) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const result = await db.run(
      'INSERT INTO sandwich_orders (sandwich_name, bread_type, user_id, order_date) VALUES (?, ?, ?, ?)',
      [sandwich_name, bread_type, user_id, order_date]
    );
    res.status(201).json({ id: result.lastID });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
}) as express.RequestHandler);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

