// Add these to your existing socket.js file

// Storage for music rooms and invitations
const musicRooms = new Map();
const musicInvitations = new Map();

// Handle music invitation
socket.on('sendMusicInvitation', (data) => {
  const { senderId, receiverId, senderName, roomId, songId } = data;
  
  // Create invitation ID
  const invitationId = `${roomId}_${Date.now()}`;
  
  // Store invitation
  musicInvitations.set(invitationId, {
    senderId,
    receiverId,
    senderName,
    roomId,
    songId,
    timestamp: Date.now(),
  });
  
  // Send invitation to receiver
  const receiverSocket = connectedUsers.get(receiverId);
  if (receiverSocket) {
    io.to(receiverSocket).emit('musicInvitation', {
      invitationId,
      senderId,
      senderName,
      roomId,
      timestamp: Date.now(),
    });
  }
});

// Handle music invitation response
socket.on('respondToMusicInvitation', (data) => {
  const { invitationId, accepted, userId } = data;
  
  // Get invitation
  const invitation = musicInvitations.get(invitationId);
  if (!invitation) return;
  
  // If accepted, add user to music room
  if (accepted) {
    // Get or create music room
    let room = musicRooms.get(invitation.roomId);
    if (!room) {
      room = {
        id: invitation.roomId,
        hostId: invitation.senderId,
        participants: [invitation.senderId],
        currentSongId: invitation.songId,
        timestamp: Date.now(),
      };
      musicRooms.set(invitation.roomId, room);
    }
    
    // Add participant
    if (!room.participants.includes(userId)) {
      room.participants.push(userId);
    }
    
    // Notify all participants
    room.participants.forEach((participantId) => {
      const participantSocket = connectedUsers.get(participantId);
      if (participantSocket) {
        io.to(participantSocket).emit('roomParticipantsUpdate', {
          roomId: invitation.roomId,
          participants: room.participants.map((id) => ({
            id,
            isHost: id === room.hostId,
          })),
        });
      }
    });
  }
  
  // Remove invitation
  musicInvitations.delete(invitationId);
});

// Handle joining music room
socket.on('joinMusicRoom', (data) => {
  const { roomId, userId } = data;
  
  // Get or create music room
  let room = musicRooms.get(roomId);
  if (!room) {
    room = {
      id: roomId,
      hostId: userId,
      participants: [],
      timestamp: Date.now(),
    };
    musicRooms.set(roomId, room);
  }
  
  // Add participant
  if (!room.participants.includes(userId)) {
    room.participants.push(userId);
  }
  
  // Notify all participants
  room.participants.forEach((participantId) => {
    const participantSocket = connectedUsers.get(participantId);
    if (participantSocket) {
      io.to(participantSocket).emit('roomParticipantsUpdate', {
        roomId,
        participants: room.participants.map((id) => ({
          id,
          isHost: id === room.hostId,
        })),
      });
    }
  });
});

// Handle leaving music room
socket.on('leaveMusicRoom', (data) => {
  const { roomId, userId } = data;
  
  // Get music room
  const room = musicRooms.get(roomId);
  if (!room) return;
  
  // Remove participant
  room.participants = room.participants.filter((id) => id !== userId);
  
  // If room is empty, delete it
  if (room.participants.length === 0) {
    musicRooms.delete(roomId);
    return;
  }
  
  // If host left, assign new host
  if (userId === room.hostId) {
    room.hostId = room.participants[0];
  }
  
  // Notify all participants
  room.participants.forEach((participantId) => {
    const participantSocket = connectedUsers.get(participantId);
    if (participantSocket) {
      io.to(participantSocket).emit('roomParticipantsUpdate', {
        roomId,
        participants: room.participants.map((id) => ({
          id,
          isHost: id === room.hostId,
        })),
      });
    }
  });
});

// Handle music control
socket.on('musicControl', (data) => {
  const { roomId, action, songId, position } = data;
  
  // Get music room
  const room = musicRooms.get(roomId);
  if (!room) return;
  
  // Update current song if needed
  if (action === 'changeSong' && songId) {
    room.currentSongId = songId;
  }
  
  // Broadcast to all participants except sender
  room.participants.forEach((participantId) => {
    if (participantId !== socket.userId) {
      const participantSocket = connectedUsers.get(participantId);
      if (participantSocket) {
        io.to(participantSocket).emit('musicControl', {
          action,
          songId,
          position,
        });
      }
    }
  });
});