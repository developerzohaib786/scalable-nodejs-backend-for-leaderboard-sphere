import express from "express";
import multer from "multer";
import { Queue } from "bullmq";


const router= express.Router();

const queue = new Queue('file-processing', {
    connection: {
        host: 'localhost',
        port: 6379
    }
});


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, `${uniqueSuffix}-${file.originalname}`)
    }
})

const upload = multer({ storage: storage });


router.post("/upload/", upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send("No file uploaded.");
    }

    await queue.add('file-processing', JSON.stringify({
        filePath: req.file.path,
        originalName: req.file.originalname,
        destination: req.file.destination
    }));

    

    res.send(`File ${req.file.originalname} uploaded successfully.`);
});

export default router;