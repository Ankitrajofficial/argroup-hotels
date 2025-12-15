// ===================================
// Authentication Routes
// ===================================

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { OAuth2Client } = require('google-auth-library');

// Google OAuth Client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ===================================
// Helper: Generate JWT Token
// ===================================

const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: '30d' } // Token valid for 30 days
    );
};

// ===================================
// Helper: Send Token Response
// ===================================

const sendTokenResponse = (user, statusCode, res, message) => {
    const token = generateToken(user._id);
    
    // Cookie options
    const cookieOptions = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        httpOnly: true, // Prevents XSS attacks
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'strict'
    };
    
    res.status(statusCode)
        .cookie('token', token, cookieOptions)
        .json({
            success: true,
            message,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone
            }
        });
};

// ===================================
// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
// ===================================

router.post('/signup', [
    // Validation rules
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('email')
        .trim()
        .isEmail().withMessage('Please enter a valid email')
        .normalizeEmail(),
    body('phone')
        .trim()
        .notEmpty().withMessage('Phone number is required')
        .isLength({ min: 10 }).withMessage('Phone must be at least 10 digits'),
    body('password')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg,
                errors: errors.array()
            });
        }
        
        const { name, email, phone, password } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'An account with this email already exists'
            });
        }
        
        // Create new user
        const user = await User.create({
            name,
            email: email.toLowerCase(),
            phone,
            password
        });
        
        // Send token response
        sendTokenResponse(user, 201, res, 'Account created successfully! Welcome to Hotel Ortus.');
        
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating account. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ===================================
// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
// ===================================

router.post('/login', [
    body('email')
        .trim()
        .isEmail().withMessage('Please enter a valid email')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg,
                errors: errors.array()
            });
        }
        
        const { email, password } = req.body;
        
        // Find user by email (include password field)
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        // Check password
        const isMatch = await user.comparePassword(password);
        
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        // Send token response
        sendTokenResponse(user, 200, res, `Welcome back, ${user.name}!`);
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error signing in. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ===================================
// @route   POST /api/auth/logout
// @desc    Logout user & clear cookie
// @access  Private
// ===================================

router.post('/logout', (req, res) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000), // Expires in 10 seconds
        httpOnly: true
    });
    
    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
});

// ===================================
// @route   GET /api/auth/me
// @desc    Get current logged-in user
// @access  Private
// ===================================

router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user data'
        });
    }
});

// ===================================
// @route   GET /api/auth/check
// @desc    Check if user is logged in (for frontend)
// @access  Public
// ===================================

router.get('/check', async (req, res) => {
    let token = req.cookies.token;
    
    if (!token) {
        return res.json({
            success: true,
            loggedIn: false,
            user: null
        });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.json({
                success: true,
                loggedIn: false,
                user: null
            });
        }
        
        res.json({
            success: true,
            loggedIn: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        res.json({
            success: true,
            loggedIn: false,
            user: null
        });
    }
});

// ===================================
// @route   POST /api/auth/google
// @desc    Authenticate with Google
// @access  Public
// ===================================

router.post('/google', async (req, res) => {
    try {
        const { credential } = req.body;
        
        if (!credential) {
            return res.status(400).json({
                success: false,
                message: 'Google credential is required'
            });
        }
        
        // Verify the Google ID token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        
        const payload = ticket.getPayload();
        const { email, name, sub: googleId } = payload;
        
        // Check if user exists
        let user = await User.findOne({ email: email.toLowerCase() });
        
        if (user) {
            // User exists, log them in
            sendTokenResponse(user, 200, res, `Welcome back, ${user.name}!`);
        } else {
            // Create new user (no password needed for Google users)
            user = await User.create({
                name,
                email: email.toLowerCase(),
                phone: 'Google User', // Placeholder for Google users
                password: googleId + process.env.JWT_SECRET, // Random secure password
                googleId
            });
            
            sendTokenResponse(user, 201, res, `Welcome to Hotel Ortus, ${name}!`);
        }
        
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({
            success: false,
            message: 'Google authentication failed. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ===================================
// @route   GET /api/auth/google/callback
// @desc    Handle Google OAuth callback
// @access  Public
// ===================================

router.get('/google/callback', async (req, res) => {
    try {
        const { code, error } = req.query;
        
        if (error) {
            return res.send(`
                <script>
                    window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', message: 'Google sign-in was cancelled' }, '*');
                    window.close();
                </script>
            `);
        }
        
        if (!code) {
            return res.send(`
                <script>
                    window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', message: 'Authorization code missing' }, '*');
                    window.close();
                </script>
            `);
        }
        
        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: `${req.protocol}://${req.get('host')}/api/auth/google/callback`,
                grant_type: 'authorization_code'
            })
        });
        
        const tokens = await tokenResponse.json();
        
        if (tokens.error) {
            console.error('Token exchange error:', tokens);
            return res.send(`
                <script>
                    window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', message: 'Failed to exchange authorization code' }, '*');
                    window.close();
                </script>
            `);
        }
        
        // Get user info from Google
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${tokens.access_token}`
            }
        });
        
        const googleUser = await userInfoResponse.json();
        const { email, name, id: googleId } = googleUser;
        
        // Check if user exists in our database
        let user = await User.findOne({ email: email.toLowerCase() });
        
        let message;
        if (user) {
            message = `Welcome back, ${user.name}!`;
        } else {
            // Create new user
            user = await User.create({
                name,
                email: email.toLowerCase(),
                phone: 'Google User',
                password: googleId + process.env.JWT_SECRET,
                googleId
            });
            message = `Welcome to Hotel Ortus, ${name}!`;
        }
        
        // Generate JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        
        // Set cookie
        res.cookie('token', token, {
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        
        // Send success message to parent window
        res.send(`
            <script>
                window.opener.postMessage({
                    type: 'GOOGLE_AUTH_SUCCESS',
                    message: '${message}',
                    user: {
                        id: '${user._id}',
                        name: '${user.name}',
                        email: '${user.email}'
                    }
                }, '*');
                window.close();
            </script>
        `);
        
    } catch (error) {
        console.error('Google callback error:', error);
        res.send(`
            <script>
                window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', message: 'Authentication failed. Please try again.' }, '*');
                window.close();
            </script>
        `);
    }
});

module.exports = router;
