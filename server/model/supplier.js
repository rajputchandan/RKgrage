const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  supplier_name: { 
    type: String, 
    required: true,
    trim: true
  },
  contact_person: {
    type: String,
    trim: true
  },
  mobile: { 
    type: String, 
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  pincode: {
    type: String,
    trim: true
  },
  gstin: {
    type: String,
    trim: true,
    uppercase: true
  },
  pan: {
    type: String,
    trim: true,
    uppercase: true
  },
  bank_details: {
    account_number: String,
    bank_name: String,
    ifsc_code: String,
    branch: String
  },
  payment_terms: {
    type: String,
    enum: ['Cash', 'Credit', 'Net 30', 'Net 60', 'Net 90'],
    default: 'Cash'
  },
  credit_limit: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  notes: {
    type: String,
    trim: true
  }
}, { 
  timestamps: true 
});

// Index for faster searches
supplierSchema.index({ supplier_name: 1 });
supplierSchema.index({ mobile: 1 });
supplierSchema.index({ gstin: 1 });

module.exports = mongoose.model('Supplier', supplierSchema);