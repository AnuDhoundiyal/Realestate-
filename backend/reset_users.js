const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://127.0.0.1:27017/realestate')
    .then(async () => {
        console.log('MongoDB Connected for User Reset');

        // Helper to upsert user
        const upsertUser = async (name, email, password, role) => {
            let user = await User.findOne({ email });
            if (user) {
                console.log(`Updating ${role}: ${email}`);
                user.name = name;
                user.role = role;
                // Manually hash because we might not trigger pre-save loop correctly with findOneAndUpdate or similar if strictly setting
                // But let's use standard save logic. 
                // However, pre-save checks `isModified('password')`.
                // So we set it to plain text and let pre-save hash it?
                // Yes, UserSchema.pre('save') handles it.
                user.password = password;
            } else {
                console.log(`Creating ${role}: ${email}`);
                user = new User({ name, email, password, role });
            }
            await user.save();
        };

        await upsertUser('Super Admin', 'admin@example.com', 'password123', 'admin');
        await upsertUser('Agent Doe', 'agent@example.com', 'password123', 'agent');
        await upsertUser('John Doe', 'user@example.com', 'password123', 'user');

        console.log('Users Reset/Created Successfully');
        mongoose.connection.close();
    })
    .catch(err => {
        console.error(err);
        mongoose.connection.close();
    });
