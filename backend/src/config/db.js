const mysql = require('mysql2/promise');
require('dotenv').config();

// A pool keeps a few connections open and reuses them for every request.
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'store_rating',
  waitForConnections: true,
  connectionLimit: 10,
});

async function verifyConnection() {
  const connection = await pool.getConnection();
  await connection.ping();
  connection.release();
}

module.exports = { pool, verifyConnection };
