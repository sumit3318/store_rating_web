// Usage: node src/utils/generateHash.js "Password@123"
// Prints a bcrypt hash that can be pasted into database/seed.sql
const bcrypt = require('bcryptjs');

const password = process.argv[2];
if (!password) {
  console.log('Usage: node src/utils/generateHash.js "<password>"');
  process.exit(1);
}
console.log(bcrypt.hashSync(password, 10));
