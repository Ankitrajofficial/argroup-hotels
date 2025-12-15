const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String, // e.g., 'Starters', 'Main Course', 'Desserts', 'Beverages'
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        trim: true
    },
    image: {
        type: String, // URL or path to image
        default: 'images/menu-placeholder.png'
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    isVegetarian: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Menu', menuSchema);
