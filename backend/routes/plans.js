const express = require('express');
const router = express.Router();
const Plan = require('../models/Plan');
const auth = require('../middleware/auth');

const adminAuth = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admin only.' });
    }
};

// @route   GET api/plans/user
// @desc    Get all user plans
// @access  Public
router.get('/user', async (req, res) => {
    try {
        const plans = await Plan.find({ role: 'user', isActive: true });
        res.json(plans);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// @route   GET api/plans/agent
// @desc    Get all agent plans
// @access  Public
router.get('/agent', async (req, res) => {
    try {
        const plans = await Plan.find({ role: 'agent', isActive: true });
        res.json(plans);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// @route   GET api/plans
// @desc    Get all plans
// @access  Public (or semi-public)
router.get('/', async (req, res) => {
    try {
        const plans = await Plan.find();
        res.json(plans);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// @route   GET api/plans/:id
// @desc    Get single plan
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const plan = await Plan.findById(req.params.id);
        if (!plan) return res.status(404).json({ message: 'Plan not found' });
        res.json(plan);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// @route   POST api/plans
// @desc    Create a plan

// @access  Admin
router.post('/', [auth, adminAuth], async (req, res) => {
    const { name, role, price, currency, listingLimit, chatLimit, features } = req.body;
    try {
        const newPlan = new Plan({ name, role, price, currency, listingLimit, chatLimit, features });
        const plan = await newPlan.save();
        res.json(plan);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// @route   PUT api/plans/:id
// @desc    Update a plan
// @access  Admin
router.put('/:id', [auth, adminAuth], async (req, res) => {
    const { name, price, listingLimit, chatLimit, features, isActive } = req.body;
    try {
        let plan = await Plan.findById(req.params.id);
        if (!plan) return res.status(404).json({ message: 'Plan not found' });

        plan.name = name || plan.name;
        plan.price = price !== undefined ? price : plan.price;
        plan.listingLimit = listingLimit !== undefined ? listingLimit : plan.listingLimit;
        plan.chatLimit = chatLimit !== undefined ? chatLimit : plan.chatLimit;
        plan.features = features || plan.features;
        plan.isActive = isActive !== undefined ? isActive : plan.isActive;

        await plan.save();
        res.json(plan);
    } catch (err) {
        res.status(500).send('Server error');
    }
});


// @route   POST api/plans/cancel
// @desc    Cancel current plan
// @access  Private
router.post('/cancel', auth, async (req, res) => {
    try {
        const user = await require('../models/User').findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!user.plan || user.planStatus !== 'ACTIVE') {
            return res.status(400).json({ message: 'No active plan to cancel' });
        }

        user.planStatus = 'EXPIRED'; // Or CANCELLED
        user.planExpiryDate = new Date(); // Expire immediately or keep until end of term? 
        // User request "can cancel plan". Immediate cancellation is simplest for now.

        await user.save();
        res.json({ message: 'Plan cancelled successfully', user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
