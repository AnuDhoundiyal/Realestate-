require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Database Connection
mongoose.connect('mongodb://127.0.0.1:27017/realestate')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Routes
const propertyRoutes = require('./routes/properties');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const planRoutes = require('./routes/plans');
const chatRoutes = require('./routes/chat');

app.use('/api/properties', propertyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/plans', planRoutes);
const paymentRoutes = require('./routes/payment');
app.use('/api/payment', paymentRoutes);
app.use('/api/chat', chatRoutes);
const agentRoutes = require('./routes/agent');
app.use('/api/agent', agentRoutes);
const userRoutes = require('./routes/user');
app.use('/api/user', userRoutes);

app.get('/', (req, res) => {
    res.send('Real Estate API is running...');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
