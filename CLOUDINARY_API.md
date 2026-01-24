# Cloudinary File Upload API Documentation

## Overview
This API provides endpoints for uploading and deleting files to/from Cloudinary. Supports images, videos, PDFs, and document files (doc, docx, ppt, pptx).

## Endpoints

### 1. Upload File
**POST** `/api/cloudinary/upload`

Upload a file to Cloudinary and get the URL.

#### Request
- **Content-Type**: `multipart/form-data`
- **Body Parameter**: `file` (the file to upload)

#### Supported File Types
- **Images**: JPEG, JPG, PNG, GIF, WebP, SVG
- **Videos**: MP4, MPEG, MOV, AVI, MKV
- **Documents**: PDF, DOC, DOCX, PPT, PPTX

#### File Size Limit
- Maximum: 100MB per file

#### Example using cURL
```bash
curl -X POST http://localhost:3001/api/cloudinary/upload \
  -F "file=@/path/to/your/file.jpg"
```

#### Example using JavaScript (Fetch API)
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('http://localhost:3001/api/cloudinary/upload', {
  method: 'POST',
  body: formData
});

const data = await response.json();
console.log(data.url); // The uploaded file URL
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/leaderboard-sphere/filename.jpg",
  "publicId": "leaderboard-sphere/filename",
  "resourceType": "image",
  "format": "jpg",
  "size": 123456
}
```

#### Error Response (400/500)
```json
{
  "error": "Failed to upload file",
  "message": "Error details"
}
```

---

### 2. Delete File
**DELETE** `/api/cloudinary/delete/:publicId`

Delete a file from Cloudinary using its public ID.

**Note:** If your public ID contains slashes (e.g., `leaderboard-sphere/filename`), you need to URL encode the slashes. Replace `/` with `%2F` in the URL.

#### URL Parameters
- `publicId` (required): The public ID of the file to delete (URL encode if it contains slashes)

#### Query Parameters
- `resourceType` (optional): The type of resource (`image`, `video`, or `raw`). Default: `image`

#### Example using cURL
```bash
# Delete an image (note: slashes are encoded as %2F)
curl -X DELETE "http://localhost:3001/api/cloudinary/delete/leaderboard-sphere%2Ffilename"

# Delete a video
curl -X DELETE "http://localhost:3001/api/cloudinary/delete/leaderboard-sphere%2Fvideo-name?resourceType=video"

# Delete a document (PDF, DOC, etc.)
curl -X DELETE "http://localhost:3001/api/cloudinary/delete/leaderboard-sphere%2Fdocument?resourceType=raw"
```

#### Example using JavaScript (Fetch API)
```javascript
// Helper function to encode public ID
const encodePublicId = (publicId) => publicId.replace(/\//g, '%2F');

// Delete an image
const publicId = 'leaderboard-sphere/filename';
const response = await fetch(`http://localhost:3001/api/cloudinary/delete/${encodePublicId(publicId)}`, {
  method: 'DELETE'
});

// Delete a video
const videoPublicId = 'leaderboard-sphere/video-name';
const response = await fetch(`http://localhost:3001/api/cloudinary/delete/${encodePublicId(videoPublicId)}?resourceType=video`, {
  method: 'DELETE'
});

// Delete a document
const docPublicId = 'leaderboard-sphere/document';
const response = await fetch(`http://localhost:3001/api/cloudinary/delete/${encodePublicId(docPublicId)}?resourceType=raw`, {
  method: 'DELETE'
});

const data = await response.json();
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "File deleted successfully",
  "result": {
    "result": "ok"
  }
}
```

#### Error Response (400/500)
```json
{
  "error": "Failed to delete file",
  "message": "Error details"
}
```

---

## Environment Variables

Make sure to add these variables to your `.env` file:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

You can get these credentials from your [Cloudinary Dashboard](https://cloudinary.com/console).

---

## Testing the API

### Using Postman or Thunder Client

#### Upload File:
1. Create a new POST request to `http://localhost:3001/api/cloudinary/upload`
2. In the Body tab, select "form-data"
3. Add a key named "file" and set its type to "File"
4. Select a file from your computer
5. Send the request

#### Delete File:
1. Create a new DELETE request to `http://localhost:3001/api/cloudinary/delete/leaderboard-sphere/your-file-name`
2. Add query parameter `resourceType` if needed (e.g., `video` or `raw`)
3. Send the request

---

## Notes

- All uploaded files are stored in the `leaderboard-sphere` folder in your Cloudinary account
- The public ID returned in the upload response is needed for deleting the file
- For videos and documents, make sure to specify the correct `resourceType` when deleting
- Resource types:
  - `image` - for image files
  - `video` - for video files
  - `raw` - for PDF, DOC, DOCX, PPT, PPTX files
