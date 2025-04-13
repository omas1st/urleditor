// routes/admin.js
const express = require('express');
const router = express.Router();
const ShortUrl = require('../models/ShortUrl');
const User = require('../models/User');

// Middleware to check admin authentication
function isAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.redirect('/admin/login');
}

router.use(isAdmin);

// Admin Dashboard
router.get('/dashboard', async (req, res) => {
  const totalUrls = await ShortUrl.countDocuments();
  res.render('dashboard', { totalUrls });
});

// Manage Users
router.get('/users', async (req, res) => {
  const users = await User.find({});
  res.render('admin_users', { users });
});

// Add New User (admin-created)
router.post('/users/add', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const newUser = new User({ username, email, password });
    await newUser.save();
    res.redirect('/admin/users');
  } catch (err) {
    res.status(500).send('Error adding user');
  }
});

// Delete User
router.post('/users/delete/:id', async (req, res) => {
  try {
    await User.findByIdAndRemove(req.params.id);
    res.redirect('/admin/users');
  } catch (err) {
    res.status(500).send('Error deleting user');
  }
});

// Manage Short URLs
router.get('/urls', async (req, res) => {
  const urls = await ShortUrl.find({});
  res.render('admin_urls', { urls });
});

// Edit URL (update the original URL)
router.post('/urls/edit/:id', async (req, res) => {
  const { originalUrl } = req.body;
  try {
    await ShortUrl.findByIdAndUpdate(req.params.id, { originalUrl });
    res.redirect('/admin/urls');
  } catch (err) {
    res.status(500).send('Error updating URL');
  }
});

// Delete URL
router.post('/urls/delete/:id', async (req, res) => {
  try {
    await ShortUrl.findByIdAndRemove(req.params.id);
    res.redirect('/admin/urls');
  } catch (err) {
    res.status(500).send('Error deleting URL');
  }
});

// View URL Statistics
router.get('/urls/:id/stats', async (req, res) => {
  try {
    const record = await ShortUrl.findById(req.params.id);
    if (record) {
      res.render('url_stats', { url: record });
    } else {
      res.status(404).send('URL not found');
    }
  } catch (err) {
    res.status(500).send('Error retrieving URL stats');
  }
});

module.exports = router;
