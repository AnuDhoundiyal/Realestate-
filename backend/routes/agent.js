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

        if (user && user.plan) {
            listingLimit = user.plan.listingLimit;
            // calculated remaining
            remainingListings = Math.max(0, listingLimit - totalProperties);
        }

        // Group properties by status for this agent
        const allProperties = await Property.find({ owner: req.user.id }, '_id title type status');

        const propMap = {};
        allProperties.forEach(p => {
            propMap[p._id.toString()] = {
                title: p.title,
                type: p.type || 'Other',
                status: p.status,
                saves: 0,
                views: 0
            };
        });

        const allUsers = await User.find({}, 'savedProperties viewedProperties');
        allUsers.forEach(u => {
            if (u.savedProperties) {
                u.savedProperties.forEach(pid => {
                    const idStr = pid.toString();
                    if (propMap[idStr]) propMap[idStr].saves++;
                });
            }
            if (u.viewedProperties) {
                u.viewedProperties.forEach(vp => {
                    if (vp.propertyId) {
                        const vpStr = vp.propertyId.toString();
                        if (propMap[vpStr]) propMap[vpStr].views++;
                    }
                });
            }
        });

        // Properties by Status
        const propertiesByStatusMap = {};
        Object.values(propMap).forEach(p => {
            propertiesByStatusMap[p.status] = (propertiesByStatusMap[p.status] || 0) + 1;
        });
        const propertiesByStatus = Object.keys(propertiesByStatusMap).map(k => ({ _id: k, count: propertiesByStatusMap[k] }));

        // Wishlist by Property Type
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
            .sort((a, b) => (b.saves - a.saves) || (b.views - a.views))
            .slice(0, 6)
            .map(p => ({
                title: p.title,
                type: p.type,
                saves: p.saves,
                views: p.views
            }));

        res.json({
            properties: {
                total: totalProperties,
                active: activeProperties,
                sold: soldProperties,
                byStatus: propertiesByStatus,
                wishlistByType: wishlistByType,
                topInterested: topInterested
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
            imageUrl = `/uploads/${req.files['image'][0].filename}`;
        }

        let images = [];
        if (req.body.galleryUrls) {
            const urls = req.body.galleryUrls.split(',').map(u => u.trim()).filter(u => u);
            images.push(...urls);
        }
        if (req.files && req.files['gallery']) {
            const fileUrls = req.files['gallery'].map(file => `/uploads/${file.filename}`);
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
router.put('/properties/:id', [auth, agentAuth, uploadMiddleware], async (req, res) => {
    try {
        let property = await Property.findById(req.params.id);
        if (!property) return res.status(404).json({ message: 'Property not found' });

        // Check ownership
        if (property.owner.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Handle Images
        if (req.files && req.files['image'] && req.files['image'].length > 0) {
            property.imageUrl = `/uploads/${req.files['image'][0].filename}`;
        } else if (req.body.imageUrl && req.body.imageUrl !== property.imageUrl) {
            property.imageUrl = req.body.imageUrl;
        }

        // Handle Gallery
        let currentImages = property.images || [];
        if (req.body.existingImages) {
            // If we have a list of images to keep
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
        console.error('Agent Update Error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// @route   PATCH api/agent/properties/:id/status
// @desc    Update property status (Agent)
router.patch('/properties/:id/status', [auth, agentAuth], async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) return res.status(404).json({ message: 'Property not found' });

        // Check ownership
        if (property.owner.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

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

// @route   DELETE api/agent/properties/:id
// @desc    Delete own property
router.delete('/properties/:id', [auth, agentAuth], async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) return res.status(404).json({ message: 'Property not found' });

        // Ownership check
        if (property.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        await Property.findByIdAndDelete(req.params.id);
        res.json({ message: 'Property deleted' });
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
