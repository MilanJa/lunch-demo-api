import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Update the database schema to include a new sandwiches table and modify the sandwich_orders table
export const initializeDatabase = async () => {
  const db = await open({
    filename: './sandwich_orders.db',
    driver: sqlite3.Database
  });

  // Create the sandwiches table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS sandwiches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sandwich_name TEXT NOT NULL,
      bread_type TEXT NOT NULL
    );
  `);

  // Add a users table to the database schema
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL
    );
  `);

  // Update the sandwich_orders table to reference the users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS sandwich_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sandwich_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      order_date TEXT NOT NULL,
      FOREIGN KEY (sandwich_id) REFERENCES sandwiches (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `);

  return db;
};

// Add a function to insert demo data into the database if it is empty
export const insertDemoData = async (db: any) => {
  // Check if the sandwiches table is empty
  const sandwichCount = await db.get('SELECT COUNT(*) as count FROM sandwiches');
  if (sandwichCount.count === 0) {
    await db.run(`INSERT INTO sandwiches (sandwich_name, bread_type) VALUES (?, ?)`, ['Turkey Club', 'Whole Wheat']);
    await db.run(`INSERT INTO sandwiches (sandwich_name, bread_type) VALUES (?, ?)`, ['Veggie Delight', 'Multigrain']);
    await db.run(`INSERT INTO sandwiches (sandwich_name, bread_type) VALUES (?, ?)`, ['Ham and Cheese', 'White']);
    await db.run(`INSERT INTO sandwiches (sandwich_name, bread_type) VALUES (?, ?)`, ['Chicken Caesar', 'Ciabatta']);
    await db.run(`INSERT INTO sandwiches (sandwich_name, bread_type) VALUES (?, ?)`, ['BLT', 'Rye']);
  }

  // Check if the users table is empty
  const userCount = await db.get('SELECT COUNT(*) as count FROM users');
  if (userCount.count === 0) {
    await db.run(`INSERT INTO users (name, email, role) VALUES (?, ?, ?)`, ['John Doe', 'john.doe@visma.com', 'employee']);
    await db.run(`INSERT INTO users (name, email, role) VALUES (?, ?, ?)`, ['Jane Smith', 'jane.smith@visma.com', 'manager']);
  }

  // Check if the sandwich_orders table is empty
  const orderCount = await db.get('SELECT COUNT(*) as count FROM sandwich_orders');
  if (orderCount.count === 0) {
    await db.run(`INSERT INTO sandwich_orders (sandwich_id, user_id, order_date) VALUES (?, ?, ?)`, [1, 1, '2025-04-01']);
    await db.run(`INSERT INTO sandwich_orders (sandwich_id, user_id, order_date) VALUES (?, ?, ?)`, [2, 2, '2025-04-02']);
  }
};

