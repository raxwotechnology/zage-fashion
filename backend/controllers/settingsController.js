const Settings = require('../models/Settings');
const path = require('path');

// Get settings (public)
const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update settings (admin only)
const updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
    }

    const fields = [
      'shopName', 'tagline', 'email', 'phone', 'phone2', 'address', 'city', 'country',
      'currency', 'exchangeRate', 'deliveryFeeThreshold', 'deliveryFee', 'taxRate',
      'loyaltyPointsPerUnit', 'loyaltyPointValue', 'footerText', 'maintenanceMode',
    ];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });

    // Social links
    if (req.body.socialLinks) {
      settings.socialLinks = { ...settings.socialLinks.toObject?.() || {}, ...req.body.socialLinks };
    }

    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Upload logo
const uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
    }

    settings.logo = `/uploads/${req.file.filename}`;
    await settings.save();

    res.json({ logo: settings.logo, message: 'Logo updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getSettings, updateSettings, uploadLogo };
