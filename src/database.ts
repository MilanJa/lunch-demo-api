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

  // Create the sandwich orders table with a foreign key to the sandwiches table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS sandwich_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sandwich_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      order_date TEXT NOT NULL,
      FOREIGN KEY (sandwich_id) REFERENCES sandwiches (id)
    );
  `);

  return db;
};

