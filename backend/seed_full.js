const mongoose = require('mongoose');
const Property = require('./models/Property');
const User = require('./models/User');
const Plan = require('./models/Plan');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://127.0.0.1:27017/realestate')
    .then(async () => {
        console.log('MongoDB Connected for Seeding');

        // Clear existing data
        await Property.deleteMany({});
        await User.deleteMany({});
        await Plan.deleteMany({});

        // Create Plans
        const plansValues = [
            { name: 'Basic', role: 'user', price: 0, currency: 'USD', features: ['Search Properties'] },
            { name: 'Pro Agent', role: 'agent', price: 49, currency: 'USD', features: ['Unlimited Listings', 'Verified Badge'], listingLimit: 50 }
        ];
        const plans = await Plan.insertMany(plansValues);
        console.log('Plans created');

        // Create Users
        const salt = await bcrypt.genSalt(10);
        const adminHash = await bcrypt.hash('admin123', salt);
        const userHash = await bcrypt.hash('user123', salt);
        const agentHash = await bcrypt.hash('agent123', salt);

        const users = [
            {
                name: "Admin User",
                email: "admin@example.com",
                password: adminHash, // Using pre-hashed to avoid schema pre-save issues if inserting raw or just cleaner
                role: "admin"
            },
            {
                name: "John Doe",
                email: "user@example.com",
                password: userHash,
                role: "user",
                plan: plans[0]._id
            },
            {
                name: "Jane Smith",
                email: "agent@example.com",
                password: agentHash,
                role: "agent",
                verificationStatus: 'PENDING',
                plan: plans[1]._id
            }
        ];

        // Note: insertMany doesn't trigger pre('save') middleware by default? 
        // Actually it DOES NOT trigger pre-save hooks in Mongoose. 
        // But since I hashed manually above, it's fine.
        // Wait, if I use new properties matching updated schema...

        const createdUsers = await User.insertMany(users);
        console.log('Users created');

        const agentUser = createdUsers.find(u => u.role === 'agent');
        const adminUser = createdUsers.find(u => u.role === 'admin');

        // Create Properties
        const properties = [
            {
                title: "Luxury Villa in Beverly Hills",
                description: "A stunning 5-bedroom villa with a pool and breathtaking views.",
                price: 4500000,
                location: "Beverly Hills, CA",
                type: "Sale",
                imageUrl: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1000&q=80",
                images: [
                    "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1000&q=80",
                    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1000&q=80"
                ],
                features: ["Pool", "Garden", "Garage", "Smart Home"],
                bedrooms: 5,
                bathrooms: 4,
                area: 4500,
                owner: agentUser._id
            },
            {
                title: "Modern Apartment in Downtown",
                description: "Chic 2-bedroom apartment in the heart of the city.",
                price: 850000,
                location: "New York, NY",
                type: "Sale",
                imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80",
                features: ["Gym", "Concierge", "Rooftop"],
                bedrooms: 2,
                bathrooms: 2,
                area: 1200,
                owner: agentUser._id
            },
            {
                title: "Cozy Cottage",
                description: "Perfect getaway cottage surrounded by nature.",
                price: 3500,
                location: "Aspen, CO",
                type: "Rent",
                imageUrl: "https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=1000&q=80",
                features: ["Fireplace", "Mountain View"],
                bedrooms: 3,
                bathrooms: 2,
                area: 1800,
                owner: adminUser._id
            }
        ];

        await Property.insertMany(properties);
        console.log('Properties Seeded');
        mongoose.connection.close();
    })
    .catch(err => {
        console.error(err);
        mongoose.connection.close();
    });
