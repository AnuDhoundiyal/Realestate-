const mongoose = require('mongoose');
const Plan = require('./models/Plan');
require('dotenv').config();

mongoose.connect('mongodb://127.0.0.1:27017/realestate')
    .then(async () => {
        const count = await Plan.countDocuments();
        if (count === 0) {
            console.log('Seeding plans...');
            const plans = [
                { name: 'Basic User', role: 'user', price: 0, currency: 'USD', features: ['Browser Properties', 'Contact 5 Agents/Day'], chatLimit: 5, listingLimit: 0 },
                { name: 'Premium User', role: 'user', price: 19, currency: 'USD', features: ['Unlimited Contacts', 'Save Unlimited Properties', 'Priority Support'], chatLimit: 100, listingLimit: 0 },
                { name: 'Starter Agent', role: 'agent', price: 49, currency: 'USD', features: ['5 Active Listings', 'Basic Analytics', 'Standard Support'], chatLimit: 50, listingLimit: 5 },
                { name: 'Pro Agent', role: 'agent', price: 99, currency: 'USD', features: ['20 Active Listings', 'Featured Listings', 'Advanced Analytics'], chatLimit: 200, listingLimit: 20 },
                { name: 'Enterprise Agent', role: 'agent', price: 199, currency: 'USD', features: ['Unlimited Listings', 'Team Accounts', 'API Access', 'Dedicated Manager'], chatLimit: 10000, listingLimit: 1000 }
            ];
            await Plan.insertMany(plans);
            console.log('Plans seeded!');
        } else {
            console.log('Plans already exist.');
        }
        mongoose.disconnect();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
