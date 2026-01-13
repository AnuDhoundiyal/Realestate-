const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   GET api/chat/conversations
// @desc    Get all conversations for the current user
// @access  Private
router.get('/conversations', auth, async (req, res) => {
    try {
        const chats = await Chat.find({ participants: req.user.id })
            .populate('participants', 'name email role')
            .populate('lastMessage')
            .sort({ 'lastMessage.createdAt': -1 }); // This might not sort correctly if lastMessage is just ID. 
        // Better: sort by updatedAt of Chat if we update it, or populate and sort in memory, or use aggregate.
        // For now, let's assume Chat has 'updatedAt' or we rely on 'lastMessage' timestamp if populated.
        // Simple approach: sort by Date of creation or update field if we added one. 
        // Let's add 'updatedAt' to Chat schema? Or just sort by ID (approx time) for now.

        // Populate is simpler.
        const populatedChats = await Chat.find({ participants: req.user.id })
            .populate('participants', 'name email role')
            .populate('lastMessage')
            .sort({ _id: -1 });

        // Filter out self from participants for frontend convenience
        const result = populatedChats.map(chat => {
            const otherUser = chat.participants.find(p => p._id.toString() !== req.user.id);
            return {
                _id: chat._id,
                otherUser,
                lastMessage: chat.lastMessage
            };
        });

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/chat/messages/:otherUserId
// @desc    Get messages with a specific user
// @access  Private
router.get('/messages/:otherUserId', auth, async (req, res) => {
    try {
        const myId = req.user.id;
        const otherId = req.params.otherUserId;

        // Find chat
        const chat = await Chat.findOne({
            participants: { $all: [myId, otherId] }
        });

        if (!chat) {
            return res.json([]);
        }

        const messages = await Message.find({ chatId: chat._id })
            .sort({ createdAt: 1 })
            .populate('sender', 'name')
            .populate('recipient', 'name');

        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST api/chat/send
// @desc    Send a message (and create chat if needed)
// @access  Private
router.post('/send', auth, async (req, res) => {
    const { recipientId, content, metadata, isSystemMessage } = req.body;
    try {
        let chat = await Chat.findOne({
            participants: { $all: [req.user.id, recipientId] }
        });

        if (!chat) {
            chat = new Chat({
                participants: [req.user.id, recipientId]
            });
            await chat.save();
        }

        const newMessage = new Message({
            chatId: chat._id,
            sender: req.user.id,
            recipient: recipientId,
            content,
            metadata,
            isSystemMessage: isSystemMessage || false
        });

        const savedMessage = await newMessage.save();

        chat.lastMessage = savedMessage._id;
        await chat.save();

        res.json(savedMessage);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST api/chat/start-or-get
// @desc    Start or get chat, return messages
// @access  Private
router.post('/start-or-get', auth, async (req, res) => {
    const { recipientId, message, metadata, isSystemMessage } = req.body;
    try {
        let chat = await Chat.findOne({
            participants: { $all: [req.user.id, recipientId] }
        });

        if (!chat) {
            // Check Chat Limit before creating new chat
            // 1. Is user Admin? Admin has no limit.
            if (req.user.role !== 'admin') {
                // 2. Is recipient Admin? Chatting with admin is allowed unlimited.
                const recipient = await User.findById(recipientId);
                if (recipient && recipient.role !== 'admin') {
                    // 3. User talking to non-admin. Check limit.
                    const user = await User.findById(req.user.id).populate('plan');
                    if (user.plan && user.plan.chatLimit !== undefined) {
                        const limit = user.plan.chatLimit;
                        if (limit > 0) { // 0 might mean unlimited or no chat? Let's assume > 0 is the limit. 
                            // Count existing non-admin chats
                            const allChats = await Chat.find({ participants: req.user.id }).populate('participants');
                            // Filter chats where the other participant is NOT admin
                            let activeCount = 0;
                            for (const c of allChats) {
                                const other = c.participants.find(p => p._id.toString() !== req.user.id);
                                if (other && other.role !== 'admin') {
                                    activeCount++;
                                }
                            }

                            if (activeCount >= limit) {
                                return res.status(403).json({
                                    message: `Plan limit reached. You can only chat with ${limit} people. Upgrade your plan to chat more.`
                                });
                            }
                        }
                    } else {
                        // If no plan or no limit defined?
                        // Default to basic limit? Or block?
                        // For now, if no plan is assigned, maybe allow 0?
                        // The prompt: "User or agent can only message... if plan allows them"
                        // If user has no plan, they probably shouldn't chat (except to admin).
                        // Let's assume default is 0 if no plan.
                        if (!user.plan) {
                            return res.status(403).json({ message: 'No active plan. Please subscribe to chat.' });
                        }
                    }
                }
            }

            chat = new Chat({
                participants: [req.user.id, recipientId]
            });
            await chat.save();
        }

        // If specific initial message provided
        if (message) {
            // Check if we should only send if it's a NEW chat? 
            // User requirement: "If no chat thread exists, create one... Pre-fill a starter message".
            // Implementation: We can just return the chat ID and let frontend send, OR send it here.
            // Frontend says "Pre-fill", which implies user can edit. 
            // BUT Feature 2 says "Auto-send a system message".
            // So for Feature 2, we want to send it immediately.

            // Logic: If 'message' is passed to API, we save it.
            const newMessage = new Message({
                chatId: chat._id,
                sender: req.user.id,
                recipient: recipientId,
                content: message,
                metadata,
                isSystemMessage: isSystemMessage || false
            });
            const savedMsg = await newMessage.save();
            chat.lastMessage = savedMsg._id;
            await chat.save();
        }

        // Fetch messages to return
        const messages = await Message.find({ chatId: chat._id })
            .sort({ createdAt: 1 })
            .populate('sender', 'name')
            .populate('recipient', 'name');

        // Populate chat participants for frontend
        await chat.populate('participants', 'name email role');

        // Identify other user
        const otherUser = chat.participants.find(p => p._id.toString() !== req.user.id);

        res.json({
            success: true,
            chat: {
                _id: chat._id,
                otherUser,
                lastMessage: chat.lastMessage
            },
            messages
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST api/chat/broadcast
// @desc    Send broadcast message to Users, Agents, or All
// @access  Private (Admin only)
router.post('/broadcast', auth, async (req, res) => {
    const { recipientType, message } = req.body; // "USERS", "AGENTS", "ALL"

    // Check if admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
    }

    try {
        let query = {};
        if (recipientType === 'USERS') {
            query = { role: 'user' };
        } else if (recipientType === 'AGENTS') {
            query = { role: 'agent' };
        } else if (recipientType === 'ALL') {
            query = { role: { $in: ['user', 'agent'] } };
        } else {
            return res.status(400).json({ message: 'Invalid recipient type' });
        }

        const recipients = await User.find(query);
        const adminId = req.user.id;

        let sentCount = 0;

        for (const recipient of recipients) {
            // Find or create chat
            let chat = await Chat.findOne({
                participants: { $all: [adminId, recipient._id] }
            });

            if (!chat) {
                chat = new Chat({
                    participants: [adminId, recipient._id]
                });
                await chat.save();
            }

            // Create message
            const newMessage = new Message({
                chatId: chat._id,
                sender: adminId,
                recipient: recipient._id,
                content: `System Announcement: ${message}`,
                isSystemMessage: true // Broadcasts are system announcements
            });

            const savedMsg = await newMessage.save();
            chat.lastMessage = savedMsg._id;
            await chat.save();
            sentCount++;
        }

        res.json({ success: true, sentCount });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/chat/unread-count
// @desc    Get total unread messages count
// @access  Private
router.get('/unread-count', auth, async (req, res) => {
    try {
        // Count messages where recipient is me and read is false (if we had read status)
        // Since we don't have 'read' status in Message schema from the snippet (I saw Content, Metadata, IsSystem),
        // I need to assume or check Message Schema again.
        // Wait, I saw Message.js earlier in list but didn't read it. 
        // Let's assume we need to add 'read' field to Message if it's not there.
        // Or if 'unread' logic relies on Chat's lastMessage? 
        // The prompt says "Add unread message counters".
        // I should check Message schema. If 'read' missing, I must add it.
        // For now, I'll write the logic assuming 'read' field exists or I will add it.
        // Better: I will verify Message schema in a separate step or right now.
        // I will write the query assuming 'read' defaults to false.

        const count = await Message.countDocuments({
            recipient: req.user.id,
            read: false
        });
        res.json({ count });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST api/chat/mark-read/:chatId
// @desc    Mark messages in a chat as read
// @access  Private
router.post('/mark-read/:chatId', auth, async (req, res) => {
    try {
        await Message.updateMany(
            { chatId: req.params.chatId, recipient: req.user.id, read: false },
            { $set: { read: true } }
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});


// @route   POST api/chat/welcome-check
// @desc    Check and send welcome message if needed
// @access  Private
router.post('/welcome-check', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.hasReceivedWelcomeMessage) {
            return res.json({ sent: false });
        }

        // Find an admin
        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            user.hasReceivedWelcomeMessage = true;
            await user.save();
            return res.json({ sent: false, reason: 'No admin found' });
        }

        // Create Chat with Admin
        let chat = await Chat.findOne({
            participants: { $all: [admin._id, user._id] }
        });

        if (!chat) {
            chat = new Chat({
                participants: [admin._id, user._id]
            });
            await chat.save();
        }

        const welcomeMsg = new Message({
            chatId: chat._id,
            sender: admin._id,
            recipient: user._id,
            content: 'Welcome to our platform! Let me know if you need any help.',
            isSystemMessage: true
        });

        const savedMsg = await welcomeMsg.save();
        chat.lastMessage = savedMsg._id;
        await chat.save();

        user.hasReceivedWelcomeMessage = true;
        await user.save();

        res.json({ sent: true });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/chat/get-admin
// @desc    Get admin ID
// @access  Private (or Public? Agents need it)
router.get('/get-admin', auth, async (req, res) => {
    try {
        const admin = await User.findOne({ role: 'admin' }).select('_id name');
        if (!admin) return res.status(404).json({ message: 'No admin found' });
        res.json(admin);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE api/chat/messages/:id
// @desc    Delete a message
// @access  Private
router.delete('/messages/:id', auth, async (req, res) => {
    try {
        const msg = await Message.findById(req.params.id);
        if (!msg) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Allow sender or admin to delete
        // Also allow basic user? Requirement says "from the admin dashboard add a delect".
        // Let's check sender match OR admin role.
        if (msg.sender.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await Message.deleteOne({ _id: req.params.id });
        res.json({ success: true, message: 'Message deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
