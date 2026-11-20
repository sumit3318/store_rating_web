const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.disable('x-powered-by'); // do not advertise "Express" to attackers
app.use(helmet()); // sets a group of safe security headers
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
