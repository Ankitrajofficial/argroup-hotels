const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const validator = require('validator');
const Contact = require('../models/Contact');
const { isAdmin } = require('../middleware/admin');

// ===================================
// Rate Limiting for Contact Form
// Prevents spam: Max 5 submissions per 15 minutes per IP
// ===================================

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    success: false,
    message: 'Too many requests. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ===================================
// Sanitize Input - Prevent XSS
// ===================================

function sanitizeInput(str) {
  if (!str) return '';
  return validator.escape(validator.trim(str));
}

// ===================================
// Public Route - Submit Contact Form
// ===================================

router.post('/submit', contactLimiter, async (req, res) => {
  try {
    let { name, email, phone, subject, message } = req.body;

    // Sanitize all inputs
    name = sanitizeInput(name);
    email = validator.trim(email || '').toLowerCase();
    phone = sanitizeInput(phone);
    subject = sanitizeInput(subject) || 'General Inquiry';
    message = sanitizeInput(message);

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required'
      });
    }

    // Validate name length (prevent abuse)
    if (name.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Name is too long (max 100 characters)'
      });
    }

    // Validate email format
    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    // Validate phone (if provided)
    if (phone && !validator.isMobilePhone(phone, 'any', { strictMode: false })) {
      // Just sanitize, don't reject - phone formats vary
      phone = phone.replace(/[^\d+\-\s()]/g, '');
    }

    // Validate message length
    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Message is too long (max 2000 characters)'
      });
    }

    // Check for spam patterns
    const spamPatterns = [
      /\b(viagra|casino|lottery|winner|prize|free money)\b/i,
      /https?:\/\/[^\s]+/g // URLs in message (optional, can remove if needed)
    ];
    
    const hasSpam = spamPatterns.some(pattern => pattern.test(message));
    if (hasSpam) {
      // Silently reject spam but show success to fool bots
      console.log('Spam detected:', { name, email });
      return res.status(201).json({
        success: true,
        message: 'Your message has been sent successfully!'
      });
    }

    // Create new contact query
    const contact = new Contact({
      name,
      email,
      phone: phone || '',
      subject,
      message
    });

    await contact.save();

    res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully! We will get back to you soon.'
    });

  } catch (error) {
    console.error('Contact submit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again.'
    });
  }
});

// ===================================
// Admin Routes - Manage Contact Queries
// ===================================

// Get all contact queries (Admin only)
router.get('/queries', isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    // Get contacts with pagination
    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Contact.countDocuments(query);

    res.json({
      success: true,
      contacts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalContacts: total,
        hasPrev: page > 1,
        hasNext: page < Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact queries'
    });
  }
});

// Get single contact by ID (Admin only)
router.get('/query/:id', isAdmin, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    res.json({
      success: true,
      contact
    });
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact'
    });
  }
});

// Get contact stats (Admin only)
router.get('/stats', isAdmin, async (req, res) => {
  try {
    const total = await Contact.countDocuments();
    const pending = await Contact.countDocuments({ status: 'pending' });
    const inProgress = await Contact.countDocuments({ status: 'in-progress' });
    const resolved = await Contact.countDocuments({ status: 'resolved' });

    // Today's queries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await Contact.countDocuments({
      createdAt: { $gte: today }
    });

    res.json({
      success: true,
      stats: {
        total,
        pending,
        inProgress,
        resolved,
        today: todayCount
      }
    });

  } catch (error) {
    console.error('Contact stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats'
    });
  }
});

// Update contact status (Admin only)
router.put('/:id/status', isAdmin, async (req, res) => {
  try {
    const { status, notes } = req.body;

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { 
        status, 
        notes: notes || '',
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact query not found'
      });
    }

    res.json({
      success: true,
      message: 'Status updated successfully',
      contact
    });

  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status'
    });
  }
});

// Delete contact query (Admin only)
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact query not found'
      });
    }

    res.json({
      success: true,
      message: 'Contact query deleted successfully'
    });

  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete contact query'
    });
  }
});

module.exports = router;
