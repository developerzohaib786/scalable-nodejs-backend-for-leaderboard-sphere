import { Router, Request, Response } from 'express';
import prisma from '../services/prisma';

const router = Router();

// GET: Fetch all messages for a room
router.get('/room/:roomId', async (req: Request, res: Response): Promise<void> => {
    try {
        const roomName = req.params.roomId as string;

        if (!roomName) {
            res.status(400).json({ error: 'Room ID is required' });
            return;
        }

        // First, find the room by name to get its UUID
        const room = await prisma.room.findFirst({
            where: { name: roomName },
        });

        if (!room) {
            // If room doesn't exist, return empty messages array
            res.status(200).json({
                success: true,
                messages: [],
                count: 0,
            });
            return;
        }

        // Fetch all messages from database using the room's UUID
        const messages = await prisma.message.findMany({
            where: { roomId: room.id },
            orderBy: { createdAt: 'asc' }, // Oldest first
        });

        res.status(200).json({
            success: true,
            messages: messages,
            count: messages.length,
        });
    } catch (error: any) {
        console.error('Error fetching messages:', error);
        res.status(500).json({
            error: 'Failed to fetch messages',
            message: error.message,
        });
    }
});

// GET: Fetch room information
router.get('/room/:roomId/info', async (req: Request, res: Response): Promise<void> => {
    try {
        const roomId = req.params.roomId as string;

        if (!roomId) {
            res.status(400).json({ error: 'Room ID is required' });
            return;
        }

        const room = await prisma.room.findUnique({
            where: { id: roomId },
        });

        if (!room) {
            res.status(404).json({ error: 'Room not found' });
            return;
        }

        // Count messages separately
        const messageCount = await prisma.message.count({
            where: { roomId: roomId },
        });

        res.status(200).json({
            success: true,
            room: {
                id: room.id,
                name: room.name,
                createdAt: room.createdAt,
                messageCount: messageCount,
            },
        });
    } catch (error: any) {
        console.error('Error fetching room info:', error);
        res.status(500).json({
            error: 'Failed to fetch room info',
            message: error.message,
        });
    }
});

export default router;
