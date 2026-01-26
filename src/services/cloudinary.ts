import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Request, Response } from 'express';

// Configuration
cloudinary.config({
    cloud_name: 'di2cefwck',
    api_key: process.env.CLOUDINARY_API_KEY as string,
    api_secret: process.env.CLOUDINARY_API_SECRET as string
});

export type FileType = 'image' | 'video' | 'pdf' | 'doc' | 'docx';
export type ResourceType = 'image' | 'video' | 'raw';

// Map file types to Cloudinary resource types
function getResourceType(fileType: FileType): ResourceType {
    if (fileType === 'video') return 'video';
    if (fileType === 'pdf' || fileType === 'doc' || fileType === 'docx') return 'raw';
    return 'image';
}

/**
 * Upload handler for API endpoint
 */
export async function handleUpload(req: Request, res: Response) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        const fileType = req.body.fileType as FileType;
        if (!fileType || !['image', 'video', 'pdf', 'doc', 'docx'].includes(fileType)) {
            return res.status(400).json({
                error: 'Invalid or missing fileType. Must be: image, video, pdf, doc, or docx'
            });
        }

        const resourceType = getResourceType(fileType);

        // Convert buffer to base64 data URI
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;

        // Upload to Cloudinary
        const uploadResult: UploadApiResponse = await cloudinary.uploader.upload(dataURI, {
            resource_type: resourceType,
            folder: 'uploads',
        });

        return res.json({
            success: true,
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            resourceType: resourceType,
            format: uploadResult.format,
        });
    } catch (error: any) {
        console.error('Cloudinary upload error:', error);
        return res.status(500).json({
            error: 'Upload failed',
            message: error.message
        });
    }
}

/**
 * Delete handler for API endpoint
 */
export async function handleDelete(req: Request, res: Response) {
    try {
        const { publicId, resourceType } = req.body;

        if (!publicId) {
            return res.status(400).json({ error: 'publicId is required' });
        }

        const validResourceType: ResourceType = resourceType || 'image';

        if (!['image', 'video', 'raw'].includes(validResourceType)) {
            return res.status(400).json({
                error: 'Invalid resourceType. Must be: image, video, or raw'
            });
        }

        // Delete from Cloudinary
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: validResourceType
        });

        // Return boolean based on Cloudinary's response
        const success = result.result === 'ok';

        return res.json({
            success,
            message: success ? 'File deleted successfully' : 'File not found or already deleted',
            result: result.result,
        });
    } catch (error: any) {
        console.error('Cloudinary delete error:', error);
        return res.status(500).json({
            error: 'Delete failed',
            message: error.message
        });
    }
}

export default cloudinary;