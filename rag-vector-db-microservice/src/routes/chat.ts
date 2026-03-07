import express from 'express';
import { QdrantVectorStore } from "@langchain/qdrant";
import { CohereEmbeddings } from "@langchain/cohere";
import { CohereClientV2 } from "cohere-ai";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const client = new CohereClientV2({ token: process.env.COHERE_API_KEY });


router.get('/chat', async (req, res) => {
    const question = req.query.question as string;
    // const question = "give Text Formatting Examples?";

    const embeddings = new CohereEmbeddings({
        apiKey: process.env.COHERE_API_KEY as string,
        model: "embed-english-v3.0",
        inputType: "search_query", // Required for v3 models when querying
    });

    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
        url: process.env.QDRANT_URL as string,
        collectionName: "langchainjs-testing",
    });

    const retriever = vectorStore.asRetriever({
        k: 2,
    });
    const result = await retriever.invoke(question);

    const SYSTEM_PROMPT = `You are a helpful assistant for answering questions about the content of the PDF documents. 
    Use only the following retrieved information to answer the question. 
    If you don't know the answer, say you don't know. 
    Always use all available information to answer the question. 
    Always be concise and to the point.
    Context: ${JSON.stringify(result)}`;

    const chatResult = await client.chat({
        model: "command-a-03-2025",
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: question }
        ],
        temperature: 0.2,
    });

    const firstContent = chatResult.message?.content?.[0];
    const messageContent = firstContent && firstContent.type === "text" ? firstContent.text : "I'm sorry, I couldn't generate a response.";
    return res.json({
        message: messageContent,
        docs: result
    });
});

export default router;