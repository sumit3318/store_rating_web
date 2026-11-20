// End-to-end API test. Needs the backend running (default http://localhost:5000) and the demo seed
// (only the seed ADMIN account is used, read-only).
//
//   npm test              run the tests, then remove the rows this run created
//   npm test -- --keep    keep the rows this run created (to look at them in MySQL)
//
// REPEATABLE: every run creates its own users and stores with a unique run id in their emails, never
// changes the demo accounts or demo ratings, and checks numbers relative to its own data. At the end
// it deletes ONLY the rows whose email matches this run's id (users/stores ending in "@apitest.example").
// Nothing else in the database is touched, and no table is dropped.
//
// Other settings (optional):  API_URL, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD

const jwt = require('jsonwebtoken');
const { pool } = require('../src/config/db');

const BASE = process.env.API_URL || 'http://localhost:5000/api';
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@storerating.com';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'Admin@123';
const KEEP = process.argv.includes('--keep');

const RUN = Date.now().toString(36); // unique id for this run, e.g. "mp3k9x2a"
const DOMAIN = 'apitest.example';
const email = (label) => `${label}.${RUN}@${DOMAIN}`;
const PASSWORD = 'Passw0rd!';

let passed = 0;
let failed = 0;
const createdUsers = []; // { email, role } for every user this run managed to create
let createdStores = 0;

async function call(method, path, { token, body, raw } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: raw !== undefined ? raw : body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch (e) { /* empty body */ }
  return { status: res.status, data, headers: res.headers };
}

function check(name, condition, extra = '') {
  if (condition) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.log(`  FAIL  ${name} ${extra}`); }
}

const login = (mail, password) => call('POST', '/auth/login', { body: { email: mail, password } });

async function signup(body) {
  const res = await call('POST', '/auth/signup', { body });
  if (res.status === 201) createdUsers.push({ email: body.email.toLowerCase(), role: 'user' });
  return res;
}

async function adminAddUser(token, body) {
  const res = await call('POST', '/admin/users', { token, body });
  if (res.status === 201) createdUsers.push({ email: body.email.toLowerCase(), role: body.role });
  return res;
}

async function adminAddStore(token, body) {
  const res = await call('POST', '/admin/stores', { token, body });
  if (res.status === 201) createdStores++;
  return res;
}

const person = (label, role, nameEnd) => ({
  name: `Apitest ${RUN} ${nameEnd}`, // always 20 to 60 characters
  email: email(label),
  address: `${label} Test Street ${RUN}, Kolkata`,
  password: PASSWORD,
  role,
});

const sortedCopy = (list, compare) => [...list].sort(compare);
const isSortedBy = (list, compare) => JSON.stringify(list) === JSON.stringify(sortedCopy(list, compare));
const byText = (a, b) => a.localeCompare(b);

async function removeThisRunsRows() {
  const pattern = `%.${RUN}@${DOMAIN}`;
  const [stores] = await pool.query('DELETE FROM stores WHERE email LIKE ?', [pattern]);
  const [users] = await pool.query('DELETE FROM users WHERE email LIKE ?', [pattern]); // ratings go with them (ON DELETE CASCADE)
  console.log(`Cleanup: removed ${users.affectedRows} test users and ${stores.affectedRows} test stores (run id ${RUN}).`);
}

async function main() {
  const health = await call('GET', '/health').catch(() => null);
  if (!health || health.status !== 200) {
    console.error(`Backend is not reachable at ${BASE}. Start it first (npm start).`);
    process.exit(2);
  }
  console.log(`Run id: ${RUN}`);

  // ---------------------------------------------------------------- 1
  console.log('\n[1] Admin login and test data setup');
  const adminLogin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  check('seed admin can log in', adminLogin.status === 200 && adminLogin.data.user.role === 'admin',
    'If this fails, set TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD or check the demo seed.');
  if (adminLogin.status !== 200) throw new Error('Cannot continue without an admin login');
  const A = adminLogin.data.token;
  check('login response never contains a password hash', !JSON.stringify(adminLogin.data).toLowerCase().includes('password'));

  const people = {
    adminB: person('adminb', 'admin', 'Second Admin Account'),
    user1: person('user1', 'user', 'Normal User One'),
    user2: person('user2', 'user', 'Normal User Two'),
    user3: person('user3', 'user', 'Normal User Three'),
    owner1: person('owner1', 'owner', 'Store Owner One'),
    owner2: person('owner2', 'owner', 'Store Owner Two'),
    owner3: person('owner3', 'owner', 'Store Owner Three'),
    ownerNoStore: person('owner0', 'owner', 'Owner Without Store'),
  };
  const ids = {};
  for (const [key, body] of Object.entries(people)) {
    const res = await adminAddUser(A, body);
    check(`admin creates ${key} (${body.role})`, res.status === 201 && res.data.user.role === body.role, JSON.stringify(res.data));
    ids[key] = res.data?.user?.id;
  }

  const storeA = await adminAddStore(A, { name: `Apitest ${RUN} Alpha Bakery`, email: email('alpha'), address: `1 Alpha Road ${RUN}, Kolkata`, ownerId: ids.owner1 });
  const storeB = await adminAddStore(A, { name: `Apitest ${RUN} Beta Books`, email: email('beta'), address: `2 Beta Lane ${RUN}, Delhi`, ownerId: ids.owner2 });
  const storeC = await adminAddStore(A, { name: `Apitest ${RUN} Gamma Mart`, email: email('gamma'), address: `3 Gamma Street ${RUN}, Pune` });
  check('admin creates 3 stores (A and B with owners, C without)', [storeA, storeB, storeC].every((s) => s.status === 201));
  const sA = storeA.data.store.id, sB = storeB.data.store.id, sC = storeC.data.store.id;

  // ---------------------------------------------------------------- 2
  console.log('\n[2] Login for every role');
  const tokens = {};
  for (const key of ['adminB', 'user1', 'user2', 'user3', 'owner1', 'owner2', 'owner3', 'ownerNoStore']) {
    const res = await login(people[key].email, PASSWORD);
    check(`${key} login returns token and role ${people[key].role}`, res.status === 200 && res.data.user.role === people[key].role);
    tokens[key] = res.data?.token;
  }
  const U1 = tokens.user1, U2 = tokens.user2, U3 = tokens.user3, O1 = tokens.owner1, O2 = tokens.owner2;

  let wrong = await login(people.adminB.email, 'Wrong@1234');
  check('wrong password -> 401', wrong.status === 401);
  const unknownStart = Date.now();
  const unknown = await login(email('nobody'), PASSWORD);
  const unknownMs = Date.now() - unknownStart;
  check('unknown email -> 401 with the same message', unknown.status === 401 && unknown.data.message === wrong.data.message);
  check('unknown email takes bcrypt-like time (>= 20 ms), not an instant reply', unknownMs >= 20, `took ${unknownMs} ms`);
  const empty = await login('', '');
  check('empty email/password -> 400', empty.status === 400);

  // ---------------------------------------------------------------- 3
  console.log('\n[3] Signup and validation');
  const base = { name: `Signup ${RUN} Person Number One`, address: '12 Test Lane, Kolkata', password: PASSWORD };
  let r = await signup({ ...base, email: email('su1') });
  check('valid signup -> 201 with token, role user', r.status === 201 && r.data.token && r.data.user.role === 'user');
  r = await signup({ ...base, email: email('su1') });
  check('duplicate email -> 409 with email field error', r.status === 409 && r.data.errors.email, JSON.stringify(r.data));
  r = await signup({ ...base, email: email('su1').toUpperCase() });
  check('duplicate email is case-insensitive -> 409', r.status === 409);
  r = await signup({ ...base, email: email('su2'), name: 'Too Short Name' });
  check('name < 20 chars -> 400', r.status === 400 && r.data.errors.name);
  r = await signup({ ...base, email: email('su3'), name: 'N'.repeat(61) });
  check('name > 60 chars -> 400', r.status === 400 && r.data.errors.name);
  r = await signup({ ...base, email: email('su4'), name: 'N'.repeat(20) });
  check('name of exactly 20 chars accepted', r.status === 201);
  r = await signup({ ...base, email: email('su5'), name: 'N'.repeat(60) });
  check('name of exactly 60 chars accepted', r.status === 201);
  r = await signup({ ...base, email: 'not-an-email' });
  check('invalid email -> 400', r.status === 400 && r.data.errors.email);
  for (const bad of ['a..b@example.com', '.a@example.com', 'a.@example.com', 'a@example..com', 'a@-example.com', 'a@example.123', 'a@exam_ple.com', 'a b@example.com', 'a@example']) {
    r = await signup({ ...base, email: bad });
    check(`non-standard email ${JSON.stringify(bad)} -> 400`, r.status === 400 && r.data.errors.email);
  }
  r = await signup({ ...base, email: `plus+tag.${RUN}@${DOMAIN}` });
  check('standard email with a plus sign is accepted', r.status === 201);
  r = await signup({ ...base, email: email('su6'), address: 'x'.repeat(401) });
  check('address > 400 chars -> 400', r.status === 400 && r.data.errors.address);
  r = await signup({ ...base, email: email('su7'), address: 'x'.repeat(400) });
  check('address of exactly 400 chars accepted', r.status === 201);
  for (const [label, pw] of [['too short (7)', 'Abcde!1'], ['too long (17)', 'Abcdefghijklmn!12'], ['no uppercase', 'password!1'], ['no special character', 'Password11']]) {
    r = await signup({ ...base, email: email('su8'), password: pw });
    check(`password ${label} -> 400`, r.status === 400 && r.data.errors.password);
  }
  r = await signup({ ...base, email: email('su9'), password: 'Abcdef!1' });
  check('password of exactly 8 chars accepted', r.status === 201);
  r = await signup({ ...base, email: email('su10'), password: 'Abcdefghijklm!12' });
  check('password of exactly 16 chars accepted', r.status === 201);
  r = await signup({ ...base, email: email('su12'), password: 'Passw0rdé1' });
  check('a letter such as "é" does not count as a special character -> 400', r.status === 400 && r.data.errors.password);
  r = await signup({ ...base, email: email('su13'), password: 'Passw0rd_1' });
  check('an underscore counts as a special character -> accepted', r.status === 201);
  r = await call('POST', '/auth/signup', { body: { ...base, email: email('su11'), role: 'admin' } });
  if (r.status === 201) createdUsers.push({ email: email('su11'), role: 'user' });
  check('signup ignores a role sent by the client (stays user)', r.status === 201 && r.data.user.role === 'user');
  r = await call('POST', '/auth/signup', { body: {} });
  check('empty signup body -> 400 with all field errors', r.status === 400 && r.data.errors.name && r.data.errors.email && r.data.errors.password && r.data.errors.address);

  // ---------------------------------------------------------------- 4
  console.log('\n[4] Authentication and role-based authorization');
  r = await call('GET', '/admin/stats');
  check('no token -> 401', r.status === 401);
  r = await call('GET', '/admin/stats', { token: 'garbage.token.value' });
  check('invalid token -> 401', r.status === 401);
  r = await call('GET', '/admin/stats', { token: jwt.sign({ id: 1, role: 'admin' }, 'a-wrong-secret') });
  check('token signed with the wrong secret -> 401', r.status === 401);
  r = await call('GET', '/auth/me', { token: U1 });
  check('/auth/me returns the logged-in user', r.status === 200 && r.data.user.email === people.user1.email.toLowerCase());
  r = await call('POST', '/auth/logout', { token: U1 });
  check('logout endpoint -> 200', r.status === 200);
  const forbidden = [
    ['normal user -> admin stats', 'GET', '/admin/stats', U1],
    ['owner -> admin users', 'GET', '/admin/users', O1],
    ['normal user -> create user', 'POST', '/admin/users', U1],
    ['owner -> create store', 'POST', '/admin/stores', O1],
    ['admin -> user store list', 'GET', '/stores', A],
    ['owner -> submit rating', 'POST', `/stores/${sA}/rating`, O1],
    ['admin -> submit rating', 'POST', `/stores/${sA}/rating`, A],
    ['normal user -> owner dashboard', 'GET', '/owner/dashboard', U1],
    ['admin -> owner dashboard', 'GET', '/owner/dashboard', A],
  ];
  for (const [label, method, path, token] of forbidden) {
    r = await call(method, path, { token, body: method === 'POST' ? { rating: 5 } : undefined });
    check(`${label} -> 403`, r.status === 403);
  }

  // ---------------------------------------------------------------- 5
  console.log('\n[5] Admin creates users and stores (validation and conflicts)');
  r = await adminAddUser(A, { ...people.user1, email: email('bad1'), role: 'superuser' });
  check('invalid role -> 400', r.status === 400 && r.data.errors.role);
  r = await adminAddUser(A, { ...people.user1 });
  check('duplicate user email -> 409', r.status === 409 && r.data.errors.email);
  r = await adminAddUser(A, { name: 'Short', email: email('bad2'), address: 'Road', password: 'weak', role: 'user' });
  check('admin add-user validates name and password -> 400', r.status === 400 && r.data.errors.name && r.data.errors.password);

  r = await call('GET', '/admin/owners/available', { token: A });
  const availableEmails = r.data.owners.map((o) => o.email);
  check('available owners = owners without a store', availableEmails.includes(people.owner3.email.toLowerCase()) && !availableEmails.includes(people.owner1.email.toLowerCase()));

  r = await adminAddStore(A, { name: 'Another Store', email: email('alpha'), address: 'Somewhere' });
  check('duplicate store email -> 409', r.status === 409 && r.data.errors.email);
  r = await adminAddStore(A, { name: 'Another Store', email: email('dup2'), address: 'Somewhere', ownerId: ids.owner1 });
  check('an owner cannot get a second store -> 409', r.status === 409 && r.data.errors.ownerId);
  r = await adminAddStore(A, { name: 'Another Store', email: email('dup3'), address: 'Somewhere', ownerId: ids.user1 });
  check('store owner must have role owner -> 400', r.status === 400 && r.data.errors.ownerId);
  r = await adminAddStore(A, { name: '', email: 'bad', address: '' });
  check('store validation errors -> 400', r.status === 400 && r.data.errors.name && r.data.errors.email && r.data.errors.address);
  r = await adminAddStore(A, { name: `T-${RUN}`, email: email('tiny'), address: `4 Tiny Road ${RUN}` });
  check('short store name (under 20 chars) is allowed: the 20-60 rule applies to people\'s names, not store names', r.status === 201);
  r = await adminAddStore(A, { name: 'N'.repeat(101), email: email('long'), address: 'Somewhere' });
  check('store name over 100 chars -> 400', r.status === 400 && r.data.errors.name);

  // ---------------------------------------------------------------- 6
  console.log('\n[6] Rating submit, update, duplicates and averages (own stores only)');
  r = await call('POST', `/stores/${sA}/rating`, { token: U1, body: { rating: 4 } });
  check('user1 rates store A with 4 -> 201', r.status === 201);
  r = await call('POST', `/stores/${sA}/rating`, { token: U1, body: { rating: 5 } });
  check('second POST for the same store -> 409 (no duplicate row)', r.status === 409);
  for (const bad of [0, 6, 3.5, -1, 'abc', null]) {
    r = await call('PUT', `/stores/${sA}/rating`, { token: U1, body: { rating: bad } });
    check(`invalid rating ${JSON.stringify(bad)} -> 400`, r.status === 400 && r.data.errors.rating);
  }
  r = await call('POST', `/stores/${sA}/rating`, { token: U2, body: { rating: 5 } });
  check('user2 rates store A with 5', r.status === 201);
  r = await call('POST', `/stores/${sA}/rating`, { token: U3, body: { rating: 3 } });
  check('user3 rates store A with 3', r.status === 201);

  const listFor = async (token, query = '') => (await call('GET', `/stores?search=${encodeURIComponent(RUN)}${query}`, { token })).data.stores;
  let list = await listFor(U1);
  let a = list.find((s) => s.id === sA);
  check('store A average = (4+5+3)/3 = 4.0 with 3 ratings', Number(a.average_rating) === 4 && a.rating_count === 3, JSON.stringify(a));
  check("user1's own rating shown on store A (4)", a.my_rating === 4);

  r = await call('PUT', `/stores/${sA}/rating`, { token: U1, body: { rating: 1 } });
  check('user1 updates the rating to 1 -> 200', r.status === 200);
  list = await listFor(U1);
  a = list.find((s) => s.id === sA);
  check('after update: average = (1+5+3)/3 = 3.0 and still 3 ratings (row updated, not added)', Number(a.average_rating) === 3 && a.rating_count === 3, JSON.stringify(a));
  check("user1's rating now 1", a.my_rating === 1);

  await call('POST', `/stores/${sB}/rating`, { token: U1, body: { rating: 2 } });
  await call('POST', `/stores/${sB}/rating`, { token: U2, body: { rating: 5 } });
  list = await listFor(U1);
  const b = list.find((s) => s.id === sB);
  check('store B average = (2+5)/2 = 3.5', Number(b.average_rating) === 3.5 && b.rating_count === 2);
  const c = list.find((s) => s.id === sC);
  check('store without ratings: average null, my_rating null', c.average_rating === null && c.my_rating === null && c.rating_count === 0);

  r = await call('PUT', `/stores/${sC}/rating`, { token: U1, body: { rating: 3 } });
  check('updating a rating that does not exist -> 404', r.status === 404);
  r = await call('POST', '/stores/99999999/rating', { token: U1, body: { rating: 3 } });
  check('rating an unknown store -> 404', r.status === 404);
  r = await call('POST', '/stores/abc/rating', { token: U1, body: { rating: 3 } });
  check('non-numeric store id -> 400', r.status === 400);
  r = await call('GET', '/ratings/me', { token: U1 });
  check('rating history of user1 lists exactly her 2 ratings', r.status === 200 && r.data.ratings.length === 2 && r.data.ratings.some((x) => x.store_id === sA && x.rating === 1));
  const history = (query) => call('GET', `/ratings/me?${query}`, { token: U1 });
  r = await history('sortBy=rating&order=asc');
  check('history sorted by rating ascending (1, 2)', r.data.ratings.map((x) => x.rating).join() === '1,2');
  r = await history('sortBy=rating&order=desc');
  check('history sorted by rating descending (2, 1)', r.data.ratings.map((x) => x.rating).join() === '2,1');
  r = await history('sortBy=store_name&order=asc');
  check('history sorted by store name ascending', isSortedBy(r.data.ratings.map((x) => x.store_name), byText));
  r = await history('sortBy=store_name&order=desc');
  check('history sorted by store name descending', isSortedBy(r.data.ratings.map((x) => x.store_name), (x, y) => byText(y, x)));
  r = await history('sortBy=store_address&order=desc');
  check('history sorted by store address descending', isSortedBy(r.data.ratings.map((x) => x.store_address), (x, y) => byText(y, x)));
  r = await history('sortBy=date&order=asc');
  check('history sorted by date works', r.status === 200 && r.data.ratings.length === 2);
  r = await history(`sortBy=${encodeURIComponent('rating;DROP TABLE users')}`);
  check('SQL injection in history sortBy is ignored safely', r.status === 200 && r.data.ratings.length === 2);

  // Totals: compare before and after one extra user + store + rating, so other data does not matter.
  const before = (await call('GET', '/admin/stats', { token: A })).data;
  const extraUser = await adminAddUser(A, person('extra', 'user', 'Extra Stats User'));
  const extraStore = await adminAddStore(A, { name: `Apitest ${RUN} Delta Shop`, email: email('delta'), address: `5 Delta Road ${RUN}` });
  const extraToken = (await login(email('extra'), PASSWORD)).data.token;
  await call('POST', `/stores/${extraStore.data.store.id}/rating`, { token: extraToken, body: { rating: 5 } });
  const after = (await call('GET', '/admin/stats', { token: A })).data;
  check('dashboard totals rise by exactly +1 user, +1 store, +1 rating',
    after.totalUsers === before.totalUsers + 1 && after.totalStores === before.totalStores + 1 && after.totalRatings === before.totalRatings + 1,
    `${JSON.stringify(before)} -> ${JSON.stringify(after)}`);

  // ---------------------------------------------------------------- 7
  console.log('\n[7] Store search and sorting for normal users');
  r = await call('GET', `/stores?search=${encodeURIComponent(`Apitest ${RUN} Alpha`)}`, { token: U1 });
  check('search by store name', r.data.stores.length === 1 && r.data.stores[0].id === sA);
  r = await call('GET', `/stores?search=${encodeURIComponent(`Beta Lane ${RUN}`)}`, { token: U1 });
  check('search by address', r.data.stores.length === 1 && r.data.stores[0].id === sB);
  r = await call('GET', '/stores?search=zzzzzz-no-such-store', { token: U1 });
  check('search with no match -> empty list', r.status === 200 && r.data.stores.length === 0);
  list = await listFor(U1, '&sortBy=name&order=asc');
  check('sort name ascending', isSortedBy(list.map((s) => s.name), byText), list.map((s) => s.name).join(' | '));
  list = await listFor(U1, '&sortBy=name&order=desc');
  check('sort name descending', isSortedBy(list.map((s) => s.name), (x, y) => byText(y, x)));
  list = await listFor(U1, '&sortBy=average_rating&order=desc');
  const ratedDesc = list.filter((s) => s.average_rating !== null).map((s) => Number(s.average_rating));
  check('sort average rating descending', ratedDesc.every((v, i) => i === 0 || ratedDesc[i - 1] >= v), ratedDesc.join(','));
  r = await call('GET', `/stores?sortBy=${encodeURIComponent('name;DROP TABLE users')}&order=asc`, { token: U1 });
  check('SQL injection in sortBy is ignored safely', r.status === 200);
  r = await call('GET', '/stores?search=%25', { token: U1 });
  check('"%" in the search box is treated as plain text', r.status === 200 && r.data.stores.length === 0);

  // ---------------------------------------------------------------- 8
  console.log('\n[8] Admin listings: filters and sorting (only this run\'s rows)');
  const mine = `.${RUN}@${DOMAIN}`;
  r = await call('GET', `/admin/users?email=${encodeURIComponent(mine)}`, { token: A });
  check('email filter finds every user this run created', r.status === 200 && r.data.users.length === createdUsers.length, `${r.data.users.length} vs ${createdUsers.length}`);
  check('user rows expose only id, name, email, address, role', Object.keys(r.data.users[0]).sort().join() === 'address,email,id,name,role');
  for (const role of ['admin', 'user', 'owner']) {
    r = await call('GET', `/admin/users?email=${encodeURIComponent(mine)}&role=${role}`, { token: A });
    const expected = createdUsers.filter((u) => u.role === role).length;
    check(`role filter = ${role} (${expected} expected)`, r.data.users.length === expected && r.data.users.every((u) => u.role === role));
  }
  r = await call('GET', '/admin/users?role=hacker', { token: A });
  check('invalid role filter -> 400', r.status === 400);
  r = await call('GET', `/admin/users?name=${encodeURIComponent(`${RUN} Normal User Two`)}`, { token: A });
  check('name filter', r.data.users.length === 1 && r.data.users[0].email === people.user2.email.toLowerCase());
  r = await call('GET', `/admin/users?address=${encodeURIComponent(`user3 Test Street ${RUN}`)}`, { token: A });
  check('address filter', r.data.users.length === 1 && r.data.users[0].email === people.user3.email.toLowerCase());
  r = await call('GET', `/admin/users?email=${encodeURIComponent(mine)}&role=user&address=kolkata`, { token: A });
  check('combined filters (email + role + address)', r.data.users.length > 0 && r.data.users.every((u) => u.role === 'user' && /kolkata/i.test(u.address)));
  r = await call('GET', `/admin/users?email=${encodeURIComponent(mine)}&sortBy=email&order=desc`, { token: A });
  check('sort users by email descending', isSortedBy(r.data.users.map((u) => u.email), (x, y) => byText(y, x)));
  r = await call('GET', `/admin/users?email=${encodeURIComponent(mine)}&sortBy=role&order=asc`, { token: A });
  const roleOrder = r.data.users.map((u) => u.role);
  check('sort users by role ascending (alphabetical)', roleOrder.every((v, i) => i === 0 || roleOrder[i - 1] <= v), roleOrder.join(','));

  r = await call('GET', `/admin/stores?name=${encodeURIComponent(RUN)}`, { token: A });
  check('store name filter finds every store this run created', r.status === 200 && r.data.stores.length === createdStores, `${r.data.stores.length} vs ${createdStores}`);
  check('store rows include email and average rating', 'email' in r.data.stores[0] && 'average_rating' in r.data.stores[0]);
  r = await call('GET', `/admin/stores?email=${encodeURIComponent(`beta.${RUN}`)}`, { token: A });
  check('store email filter', r.data.stores.length === 1 && r.data.stores[0].id === sB);
  r = await call('GET', `/admin/stores?address=${encodeURIComponent(`Gamma Street ${RUN}`)}`, { token: A });
  check('store address filter', r.data.stores.length === 1 && r.data.stores[0].id === sC);
  r = await call('GET', `/admin/stores?name=${encodeURIComponent(RUN)}&sortBy=average_rating&order=asc`, { token: A });
  const avgAsc = r.data.stores.filter((s) => s.average_rating !== null).map((s) => Number(s.average_rating));
  check('sort stores by average rating ascending', avgAsc.every((v, i) => i === 0 || avgAsc[i - 1] <= v), avgAsc.join(','));
  r = await call('GET', `/admin/stores?name=${encodeURIComponent(RUN)}&sortBy=name&order=desc`, { token: A });
  check('sort stores by name descending', isSortedBy(r.data.stores.map((s) => s.name), (x, y) => byText(y, x)));

  // ---------------------------------------------------------------- 9
  console.log('\n[9] Admin user details');
  r = await call('GET', `/admin/users/${ids.owner1}`, { token: A });
  check('owner details include store and its rating (3.0)', r.status === 200 && r.data.user.role === 'owner' && r.data.user.store && Number(r.data.user.store.average_rating) === 3, JSON.stringify(r.data));
  r = await call('GET', `/admin/users/${ids.user1}`, { token: A });
  check('normal user details have no store block', r.status === 200 && r.data.user.store === undefined);
  r = await call('GET', '/admin/users/99999999', { token: A });
  check('unknown user -> 404', r.status === 404);
  r = await call('GET', '/admin/users/abc', { token: A });
  check('bad user id -> 400', r.status === 400);

  // ---------------------------------------------------------------- 10
  console.log('\n[10] Store owner dashboard (owners see only their own store)');
  r = await call('GET', '/owner/dashboard', { token: O1 });
  check('owner1 sees store A with average 3.0 and 3 raters', r.status === 200 && r.data.store.id === sA && Number(r.data.store.average_rating) === 3 && r.data.raters.length === 3);
  check('rater rows carry name, email and rating', r.data.raters.every((x) => x.name && x.email && x.rating));
  r = await call('GET', '/owner/dashboard', { token: O2 });
  check('owner2 sees only store B (2 raters)', r.data.store.id === sB && r.data.raters.length === 2 && r.data.raters.every((x) => x.email !== people.user3.email.toLowerCase()));
  r = await call('GET', '/owner/dashboard?sortBy=rating&order=desc', { token: O1 });
  const ratingsDesc = r.data.raters.map((x) => x.rating);
  check('owner can sort raters by rating descending', ratingsDesc.every((v, i) => i === 0 || ratingsDesc[i - 1] >= v), ratingsDesc.join(','));
  r = await call('GET', '/owner/dashboard?sortBy=name&order=asc', { token: O1 });
  check('owner can sort raters by name ascending', isSortedBy(r.data.raters.map((x) => x.name), byText));
  r = await call('GET', '/owner/dashboard', { token: tokens.owner3 });
  check('owner without a store -> 404 with a helpful message', r.status === 404 && /store/i.test(r.data.message));
  await adminAddStore(A, { name: `Apitest ${RUN} Epsilon Cafe`, email: email('epsilon'), address: `6 Epsilon Road ${RUN}`, ownerId: ids.owner3 });
  r = await call('GET', '/owner/dashboard', { token: tokens.owner3 });
  check('after admin links a store, owner3 sees it with no ratings yet', r.status === 200 && r.data.raters.length === 0 && r.data.store.average_rating === null);
  r = await call('GET', '/owner/dashboard', { token: tokens.ownerNoStore });
  check('another owner with no store still gets 404', r.status === 404);

  // ---------------------------------------------------------------- 11
  console.log('\n[11] Change password (all three roles, on this run\'s own accounts)');
  r = await call('PUT', '/auth/password', { token: U1, body: { currentPassword: 'WrongOld@1', newPassword: 'NewPass@123' } });
  check('wrong current password -> 400', r.status === 400 && r.data.errors.currentPassword);
  r = await call('PUT', '/auth/password', { token: U1, body: { currentPassword: PASSWORD, newPassword: 'weakpass' } });
  check('weak new password -> 400', r.status === 400 && r.data.errors.newPassword);
  r = await call('PUT', '/auth/password', { token: U1, body: { currentPassword: PASSWORD, newPassword: PASSWORD } });
  check('same password -> 400', r.status === 400 && r.data.errors.newPassword);
  r = await call('PUT', '/auth/password', { token: U1, body: { currentPassword: PASSWORD, newPassword: 'NewPass@123' } });
  check('normal user changes password', r.status === 200);
  check('old password no longer works', (await login(people.user1.email, PASSWORD)).status === 401);
  check('new password works', (await login(people.user1.email, 'NewPass@123')).status === 200);
  check('store owner changes password', (await call('PUT', '/auth/password', { token: O1, body: { currentPassword: PASSWORD, newPassword: 'Owner@4567' } })).status === 200);
  check('admin changes password', (await call('PUT', '/auth/password', { token: tokens.adminB, body: { currentPassword: PASSWORD, newPassword: 'Admin@4567' } })).status === 200);
  check('password change without token -> 401', (await call('PUT', '/auth/password', { body: { currentPassword: 'x', newPassword: 'y' } })).status === 401);

  // ---------------------------------------------------------------- 12
  console.log('\n[12] Security hardening');
  r = await call('GET', '/health');
  check('X-Powered-By header is not sent', !r.headers.has('x-powered-by'));
  check('Helmet headers are present (X-Content-Type-Options: nosniff)', r.headers.get('x-content-type-options') === 'nosniff');
  check('Helmet headers are present (Strict-Transport-Security)', !!r.headers.get('strict-transport-security'));

  const limitedEmail = email('ratelimit');
  const statuses = [];
  for (let i = 0; i < 10; i++) statuses.push((await login(limitedEmail, 'Wrong@1234')).status);
  check('first 10 failed logins for one email are answered normally (401)', statuses.every((s) => s === 401), statuses.join(','));
  r = await login(limitedEmail, 'Wrong@1234');
  check('11th failed login is blocked with 429', r.status === 429 && /too many/i.test(r.data.message), `${r.status} ${JSON.stringify(r.data)}`);
  check('429 response tells the client when to retry (Retry-After header)', !!r.headers.get('retry-after'));
  r = await login(email('other-ratelimit'), 'Wrong@1234');
  check('a different email is not affected by that limit', r.status === 401);
  r = await login(people.adminB.email, 'Admin@4567');
  check('a normal successful login is not affected', r.status === 200);

  const race = await Promise.all([1, 2].map(() => signup({ ...base, email: email('race') })));
  const raceStatuses = race.map((x) => x.status).sort();
  check('two simultaneous signups with one email -> one 201 and one 409 (never a 500)', raceStatuses.join() === '201,409', raceStatuses.join());
  const raceRating = await Promise.all([1, 2].map(() => call('POST', `/stores/${sC}/rating`, { token: U2, body: { rating: 4 } })));
  check('two simultaneous ratings for one store -> one 201 and one 409', raceRating.map((x) => x.status).sort().join() === '201,409');
  const raceStore = await Promise.all([1, 2].map(() => adminAddStore(A, { name: `Apitest ${RUN} Race Store`, email: email('racestore'), address: `7 Race Road ${RUN}` })));
  check('two simultaneous stores with one email -> one 201 and one 409 (never a 500)', raceStore.map((x) => x.status).sort().join() === '201,409', raceStore.map((x) => x.status).join());

  // ---------------------------------------------------------------- 13
  console.log('\n[13] Misc');
  r = await call('GET', '/does-not-exist');
  check('unknown route -> 404 JSON', r.status === 404 && r.data.message);
  r = await call('POST', '/auth/login', { raw: '{bad json' });
  check('malformed JSON -> 400', r.status === 400);

  console.log(`\nResult: ${passed} passed, ${failed} failed\n`);
}

main()
  .catch((err) => {
    failed++;
    console.error('Test run crashed:', err);
  })
  .finally(async () => {
    try {
      if (KEEP) console.log(`--keep given: rows with ids "*.${RUN}@${DOMAIN}" were left in the database.`);
      else await removeThisRunsRows();
    } catch (err) {
      console.error('Cleanup failed (rows with this run id may remain):', err.message);
    }
    await pool.end();
    process.exit(failed === 0 ? 0 : 1);
  });
