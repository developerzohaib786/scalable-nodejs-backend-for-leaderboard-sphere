import express from "express";
import cors from "cors";
import multer from "multer";
import { Queue } from "bullmq";
import { QdrantVectorStore } from "@langchain/qdrant";
import { CohereEmbeddings } from "@langchain/cohere";
import { CohereClientV2 } from "cohere-ai";
import dotenv from "dotenv";

dotenv.config();

const client = new CohereClientV2({ token: process.env.COHERE_API_KEY });

const queue = new Queue('file-processing', {
    connection: {
        url: process.env.REDIS_URL as string,
        tls: {},
        maxRetriesPerRequest: null,
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

const app = express();
const PORT = 5003;

app.use(cors());
const upload = multer({ storage: storage });


app.get("/", (req, res) => {
    res.send("Hello from RAG Vector DB Microservice!");
});

app.post("/upload/", upload.single('file'), async (req, res) => {
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


app.get('/chat', async (req, res) => {
    try {
        const userQuery = req.query.question;
        if (!userQuery) {
            return res.status(400).json({ error: 'Missing question parameter.' });
        }

        const query = userQuery as string;

        // Use Cohere embeddings with inputType for query
        const embeddings = new CohereEmbeddings({
            apiKey: process.env.COHERE_API_KEY as string,
            model: 'embed-english-v3.0',
            inputType: 'search_query',
        });

        // Qdrant vector store
        const vectorStore = await QdrantVectorStore.fromExistingCollection(
            embeddings,
            {
                url: process.env.QDRANT_URL as string,
                collectionName: 'langchainjs-testing',
            }
        );
        const retriever = vectorStore.asRetriever({ k: 2 });
        const contextResults = await retriever.invoke(query);
        console.log("Retrieved context:", contextResults);

        // Prepare context for LLM
        const context = JSON.stringify(contextResults);
        const prompt = `You are a helpful AI assistant. Answer the user's question based only on the following context from PDF files.\nContext: ${context}`;

        // Use Cohere LLM (CohereClientV2 messages format)
        const response = await client.chat({
            model: 'command-a-03-2025',
            messages: [
                { role: 'system', content: prompt },
                { role: 'user', content: query }
            ]
        });

        const answer = response.message?.content?.[0]?.type === 'text'
            ? response.message.content[0].text
            : '';

        res.json({ message: answer,
                context: contextResults
         });
    } catch (error: any) {
        console.error('Chat error:', error);
        res.status(500).json({ error: error?.message || 'Internal server error.' });
    }
});



app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
