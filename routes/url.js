// routes/url.js
const express = require('express');
const router = express.Router();
const ShortUrl = require('../models/ShortUrl');

// Public redirect route for short URLs (use /s/:shortCode)
router.get('/s/:shortCode', async (req, res) => {
  try {
    const record = await ShortUrl.findOne({ shortCode: req.params.shortCode });
    if (record) {
      record.clicks += 1;
      await record.save();
      return res.redirect(record.originalUrl);
    }
    res.status(404).send('URL not found');
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
