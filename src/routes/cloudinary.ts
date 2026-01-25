import { Router, Request, Response } from 'express';
import multer from 'multer';
import cloudinary from '../services/cloudinary';
import { Readable } from 'stream';

const router = Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allowed file types
        const allowedMimeTypes = [
            // Images
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml',
            // Videos
            'video/mp4',
            'video/mpeg',
            'video/quicktime',
            'video/x-msvideo',
            'video/x-matroska',
            // PDFs
            'application/pdf',
            // Documents
            'application/msword', // .doc
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            // PowerPoint
            'application/vnd.ms-powerpoint', // .ppt
            'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type not supported: ${file.mimetype}`));
        }
    },
});

// Helper function to convert buffer to stream
const bufferToStream = (buffer: Buffer): Readable => {
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    return readable;
};

// Helper function to determine resource type
const getResourceType = (mimetype: string): 'image' | 'video' | 'raw' => {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    return 'raw';
};

// POST: Upload file to Cloudinary
router.post('/upload', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const file = req.file;
        const resourceType = getResourceType(file.mimetype);

        // Upload to Cloudinary using upload_stream
        const uploadResult = await new Promise<any>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: resourceType,
                    folder: 'leaderboard-sphere',
                    // Use original filename without extension for public_id
                    public_id: file.originalname.split('.').slice(0, -1).join('.'),
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            bufferToStream(file.buffer).pipe(uploadStream);
        });

        res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            resourceType: uploadResult.resource_type,
            format: uploadResult.format,
            size: uploadResult.bytes,
        });
    } catch (error: any) {
        console.error('Upload error:', error);
        res.status(500).json({
            error: 'Failed to upload file',
            message: error.message,
        });
    }
});


export default router;
