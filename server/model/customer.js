const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  email: { type: String, unique: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip_code: { type: String, required: true },

  // ✅ Updated Vehicle details
  vehicle_number: { type: String, required: true },  // Example: MH12AB1234
  model_name: { type: String, required: true },      // Example: Toyota Camry
  mfg_year: {
    type: Number,
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{4}$/.test(v);  // Only 4 digit year
      },
      message: props => `${props.value} is not a valid year!`
    }
  },
  kilometer: {
    type: Number,
    default: 0,
    min: 0,
    validate: {
      validator: function(v) {
        return v >= 0;  // Kilometer should be non-negative
      },
      message: props => `${props.value} is not a valid kilometer reading!`
    }
  },

  total_services: { type: Number, default: 0 },
  last_service_date: { type: Date },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
