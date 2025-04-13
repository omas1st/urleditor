// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const app = express();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Session configuration
app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false
  })
);

// Make session available in every EJS view
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// Landing page for "/"
app.get('/', (req, res) => {
  res.render('landing');
});

// For admin, explicitly redirect /admin to /admin/login
app.get('/admin', (req, res) => {
  res.redirect('/admin/login');
});

// Admin routes: mount authentication first, then protected routes
const adminAuthRoutes = require('./routes/auth'); // Admin login/logout routes
app.use('/admin', adminAuthRoutes);
const adminRoutes = require('./routes/admin');
app.use('/admin', adminRoutes);

// User routes
const userRoutes = require('./routes/user');
app.use('/user', userRoutes);

// Public redirection route for short URLs (see routes/url.js)
const urlRoutes = require('./routes/url');
app.use('/', urlRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
