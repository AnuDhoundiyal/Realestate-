const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'agent', 'admin'], default: 'user' },
    phone: { type: String },
    verificationStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' }, // Mainly for Agents
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
    planStatus: { type: String, enum: ['ACTIVE', 'EXPIRED'], default: 'ACTIVE' },
    planStartDate: { type: Date },
    planExpiryDate: { type: Date },
    savedProperties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }],
    viewedProperties: [{
        propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
        viewedAt: { type: Date, default: Date.now }
    }],
    hasReceivedWelcomeMessage: { type: Boolean, default: false },
    profileImage: { type: String },
    address: { type: String }, // General address
    billingAddress: { // Structural billing details
        fullName: String,
        addressLine: String,
        city: String,
        state: String,
        pincode: String
    },
    createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
