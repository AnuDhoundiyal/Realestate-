const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_change_this';

const Chat = require('../models/Chat');
const Message = require('../models/Message');

const upload = require('../middleware/upload');

// @route   POST api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', upload.single('image'), async (req, res) => {
    // When using multer, req.body contains text fields and req.file contains the file
    // Need to parse req.body manually if it comes as FormData? Multer handles it.

    try {
        const { name, email, password, role, phone } = req.body; // Multer populates this

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const newUser = new User({
            name,
            email,
            password,
            role: role || 'user',
            phone,
            profileImage: req.file ? `/uploads/${req.file.filename}` : ''
        });

        await newUser.save();

        const payload = {
            user: {
                id: newUser.id,
                role: newUser.role
            }
        };

        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '1d' },
            (err, token) => {
                if (err) throw err;

                // Welcome Message Logic (On Registration)
                // We need to check if we can run async code here or if we should do it before sending response.
                // Sending response first is better for UX, but we need to suppress unhandled rejections if we don't await.
                // Better to await it before sending response or just fire and forget (with catch).
                // Since we are inside the callback, we can't easily await without wrapping.
                // Let's move the welcome logic BEFORE jwt.sign or handle it as a side effect.
                // Actually, let's put it after user save and BEFORE jwt sign.

                res.status(201).json({
                    token,
                    user: {
                        id: newUser.id,
                        name: newUser.name,
                        email: newUser.email,
                        role: newUser.role,
                        profileImage: newUser.profileImage
                    }
                });
            }
        );

        // Welcome Message Logic (Moved from Login)
        try {
            const admin = await User.findOne({ role: 'admin' });
            if (admin) {
                // Check if chat exists (Should not exist for new user, but check anyway)
                let chat = await Chat.findOne({
                    participants: { $all: [admin.id, newUser.id] }
                });

                if (!chat) {
                    chat = new Chat({
                        participants: [admin.id, newUser.id]
                    });
                    await chat.save();
                }

                const welcomeMsg = new Message({
                    chatId: chat.id,
                    sender: admin.id,
                    recipient: newUser.id,
                    content: 'Welcome to our platform! Let me know if you need any help.',
                    isSystemMessage: true
                });

                const savedMsg = await welcomeMsg.save();
                chat.lastMessage = savedMsg._id;
                await chat.save();

                newUser.hasReceivedWelcomeMessage = true;
                await newUser.save();
            }
        } catch (inviteErr) {
            console.error('Welcome message error:', inviteErr);
            // Don't fail the registration if welcome message fails
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error: ' + err.message }); // Fixed to return JSON
    }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }



        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '1d' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

module.exports = router;
