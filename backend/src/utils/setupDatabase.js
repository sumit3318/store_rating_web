// Usage (from the backend folder):
//   npm run db:setup              safe: creates what is missing, loads demo data only into an empty database
//   npm run db:setup -- --force   DANGEROUS: erases the users, stores and ratings tables, then rebuilds them
//
// It uses the MySQL login from .env, so no mysql command line is needed.
// Without --force this script never drops a table and never deletes a row.
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const FORCE = process.argv.includes('--force');
const DB_NAME = process.env.DB_NAME || 'store_rating';
const TABLES_IN_DROP_ORDER = ['ratings', 'stores', 'users']; // children first, because of foreign keys

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!/^[A-Za-z0-9_]+$/.test(DB_NAME)) {
  fail('DB_NAME in .env may only contain letters, numbers and underscores.');
}

// The .sql files say "store_rating". If .env uses another name, swap it in.
function loadSql(fileName) {
  const sql = fs.readFileSync(path.join(__dirname, '../../../database', fileName), 'utf8');
  return DB_NAME === 'store_rating' ? sql : sql.replace(/\bstore_rating\b/g, DB_NAME);
}

// Returns { tableName: rowCount } for the app tables that already exist.
async function readExistingTables(connection) {
  const [databases] = await connection.query(
    'SELECT 1 FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?',
    [DB_NAME]
  );
  if (databases.length === 0) return {};

  const [tables] = await connection.query(
    'SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (?)',
    [DB_NAME, TABLES_IN_DROP_ORDER]
  );
  const counts = {};
  for (const { name } of tables) {
    const [[row]] = await connection.query(`SELECT COUNT(*) AS total FROM \`${DB_NAME}\`.\`${name}\``);
    counts[name] = row.total;
  }
  return counts;
}

function describe(counts) {
  return TABLES_IN_DROP_ORDER.filter((t) => t in counts).map((t) => `${counts[t]} ${t}`).join(', ');
}

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true, // lets one query() run a whole .sql file
  });

  try {
    const existing = await readExistingTables(connection);
    const rowTotal = Object.values(existing).reduce((sum, n) => sum + n, 0);

    if (rowTotal > 0 && !FORCE) {
      console.log(`Database "${DB_NAME}" already contains data (${describe(existing)}).`);
      console.log('Nothing was changed. Your data is safe.');
      console.log('To erase it and start again on purpose, run:  npm run db:setup -- --force');
      return;
    }

    if (FORCE && Object.keys(existing).length > 0) {
      console.log(`--force given: erasing ${describe(existing)} from "${DB_NAME}"...`);
      await connection.query(`DROP TABLE IF EXISTS ${TABLES_IN_DROP_ORDER.map((t) => `\`${DB_NAME}\`.\`${t}\``).join(', ')}`);
    }

    await connection.query(loadSql('schema.sql')); // safe: CREATE ... IF NOT EXISTS
    console.log('Ran database/schema.sql');

    const [[users]] = await connection.query(`SELECT COUNT(*) AS total FROM \`${DB_NAME}\`.users`);
    if (users.total === 0) {
      await connection.query(loadSql('seed.sql'));
      console.log('Ran database/seed.sql (demo data)');
    } else {
      console.log('Skipped database/seed.sql because users already exist.');
    }

    const after = await readExistingTables(connection);
    console.log(`Database ready: ${describe(after)}`);
  } finally {
    await connection.end();
  }
}

run().catch((err) => {
  console.error('Database setup failed:', err.message);
  if (err.code === 'ER_DBACCESS_DENIED_ERROR' || err.code === 'ER_ACCESS_DENIED_ERROR') {
    console.error('Hint: check DB_USER / DB_PASSWORD in backend/.env, and that this MySQL user may use the database (see README, "Create a separate MySQL user").');
  }
  process.exit(1);
});
