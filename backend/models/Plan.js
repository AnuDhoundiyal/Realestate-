const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema({
    name: { type: String, required: true }, // e.g., 'Basic', 'Pro', 'Enterprise'
    role: { type: String, enum: ['user', 'agent'], required: true }, // Plan for User or Agent
    price: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    listingLimit: { type: Number, default: 0 }, // For agents
    chatLimit: { type: Number, default: 10 }, // Messages per day or total? Let's say per day for now, or just limit contact attempts.
    features: [{ type: String }], // List of features enabled
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Plan', PlanSchema);
