const mongoose = require('mongoose');

const partSchema = new mongoose.Schema({
  name: { type: String, required: true },
  part_number: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  stock_quantity: { type: Number, required: true },
  cost_price: { type: Number, required: true }, // Purchase/Cost price
  selling_price: { type: Number, required: true },
  gst_rate: { type: Number, required: true }, // GST % (e.g. 18)
  gst_amount: { type: Number, required: true }, // Auto-calculated
  supplier: { type: String, required: true },
  rack_location: { type: String, required: true }, // Rack location where part is stored
  min_stock_level: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Part', partSchema);
