const express = require('express');
const router = express.Router();
const Property = require('../models/Property');

// GET all properties
router.get('/', async (req, res) => {
    try {
        const properties = await Property.find({ 
            status: 'Active'
        });
        res.json(properties);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET one property
router.get('/:id', async (req, res) => {
    try {
        const property = await Property.findById(req.params.id).populate('owner', 'name email phone role');
        if (!property) return res.status(404).json({ message: 'Property not found' });
        res.json(property);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Increment property view count (Public)
router.post('/:id/view', async (req, res) => {
    try {
        const property = await Property.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true });
        if (!property) return res.status(404).json({ message: 'Property not found' });
        res.json({ views: property.views });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create property (for seeding/testing)
router.post('/', async (req, res) => {
    const property = new Property(req.body);
    try {
        const newProperty = await property.save();
        res.status(201).json(newProperty);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
