const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Plan = require('../models/Plan');
const auth = require('../middleware/auth');

// @route   POST api/payment/activate-plan
// @desc    Simulate payment and activate plan for user/agent
// @access  Private
router.post('/activate-plan', auth, async (req, res) => {
    const { planId, paymentMeta } = req.body;

    try {
        // Find Local User
        let user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find Plan
        const plan = await Plan.findById(planId);
        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        // Validate Role (Optional: Check if user role matches plan role)
        // if (user.role !== plan.role) ...

        // Update User Plan Details
        user.plan = plan._id;
        user.planStatus = 'ACTIVE';
        user.planStartDate = new Date();

        // Calculate Expiry (Default 30 days)
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        user.planExpiryDate = expiryDate;

        await user.save();

        // Return success with updated user info
        // Populate plan to return full details if needed
        await user.populate('plan');

        res.json({
            success: true,
            message: 'Plan activated successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    plan: user.plan,
                    planStatus: user.planStatus,
                    planStartDate: user.planStartDate,
                    planExpiryDate: user.planExpiryDate
                }
            }
        });

    } catch (err) {
        console.error('Payment Activation Error:', err);
        res.status(500).json({ message: 'Server error during plan activation' });
    }
});

module.exports = router;
