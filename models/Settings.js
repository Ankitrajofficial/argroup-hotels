const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    // Singleton identifier
    _id: {
        type: String,
        default: 'site-settings'
    },
    
    // Offer settings
    offerEnabled: {
        type: Boolean,
        default: true
    },
    offerName: {
        type: String,
        default: 'Special Offer'
    },
    offerDiscount: {
        type: Number,
        default: 30
    },
    offerDescription: {
        type: String,
        default: 'Save up to 30% on your next stay • Free breakfast • Room upgrades available'
    },
    offerExpiry: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    },
    offerImage: {
        type: String,
        default: 'images/room1.png' // Default offer image
    },
    
    // Couple section settings
    coupleSectionEnabled: {
        type: Boolean,
        default: true
    },
    
    // Metadata
    updatedAt: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

// Static method to get or create settings
settingsSchema.statics.getSettings = async function() {
    let settings = await this.findById('site-settings');
    if (!settings) {
        settings = await this.create({ _id: 'site-settings' });
    }
    return settings;
};

// Update the updatedAt timestamp on save
settingsSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Settings', settingsSchema);
