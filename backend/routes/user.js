const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Property = require('../models/Property');
const Chat = require('../models/Chat');
const Plan = require('../models/Plan');
const upload = require('../middleware/upload');

// @route   GET api/user/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password')
            .populate('plan', 'name price features');
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PATCH api/user/update
// @desc    Update user profile
// @access  Private
router.patch('/update', auth, upload.single('image'), async (req, res) => {
    // req.body contains text fields
    // req.body contains text fields
    const { name, phone, password, address, billingAddress } = req.body; // Added billingAddress
    try {
        let user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (address) user.address = address;
        if (billingAddress) {
            // Handle nested object update if sent as object, or if sent as individual fields?
            // Since it's multipart/form-data potentially, usually sent as JSON string if nested.
            // But if we use simple JSON body parser:
            user.billingAddress = billingAddress;
        }
        if (req.file) {
            user.profileImage = `/uploads/${req.file.filename}`;
        }

        // If updating password, hashing is handled by pre-save hook in model if modified
        if (password) user.password = password;

        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/user/plan
// @desc    Get user plan details
// @access  Private
router.get('/plan', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('plan');
        if (!user.plan) {
            // Return dummy FREE plan if null
            return res.json({
                name: 'Free Plan',
                price: 0,
                features: ['Basic Search', 'Contact Agents'],
                status: 'ACTIVE'
            });
        }
        res.json({
            ...user.plan.toObject(),
            status: user.planStatus
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/user/saved
// @desc    Get saved properties
// @access  Private
router.get('/saved', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate({
                path: 'savedProperties',
                select: 'title price location imageUrl type status'
            });
        res.json(user.savedProperties);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST api/user/save/:id
// @desc    Save a property
// @access  Private
router.post('/save/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        // Check if already saved
        if (user.savedProperties.includes(req.params.id)) {
            return res.status(400).json({ message: 'Property already saved' });
        }

        user.savedProperties.push(req.params.id);
        await user.save();
        
        // Increment global saves count
        await Property.findByIdAndUpdate(req.params.id, { $inc: { saves: 1 } });

        res.json(user.savedProperties);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE api/user/save/:id
// @desc    Remove saved property
// @access  Private
router.delete('/save/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.savedProperties = user.savedProperties.filter(
            id => id.toString() !== req.params.id
        );
        await user.save();

        // Decrement global saves count
        await Property.findByIdAndUpdate(req.params.id, { $inc: { saves: -1 } });

        res.json(user.savedProperties);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/user/dashboard-data
// @desc    Get dashboard overview data
// @access  Private
router.get('/dashboard-data', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password')
            .populate('plan')
            .populate('savedProperties', 'title price location imageUrl')
            .populate({
                path: 'viewedProperties.propertyId',
                select: 'title price location imageUrl status type'
            });

        // Recent Chats
        const chats = await Chat.find({ participants: req.user.id })
            .sort({ 'lastMessage.createdAt': -1 })
            .limit(3)
            .populate('participants', 'name role')
            .populate('lastMessage');

        // Format Chats
        const recentChats = chats.map(chat => {
            const otherUser = chat.participants.find(p => p._id.toString() !== req.user.id);
            return {
                _id: chat._id,
                otherUser: otherUser ? { _id: otherUser._id, name: otherUser.name, role: otherUser.role } : { name: 'Unknown' },
                lastMessage: chat.lastMessage ? chat.lastMessage.content : ''
            };
        });

        // Generate Recommendations
        let recommendedProperties = [];
        const viewedPropObjects = user.viewedProperties.filter(vp => vp.propertyId).map(vp => vp.propertyId);
        if (viewedPropObjects.length > 0) {
            const categories = [...new Set(viewedPropObjects.map(p => p.category).filter(c => c))];
            const types = [...new Set(viewedPropObjects.map(p => p.type).filter(t => t))];

            recommendedProperties = await Property.find({
                $or: [
                    { category: { $in: categories } },
                    { type: { $in: types } }
                ],
                _id: { $nin: viewedPropObjects.map(p => p._id) }
            }).limit(3);
        }

        if (recommendedProperties.length === 0) {
            recommendedProperties = await Property.find().limit(3);
        }

        const dashboardData = {
            user: {
                name: user.name,
                email: user.email,
                joinedDate: user.createdAt
            },
            plan: user.plan || { name: 'Free', price: 0 },
            savedCount: user.savedProperties.length,
            recentChats,
            viewedProperties: user.viewedProperties
                .filter(vp => vp.propertyId)
                .sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt))
                .slice(0, 10)
                .map(vp => ({
                    ...vp.propertyId.toObject(),
                    viewedAt: vp.viewedAt
                })),
            recommendedProperties
        };

        res.json(dashboardData);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST api/user/track-view/:id
// @desc    Track property view
// @access  Private
router.post('/track-view/:id', auth, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user.id, {
            $addToSet: {
                viewedProperties: {
                    propertyId: req.params.id,
                    viewedAt: Date.now()
                }
            }
        });
        // We might want to limit array size, but for now simple push is fine. 
        // Note: $addToSet checks uniqueness of whole object which typically differs by date. 
        // Better logic: remove if exists, then push to front.

        const user = await User.findById(req.user.id);
        // Remove existing view of same property
        user.viewedProperties = user.viewedProperties.filter(
            v => v.propertyId.toString() !== req.params.id
        );
        // Add to front
        user.viewedProperties.unshift({
            propertyId: req.params.id,
            viewedAt: Date.now()
        });
        // Limit to 10
        if (user.viewedProperties.length > 10) {
            user.viewedProperties.length = 10;
        }
        await user.save();

        // Increment global views count
        await Property.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
