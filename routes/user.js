// routes/user.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ShortUrl = require('../models/ShortUrl');
const bcrypt = require('bcryptjs');

// Registration page
router.get('/register', (req, res) => {
  res.render('user_register');
});

// Registration handler
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    let existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.render('user_register', { error: 'Username already taken' });
    }
    existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('user_register', { error: 'Email already registered' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();
    res.redirect('/user/login');
  } catch (err) {
    res.status(500).send('Error registering user');
  }
});

// User login page
router.get('/login', (req, res) => {
  res.render('user_login');
});

// User login handler
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.render('user_login', { error: 'User not found' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.render('user_login', { error: 'Incorrect password' });
    }
    req.session.user = user;
    res.redirect('/user/dashboard');
  } catch (err) {
    res.status(500).send('Error logging in');
  }
});

// User logout
router.get('/logout', (req, res) => {
  req.session.user = null;
  res.redirect('/user/login');
});

// Middleware to ensure the user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) return next();
  res.redirect('/user/login');
}

// User Dashboard: show URL form and history
router.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    const urls = await ShortUrl.find({ user: req.session.user._id });
    res.render('user_dashboard', { urls });
  } catch (err) {
    res.status(500).send('Error retrieving dashboard');
  }
});

// New Short URL creation (from dashboard form)
router.post('/dashboard/shorten', isAuthenticated, async (req, res) => {
  const { originalUrl, customCode } = req.body;
  let shortCode = customCode ? customCode.trim() : null;
  
  // If a custom code is provided, check for its availability
  if (shortCode) {
    const exists = await ShortUrl.findOne({ shortCode });
    if (exists) {
      const urls = await ShortUrl.find({ user: req.session.user._id });
      return res.render('user_dashboard', { error: 'Custom short code already taken', urls });
    }
  } else {
    // Generate a random 6-character alphanumeric string if no custom code provided
    shortCode = Math.random().toString(36).substring(2, 8);
    let exists = await ShortUrl.findOne({ shortCode });
    while (exists) {
      shortCode = Math.random().toString(36).substring(2, 8);
      exists = await ShortUrl.findOne({ shortCode });
    }
  }
  
  const shortUrl = new ShortUrl({
    originalUrl,
    shortCode,
    user: req.session.user._id
  });
  
  try {
    await shortUrl.save();
    const urls = await ShortUrl.find({ user: req.session.user._id });
    res.render('user_dashboard', {
      success: 'Short URL created: ' + req.headers.host + '/s/' + shortCode,
      urls
    });
  } catch (err) {
    res.status(500).send('Error saving URL');
  }
});

module.exports = router;
