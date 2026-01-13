const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Property = require('../models/Property');
const Plan = require('../models/Plan');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Middleware to check if user is agent
const agentAuth = (req, res, next) => {
    if (req.user && req.user.role === 'agent') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Agents only.' });
    }
};

// @route   GET api/agent/dashboard-stats
// @desc    Get agent dashboard statistics
// @access  Agent
router.get('/dashboard-stats', [auth, agentAuth], async (req, res) => {
    try {
        const totalProperties = await Property.countDocuments({ owner: req.user.id });
        const activeProperties = await Property.countDocuments({ owner: req.user.id, status: 'Active' });
        const soldProperties = await Property.countDocuments({ owner: req.user.id, status: { $in: ['Sold', 'Rented'] } });

        // Get user to check plan limits
        const user = await User.findById(req.user.id).populate('plan');
        let listingLimit = 0;
        let remainingListings = 0;

        if (user.plan) {
            listingLimit = user.plan.listingLimit;
            // calculated remaining
            remainingListings = Math.max(0, listingLimit - totalProperties);
        }

        res.json({
            properties: {
                total: totalProperties,
                active: activeProperties,
                sold: soldProperties
            },
            plan: {
                limit: listingLimit,
                remaining: remainingListings
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/agent/listings
// @desc    Get all properties for logged in agent
// @access  Agent
router.get('/listings', [auth, agentAuth], async (req, res) => {
    try {
        const properties = await Property.find({ owner: req.user.id }).sort({ createdAt: -1 });
        res.json(properties);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/agent/plan
// @desc    Get agent plan info
// @access  Agent
router.get('/plan', [auth, agentAuth], async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('plan');
        if (!user) return res.status(404).json({ message: 'User not found' });

        const totalProperties = await Property.countDocuments({ owner: req.user.id });

        res.json({
            plan: user.plan,
            usage: {
                used: totalProperties,
                remaining: user.plan ? Math.max(0, user.plan.listingLimit - totalProperties) : 0
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST api/agent/properties
// @desc    Add a property (Agent)
// @access  Agent (Verified & Plan Check)
const uploadMiddleware = (req, res, next) => {
    const uploader = upload.fields([{ name: 'image', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]);
    uploader(req, res, (err) => {
        if (err) {
            console.error('Multer Error:', err);
            return res.status(500).json({ message: 'FileUpload Error', error: err.message });
        }
        next();
    });
};

router.post('/properties', [auth, agentAuth, uploadMiddleware], async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('plan');

        // 1. Check Verification
        if (user.verificationStatus !== 'VERIFIED') {
            return res.status(403).json({ message: 'Your account is not verified yet.' });
        }

        // 2. Check Plan Limit
        const currentCount = await Property.countDocuments({ owner: req.user.id });
        if (user.plan && currentCount >= user.plan.listingLimit) {
            return res.status(403).json({ message: 'Your plan listing limit is reached.' });
        }

        // 3. Process Images
        let imageUrl = req.body.imageUrl || '';
        if (req.files && req.files['image'] && req.files['image'].length > 0) {
            imageUrl = `http://localhost:5000/uploads/${req.files['image'][0].filename}`;
        }

        let images = [];
        if (req.body.galleryUrls) {
            const urls = req.body.galleryUrls.split(',').map(u => u.trim()).filter(u => u);
            images.push(...urls);
        }
        if (req.files && req.files['gallery']) {
            const fileUrls = req.files['gallery'].map(file => `http://localhost:5000/uploads/${file.filename}`);
            images.push(...fileUrls);
        }

        let features = req.body.features;
        if (typeof features === 'string') {
            features = features.split(',').map(f => f.trim()).filter(f => f);
        }

        const propertyData = {
            ...req.body,
            imageUrl,
            images,
            features,
            owner: req.user.id,
            status: 'Active'
        };

        const newProperty = new Property(propertyData);
        await newProperty.save();

        res.json(newProperty);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT api/agent/properties/:id
// @desc    Update property (Agent)
// @access  Agent
router.put('/properties/:id', [auth, agentAuth], async (req, res) => {
    try {
        const { status, title, price, description } = req.body;

        let property = await Property.findById(req.params.id);
        if (!property) return res.status(404).json({ message: 'Property not found' });

        // Check ownership
        if (property.owner.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Update fields
        if (status) property.status = status;
        if (title) property.title = title;
        if (price) property.price = price;
        if (description) property.description = description;

        await property.save();
        res.json(property);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/agent/profile
// @desc    Get current agent profile
// @access  Agent
router.get('/profile', [auth, agentAuth], async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password').populate('plan');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT api/agent/profile
// @desc    Update agent profile
// @access  Agent
router.put('/profile', [auth, agentAuth], async (req, res) => {
    try {
        const { name, phone } = req.body;

        let user = await User.findById(req.user.id);
        if (name) user.name = name;
        if (phone) user.phone = phone;

        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
