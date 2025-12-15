const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Settings = require('../models/Settings');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/admin');

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../images/offers');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with timestamp
        const ext = path.extname(file.originalname);
        cb(null, `offer-${Date.now()}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// @route   GET /api/settings
// @desc    Get site settings (public - for main page)
// @access  Public
router.get('/', async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        
        // Return only public-facing settings
        res.json({
            success: true,
            data: {
                offerEnabled: settings.offerEnabled,
                offerName: settings.offerName,
                offerDiscount: settings.offerDiscount,
                offerDescription: settings.offerDescription,
                offerExpiry: settings.offerExpiry,
                offerImage: settings.offerImage,
                coupleSectionEnabled: settings.coupleSectionEnabled
            }
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching settings'
        });
    }
});

// @route   GET /api/settings/admin
// @desc    Get full settings for admin
// @access  Admin only
router.get('/admin', isAdmin, async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Error fetching admin settings:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching settings'
        });
    }
});

// @route   PUT /api/settings
// @desc    Update site settings
// @access  Admin only
router.put('/', isAdmin, async (req, res) => {
    try {
        const {
            offerEnabled,
            offerName,
            offerDiscount,
            offerDescription,
            offerExpiry,
            coupleSectionEnabled
        } = req.body;

        let settings = await Settings.getSettings();

        // Update fields if provided
        if (typeof offerEnabled === 'boolean') settings.offerEnabled = offerEnabled;
        if (offerName !== undefined) settings.offerName = offerName;
        if (offerDiscount !== undefined) settings.offerDiscount = offerDiscount;
        if (offerDescription !== undefined) settings.offerDescription = offerDescription;
        if (offerExpiry !== undefined) settings.offerExpiry = new Date(offerExpiry);
        if (typeof coupleSectionEnabled === 'boolean') settings.coupleSectionEnabled = coupleSectionEnabled;

        // Track who updated
        settings.updatedBy = req.user._id;

        await settings.save();

        res.json({
            success: true,
            message: 'Settings updated successfully',
            data: settings
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating settings'
        });
    }
});

// @route   POST /api/settings/upload-offer-image
// @desc    Upload offer banner image
// @access  Admin only
router.post('/upload-offer-image', isAdmin, upload.single('offerImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file uploaded'
            });
        }

        // Get relative path for the image
        const imagePath = `images/offers/${req.file.filename}`;

        // Update settings with new image path
        let settings = await Settings.getSettings();
        
        // Delete old image if it exists and isn't the default
        if (settings.offerImage && 
            settings.offerImage !== 'images/room1.png' && 
            settings.offerImage.startsWith('images/offers/')) {
            const oldImagePath = path.join(__dirname, '..', settings.offerImage);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }

        settings.offerImage = imagePath;
        settings.updatedBy = req.user._id;
        await settings.save();

        res.json({
            success: true,
            message: 'Offer image uploaded successfully',
            imagePath: imagePath
        });
    } catch (error) {
        console.error('Error uploading offer image:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading image'
        });
    }
});

module.exports = router;

