import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Open the database connection
export const initializeDatabase = async () => {
  const db = await open({
    filename: './sandwich_orders.db',
    driver: sqlite3.Database
  });

  // Create the sandwich orders table if it doesn't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS sandwich_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sandwich_name TEXT NOT NULL,
      bread_type TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      order_date TEXT NOT NULL
    );
  `);

  return db;
};

