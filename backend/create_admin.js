const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://127.0.0.1:27017/realestate')
    .then(async () => {
        console.log('MongoDB Connected');
        // Create or update admin
        const adminEmail = 'admin@example.com';
        let admin = await User.findOne({ email: adminEmail });

        if (!admin) {
            console.log('Creating new admin...');
            admin = new User({
                name: 'Super Admin',
                email: adminEmail,
                password: 'password123', // Will be hashed by pre-save
                role: 'admin'
            });
            await admin.save();
            console.log('Admin created.');
        } else {
            console.log('Updating existing admin role...');
            admin.role = 'admin';
            // Reset password if needed? Let's just update role.
            await admin.save();
            console.log('Admin updated.');
        }

        mongoose.connection.close();
    })
    .catch(err => {
        console.error(err);
        mongoose.connection.close();
    });
