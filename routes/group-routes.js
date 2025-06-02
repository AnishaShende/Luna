const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const GroupMessage = require('../models/GroupMessage');
const User = require('../models/User');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './uploads/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Create a new group
router.post('/groups', async (req, res) => {
  try {
    const { name, hostId, members } = req.body;
    
    if (!name || !hostId || !members || members.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const newGroup = new Group({
      name,
      hostId,
      members
    });
    
    await newGroup.save();
    
    res.status(201).json({ 
      message: 'Group created successfully',
      group: newGroup
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Get all groups for a user
router.get('/groups/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const groups = await Group.find({ members: userId });
    
    res.json({ groups });
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Get a specific group
router.get('/groups/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    res.json({ group });
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ error: 'Failed to fetch group' });
  }
});

// Update a group
router.put('/groups/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, members, avatar } = req.body;
    
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Only allow the host to update the group
    if (req.body.hostId && req.body.hostId !== group.hostId) {
      return res.status(403).json({ error: 'Only the host can update the group' });
    }
    
    // Update fields if provided
    if (name) group.name = name;
    if (members) group.members = members;
    if (avatar) group.avatar = avatar;
    
    group.updatedAt = Date.now();
    
    await group.save();
    
    res.json({ 
      message: 'Group updated successfully',
      group
    });
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ error: 'Failed to update group' });
  }
});

// Delete a group
router.delete('/groups/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Only allow the host to delete the group
    if (userId !== group.hostId) {
      return res.status(403).json({ error: 'Only the host can delete the group' });
    }
    
    // Delete all messages in the group
    await GroupMessage.deleteMany({ groupId });
    
    // Delete the group
    await Group.findByIdAndDelete(groupId);
    
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

// Send a message to a group
router.post('/groups/messages', async (req, res) => {
  try {
    const { groupId, senderId, content, imageUrl } = req.body;
    
    // Validate required fields
    if (!groupId || !senderId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Ensure at least content or imageUrl is provided
    if (!content && !imageUrl) {
      return res.status(400).json({ error: 'Either content or imageUrl is required' });
    }
    
    // Check if user is a member of the group
    const group = await Group.findById(groupId);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    if (!group.members.includes(senderId)) {
      return res.status(403).json({ error: 'User is not a member of this group' });
    }
    
    // Get sender's name
    const sender = await User.findById(senderId);
    
    if (!sender) {
      return res.status(404).json({ error: 'Sender not found' });
    }
    
    // Create and save the message
    const newMessage = new GroupMessage({
      groupId,
      senderId,
      senderName: sender.firstName || 'Unknown',
      content: content || '',
      imageUrl: imageUrl || null
    });
    
    await newMessage.save();
    
    // Return the saved message
    res.status(201).json({ 
      message: 'Message sent successfully',
      groupMessage: newMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get messages for a group
router.get('/groups/:groupId/messages', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { limit = 50, before } = req.query;
    
    // Build query
    const query = { groupId };
    
    if (before) {
      query.timestamp = { $lt: new Date(before) };
    }
    
    // Get messages
    const messages = await GroupMessage.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();
    
    // Decrypt messages if needed
    const decryptedMessages = [];
    
    for (const message of messages) {
      try {
        // If the message has a decryptMessage method, use it
        if (message.content && typeof message.content === 'string' && message.content.includes(':')) {
          const messageDoc = await GroupMessage.findById(message._id);
          const decrypted = await messageDoc.decryptMessage();
          decryptedMessages.push(decrypted);
        } else {
          // Otherwise just use the message as is
          decryptedMessages.push(message);
        }
      } catch (error) {
        console.error('Error decrypting message:', error);
        decryptedMessages.push(message);
      }
    }
    
    // Return messages in chronological order
    res.json({ messages: decryptedMessages.reverse() });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Upload an image
router.post('/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const baseUrl = process.env.BASE_URL || 'http://192.168.39.169:6000';
    const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
    
    res.json({ imageUrl });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Serve static files
router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

module.exports = router;