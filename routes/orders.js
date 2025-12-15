const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { protect, isAdmin } = require('../middleware/auth');

// POST /api/orders - Public: Submit new order
router.post('/', async (req, res) => {
    try {
        const { items, totalAmount, customerDetails } = req.body;
        
        // Basic validation
        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'Order must contain items' });
        }
        if (!customerDetails || !customerDetails.name || !customerDetails.roomNumber) {
            return res.status(400).json({ message: 'Customer details required' });
        }

        const newOrder = new Order({
            items,
            totalAmount,
            customerDetails
        });

        const savedOrder = await newOrder.save();
        res.status(201).json(savedOrder);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Error placing order' });
    }
});

// GET /api/orders - Admin: Get all orders
router.get('/', protect, isAdmin, async (req, res) => {
    try {
        const orders = await Order.find({}).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Server error fetching orders' });
    }
});

// PUT /api/orders/:id/status - Admin: Update order status
router.put('/:id/status', protect, isAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        
        const validStatuses = ['Pending', 'Preparing', 'Ready', 'Delivered', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(updatedOrder);
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Error updating status' });
    }
});

module.exports = router;
