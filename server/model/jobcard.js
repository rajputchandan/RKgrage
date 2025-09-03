const mongoose = require('mongoose');

const jobCardSchema = new mongoose.Schema({
  job_card_number: { 
    type: String, 
    required: true, 
    unique: true,
    default: function() {
      return 'JC' + Date.now();
    }
  },
  customer_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Customer', 
    required: true 
  },
  customer_name: { type: String, required: true },
  customer_phone: { type: String, required: true },
//   vehicle_info: {
//   vehicle_no: { type: String, required: true },
//   model: { type: String, required: true },
//   year: { type: Number, required: true }
// },

  
  // Service Details
  service_type: { 
    type: String, 
    required: true,
    enum: ['General Service', 'Oil Change', 'Brake Service', 'Engine Repair', 'AC Service', 'Tire Service', 'Other']
  },
  complaint: { type: String, required: true }, // Customer complaint
  
  // Parts Used
  parts_used: [{
    part_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Part' },
    part_name: { type: String, required: true },
    part_number: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unit_price: { type: Number, required: true },
    total_price: { type: Number, required: true }
  }],
  
  // Labor Details - Multiple labor entries
  labor_entries: [{
    labor_type: { type: String, required: true },
    total_amount: { type: Number, required: true, min: 0 }
  }],
  
  // Pricing
  parts_total: { type: Number, default: 0 },
  labor_total: { type: Number, default: 0 },
  subtotal: { type: Number, default: 0 },
  gst_amount: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total_amount: { type: Number, default: 0 },
  
  // Status and Dates
  status: { 
    type: String, 
    required: true,
    enum: ['Open', 'In Progress', 'Completed', 'Delivered', 'Cancelled'],
    default: 'Open'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  
  // Dates
  date_created: { type: Date, default: Date.now },
  date_started: { type: Date },
  date_completed: { type: Date },
  date_delivered: { type: Date },
  estimated_completion: { type: Date },
  
  // Additional Info
  mechanic_assigned: { type: String },
  notes: { type: String },
  internal_notes: { type: String }, // For staff only
  
  // Payment
  payment_status: {
    type: String,
    enum: ['Pending', 'Partial', 'Paid'],
    default: 'Pending'
  },
  amount_paid: { type: Number, default: 0 },
  payment_method: { type: String },
  
}, { timestamps: true });

// Pre-save middleware to calculate totals
jobCardSchema.pre('save', function(next) {
  // Calculate parts total
  this.parts_total = this.parts_used.reduce((total, part) => total + (part.total_price || 0), 0);

  // Calculate labor total
  if (this.labor_entries && this.labor_entries.length > 0) {
    this.labor_total = this.labor_entries.reduce((total, labor) => total + (labor.total_amount || 0), 0);
  } else {
    this.labor_total = this.labor_charges || 0;
  }

  // Subtotal (without GST)
  this.subtotal = this.parts_total + this.labor_total;

  // GST disable
  this.gst_amount = 0;

  // Final total = subtotal - discount
  this.total_amount = this.subtotal - (this.discount || 0);

  next();
});


module.exports = mongoose.model('JobCard', jobCardSchema);