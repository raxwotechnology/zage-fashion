const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  shopName: { type: String, default: 'FreshCart' },
  tagline: { type: String, default: 'Fresh Groceries Delivered to Your Door' },
  logo: { type: String, default: '' },
  email: { type: String, default: 'info@freshcart.lk' },
  phone: { type: String, default: '+94 11 255 5000' },
  phone2: { type: String, default: '' },
  address: { type: String, default: '123 Market Street, Colombo 03, Sri Lanka' },
  city: { type: String, default: 'Colombo' },
  country: { type: String, default: 'Sri Lanka' },
  currency: { type: String, default: 'LKR' },
  exchangeRate: { type: Number, default: 320 },
  deliveryFeeThreshold: { type: Number, default: 5000 },
  deliveryFee: { type: Number, default: 350 },
  taxRate: { type: Number, default: 0.08 },
  loyaltyPointsPerUnit: { type: Number, default: 100 },
  loyaltyPointValue: { type: Number, default: 1 },
  socialLinks: {
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
    twitter: { type: String, default: '' },
  },
  footerText: { type: String, default: '© 2026 FreshCart. All rights reserved.' },
  maintenanceMode: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
