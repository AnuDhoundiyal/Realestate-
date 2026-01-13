const mongoose = require('mongoose');
const Property = require('./models/Property');

mongoose.connect('mongodb://127.0.0.1:27017/realestate')
    .then(async () => {
        console.log('MongoDB Connected for Seeding');

        await Property.deleteMany({});

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
                area: 4500
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
                area: 1200
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
                area: 1800
            }
        ];

        await Property.insertMany(properties);
        console.log('Data Seeded');
        mongoose.connection.close();
    })
    .catch(err => {
        console.error(err);
        mongoose.connection.close();
    });
