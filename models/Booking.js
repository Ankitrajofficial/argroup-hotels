const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // Guest Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  
  // Booking Details
  roomType: {
    type: String,
    required: true,
    enum: ['Deluxe Room', 'Executive Suite', 'Family Room']
  },
  checkIn: {
    type: Date,
    required: true
  },
  checkOut: {
    type: Date,
    required: true
  },
  guests: {
    type: Number,
    required: true,
    min: 1,
    max: 6,
    default: 2
  },
  specialRequests: {
    type: String,
    trim: true,
    default: ''
  },
  
  // Status Management
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    default: ''
  },
  
  // Payment Information
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid', 'refunded'],
    default: 'unpaid'
  },
  paymentAmount: {
    type: Number,
    default: 0
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  paidAt: {
    type: Date
  },
  
  // Actual Check-in/Check-out timestamps (when guest physically arrives/departs)
  actualCheckIn: {
    type: Date
  },
  actualCheckOut: {
    type: Date
  },
  
  // Archive status
  isArchived: {
    type: Boolean,
    default: false
  },
  
  // Extended stay tracking
  originalCheckOut: {
    type: Date
  },
  extendedBy: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
bookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for number of nights
bookingSchema.virtual('nights').get(function() {
  if (this.checkIn && this.checkOut) {
    const diff = this.checkOut - this.checkIn;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
  return 0;
});

module.exports = mongoose.model('Booking', bookingSchema);
