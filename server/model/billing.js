const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema({
  invoice_number: { 
    type: String, 
    required: true, 
    unique: true,
    default: function() {
      return 'INV' + Date.now();
    }
  },
  customer_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Customer', 
    required: true 
  },
  jobcard_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'JobCard'
  },
  
  // Customer details (for quick access)
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  
  // Billing details
  date: { type: Date, default: Date.now },
  
  // Items (parts and services)
  items: [{
    item_type: { 
      type: String, 
      enum: ['part', 'service'], 
      required: true 
    },
    item_id: { type: String }, // part_id for parts, labor_type for services
    item_name: { type: String, required: true }, // part name or labor type
    description: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unit_price: { type: Number, required: true, min: 0 },
    total_price: { type: Number, required: true, min: 0 }
  }],
  
  // Totals
  parts_total: { type: Number, default: 0 },
  labor_total: { type: Number, default: 0 },
  subtotal: { type: Number, default: 0 },
  
  // GST Configuration
  gst_enabled: { type: Boolean, default: true }, // Whether to apply GST or not
  cgst_rate: { type: Number, default: 9 }, // CGST rate (default 9%)
  sgst_rate: { type: Number, default: 9 }, // SGST rate (default 9%)
  cgst_amount: { type: Number, default: 0 }, // CGST amount
  sgst_amount: { type: Number, default: 0 }, // SGST amount
  gst_amount: { type: Number, default: 0 }, // Total GST amount (CGST + SGST)
  
  discount: { type: Number, default: 0 },
  total_amount: { type: Number, default: 0 },
  
  // Payment
  payment_status: {
    type: String,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending'
  },
  amount_paid: { type: Number, default: 0 },
  payment_method: { type: String },
  
  // Additional info
  notes: { type: String },
  
}, { timestamps: true });

// Pre-save middleware to calculate totals
billingSchema.pre('save', function(next) {
  // Calculate parts and labor totals
  this.parts_total = this.items
    .filter(item => item.item_type === 'part')
    .reduce((total, item) => total + (item.total_price || 0), 0);
  
  this.labor_total = this.items
    .filter(item => item.item_type === 'service')
    .reduce((total, item) => total + (item.total_price || 0), 0);
  
  // Calculate subtotal
  this.subtotal = this.parts_total + this.labor_total;
  
  // Calculate GST based on gst_enabled flag
  if (this.gst_enabled) {
    // Calculate CGST and SGST separately - round to 2 decimal places
    this.cgst_amount = Math.round((this.subtotal * (this.cgst_rate || 9)) / 100 * 100) / 100;
    this.sgst_amount = Math.round((this.subtotal * (this.sgst_rate || 9)) / 100 * 100) / 100;
    this.gst_amount = this.cgst_amount + this.sgst_amount;
  } else {
    // No GST calculation
    this.cgst_amount = 0;
    this.sgst_amount = 0;
    this.gst_amount = 0;
  }
  
  // Calculate total amount (subtotal + GST - discount)
  this.total_amount = this.subtotal + this.gst_amount - (this.discount || 0);
  
  next();
});

module.exports = mongoose.model('Billing', billingSchema);