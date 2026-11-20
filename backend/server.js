require('dotenv').config();
const app = require('./src/app');
const { verifyConnection } = require('./src/config/db');

const PORT = process.env.PORT || 5000;

async function start() {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is missing. Copy .env.example to .env and fill it in.');
    process.exit(1);
  }

  try {
    await verifyConnection();
    console.log('MySQL connection OK');
  } catch (err) {
    console.error('Could not connect to MySQL:', err.message);
    process.exit(1);
  }

  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
}

start();
