const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Property = require('../models/Property');
const Plan = require('../models/Plan');

// Middleware to check if user is admin
const auth = require('../middleware/auth'); // assuming we'll create or extract this
const adminAuth = async (req, res, next) => {
    // This should potentially be in a separate middleware file but for now inline or require
    // Need to ensure verifyToken is available or logic is here
    // Assuming auth middleware adds req.user
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admin only.' });
    }
};

const upload = require('../middleware/upload');

// @route   GET api/admin/dashboard-stats
// @desc    Get dashboard statistics
// @access  Admin
router.get('/dashboard-stats', [auth, adminAuth], async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalAgents = await User.countDocuments({ role: 'agent' });
        const verifiedAgents = await User.countDocuments({ role: 'agent', verificationStatus: 'VERIFIED' });
        const pendingAgents = await User.countDocuments({ role: 'agent', verificationStatus: 'PENDING' });
        const totalProperties = await Property.countDocuments();

        // Fetch properties with pre-calculated views and saves
        const allProps = await Property.find({}, '_id title type status views saves');
        const propMap = {};
        allProps.forEach(p => {
            propMap[p._id.toString()] = {
                title: p.title,
                type: p.type || 'Other',
                status: p.status,
                saves: p.saves || 0,
                views: p.views || 0
            };
        });

        // We still fetch users if we need other user-specific metrics, 
        // but for property popularity we now have direct fields.

        // Group wishlist by property type
        const wishlistByTypeMap = {};
        Object.values(propMap).forEach(p => {
            if (p.saves > 0) {
                wishlistByTypeMap[p.type] = (wishlistByTypeMap[p.type] || 0) + p.saves;
            }
        });
        const wishlistByType = Object.keys(wishlistByTypeMap).map(k => ({ _id: k, count: wishlistByTypeMap[k] }));

        // Top Interested Properties
        const topInterested = Object.values(propMap)
            .filter(p => p.saves > 0 || p.views > 0)
            .sort((a, b) => b.saves - a.saves || b.views - a.views)
            .slice(0, 6)
            .map(p => ({
                title: p.title,
                type: p.type,
                saves: p.saves,
                views: p.views
            }));

        res.json({
            users: { total: totalUsers },
            agents: { total: totalAgents, verified: verifiedAgents, pending: pendingAgents },
            properties: {
                total: totalProperties,
                wishlistByType: wishlistByType,
                topInterested: topInterested
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/admin/users
// @desc    Get all users (role=user)
// @access  Admin
router.get('/users', [auth, adminAuth], async (req, res) => {
    try {
        const users = await User.find({ role: 'user' }).populate('plan').select('-password');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/admin/users/:id
// @desc    Get user by ID with their properties
// @access  Admin
router.get('/users/:id', [auth, adminAuth], async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('plan');
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Fetch properties owned by this user
        const properties = await Property.find({ owner: req.params.id });
        
        // Return user with property list
        const userData = user.toObject();
        userData.properties = properties;

        res.json(userData);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/admin/agents
// @desc    Get all agents
// @access  Admin
router.get('/agents', [auth, adminAuth], async (req, res) => {
    try {
        const agents = await User.find({ role: 'agent' }).populate('plan').select('-password');
        res.json(agents);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT api/admin/verify-agent/:id
// @desc    Verify or Reject agent
// @access  Admin
router.put('/verify-agent/:id', [auth, adminAuth], async (req, res) => {
    const { status } = req.body; // VERIFIED or REJECTED
    try {
        let agent = await User.findById(req.params.id);
        if (!agent) return res.status(404).json({ message: 'Agent not found' });
        if (agent.role !== 'agent') return res.status(400).json({ message: 'User is not an agent' });

        agent.verificationStatus = status;
        await agent.save();
        res.json(agent);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/admin/properties
// @desc    Get all properties with owner info
// @access  Admin
router.get('/properties', [auth, adminAuth], async (req, res) => {
    try {
        const properties = await Property.find().populate('owner', 'name email role');
        res.json(properties);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST api/admin/properties
// @desc    Add a property as admin
// @access  Admin
// Multer Wrapper to catch usage errors
const uploadMiddleware = (req, res, next) => {
    const uploader = upload.fields([{ name: 'image', maxCount: 1 }, { name: 'gallery', maxCount: 10 }]);
    uploader(req, res, (err) => {
        if (err) {
            const fs = require('fs');
            fs.appendFileSync('multer_error.txt', `\n[${new Date().toISOString()}] Multer Error: ${err.message}\n`);
            console.error('Multer Error:', err);
            return res.status(500).json({ message: 'FileUpload Error', error: err.message });
        }
        next();
    });
};

// @route   POST api/admin/properties
router.post('/properties', [auth, adminAuth, uploadMiddleware], async (req, res) => {
    try {
        console.log('--- Add Property Request ---');
        console.log('User:', req.user);
        // req.body and req.files are now populated

        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'User not authenticated or ID missing' });
        }

        // 1. Handle Main Image
        let imageUrl = req.body.imageUrl || '';
        if (req.files && req.files['image'] && req.files['image'].length > 0) {
            imageUrl = `/uploads/${req.files['image'][0].filename}`;
        }

        // 2. Handle Gallery Images
        let images = [];
        if (req.body.galleryUrls) {
            const urls = req.body.galleryUrls.split(',').map(u => u.trim()).filter(u => u);
            images.push(...urls);
        }
        if (req.files && req.files['gallery']) {
            const fileUrls = req.files['gallery'].map(file => `/uploads/${file.filename}`);
            images.push(...fileUrls);
        }

        // 3. Handle Features
        let features = req.body.features;
        if (typeof features === 'string') {
            features = features.split(',').map(f => f.trim()).filter(f => f);
        } else if (!features) {
            features = [];
        }

        // 4. Create Property
        const propertyData = {
            ...req.body,
            imageUrl,
            images,
            features,
            owner: req.user.id
        };
        console.log('Property Data to Save:', propertyData);

        const newProperty = new Property(propertyData);

        const property = await newProperty.save();
        console.log('Property Saved Successfully:', property._id);
        res.json(property);
    } catch (err) {
        const fs = require('fs');
        fs.appendFileSync('error_log.txt', `\n[${new Date().toISOString()}] Error adding property: ${err.message}\nStack: ${err.stack}\n`);
        console.error('CRITICAL ERROR adding property:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// @route   PUT api/admin/properties/:id
// @desc    Update any property (Admin)
router.put('/properties/:id', [auth, adminAuth, uploadMiddleware], async (req, res) => {
    try {
        let property = await Property.findById(req.params.id);
        if (!property) return res.status(404).json({ message: 'Property not found' });

        // Handle Images
        if (req.files && req.files['image'] && req.files['image'].length > 0) {
            property.imageUrl = `/uploads/${req.files['image'][0].filename}`;
        } else if (req.body.imageUrl && req.body.imageUrl !== property.imageUrl) {
            property.imageUrl = req.body.imageUrl;
        }

        // Handle Gallery
        let currentImages = property.images || [];
        if (req.body.existingImages) {
            const toKeep = JSON.parse(req.body.existingImages);
            currentImages = toKeep;
        }
        
        if (req.files && req.files['gallery']) {
            const newFileUrls = req.files['gallery'].map(file => `/uploads/${file.filename}`);
            currentImages.push(...newFileUrls);
        }
        property.images = currentImages;

        // Handle Features
        let features = req.body.features;
        if (typeof features === 'string') {
            features = features.split(',').map(f => f.trim()).filter(f => f);
            property.features = features;
        }

        // Simple Fields
        const fields = ['title', 'description', 'location', 'type', 'category', 'status'];
        fields.forEach(field => {
            if (req.body[field] !== undefined) {
                property[field] = req.body[field];
            }
        });

        // Numeric Fields
        const numFields = ['price', 'bedrooms', 'bathrooms', 'area'];
        numFields.forEach(field => {
            if (req.body[field] !== undefined && req.body[field] !== '' && req.body[field] !== 'null') {
                const val = Number(req.body[field]);
                if (!isNaN(val)) property[field] = val;
            }
        });

        await property.save();
        res.json(property);
    } catch (err) {
        console.error('Update Error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// @route   PATCH api/admin/properties/:id/status
// @desc    Update property status (Admin)
router.patch('/properties/:id/status', [auth, adminAuth], async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) return res.status(404).json({ message: 'Property not found' });

        if (req.body.status) {
            property.status = req.body.status;
            await property.save();
        }
        res.json(property);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE api/admin/properties/:id
// @desc    Delete any property (Admin)
router.delete('/properties/:id', [auth, adminAuth], async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) return res.status(404).json({ message: 'Property not found' });

        await Property.findByIdAndDelete(req.params.id);
        res.json({ message: 'Property deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
