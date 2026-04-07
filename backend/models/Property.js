const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    location: { type: String, required: true },
    type: { type: String, required: true }, // Sale / Rent
    category: { type: String, required: true }, // Villa, Apartment, etc.
    imageUrl: { type: String }, // Can be optional if using images array or handled in logic
    images: [{ type: String }], // Gallery
    features: [{ type: String }],
    bedrooms: { type: Number },
    bathrooms: { type: Number },
    area: { type: Number }, // in sq ft
    status: { type: String, enum: ['Active', 'Sold', 'Rented', 'Hidden'], default: 'Active' },

    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    views: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Property', PropertySchema);
