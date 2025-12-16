const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    items: [{
        menuItemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Menu',
            required: true
        },
        name: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        },
        price: { // Price at time of order
            type: Number,
            required: true
        }
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    customerDetails: {
        name: {
            type: String,
            required: true
        },
        roomNumber: {
            type: String,
            required: true // Assuming room service mostly, or table number
        },
        phone: {
            type: String
        },
        notes: String
    },
    status: {
        type: String,
        enum: ['Pending', 'Preparing', 'Ready', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    paymentStatus: {
        type: String,
        enum: ['Due', 'Paid'],
        default: 'Due'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Order', orderSchema);
