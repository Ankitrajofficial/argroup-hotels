const express = require('express');
const router = express.Router();
const Menu = require('../models/Menu');
const { protect, isAdmin } = require('../middleware/auth');

// GET /api/menu - Public: Get all available menu items
router.get('/', async (req, res) => {
    try {
        const items = await Menu.find({ isAvailable: true }).sort({ category: 1, name: 1 });
        res.json(items);
    } catch (error) {
        console.error('Error fetching menu:', error);
        res.status(500).json({ message: 'Server error fetching menu' });
    }
});

// GET /api/menu/all - Admin: Get all items including unavailable
router.get('/all', protect, isAdmin, async (req, res) => {
    try {
        const items = await Menu.find({}).sort({ createdAt: -1 });
        res.json(items);
    } catch (error) {
        console.error('Error fetching all menu items:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/menu - Admin: Add new item
router.post('/', protect, isAdmin, async (req, res) => {
    try {
        const { name, category, price, description, image, isVegetarian } = req.body;
        
        const newItem = new Menu({
            name,
            category,
            price,
            description,
            image,
            isVegetarian
        });

        const savedItem = await newItem.save();
        res.status(201).json(savedItem);
    } catch (error) {
        console.error('Error adding menu item:', error);
        res.status(500).json({ message: 'Error adding item' });
    }
});

// PUT /api/menu/:id - Admin: Update item
router.put('/:id', protect, isAdmin, async (req, res) => {
    try {
        const { name, category, price, description, image, isAvailable, isVegetarian } = req.body;
        
        const updatedItem = await Menu.findByIdAndUpdate(
            req.params.id,
            { name, category, price, description, image, isAvailable, isVegetarian },
            { new: true, runValidators: true }
        );

        if (!updatedItem) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.json(updatedItem);
    } catch (error) {
        console.error('Error updating menu item:', error);
        res.status(500).json({ message: 'Error updating item' });
    }
});

// DELETE /api/menu/:id - Admin: Delete item
router.delete('/:id', protect, isAdmin, async (req, res) => {
    try {
        const deletedItem = await Menu.findByIdAndDelete(req.params.id);
        
        if (!deletedItem) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.json({ message: 'Item removed' });
    } catch (error) {
        console.error('Error deleting menu item:', error);
        res.status(500).json({ message: 'Error deleting item' });
    }
});

module.exports = router;
