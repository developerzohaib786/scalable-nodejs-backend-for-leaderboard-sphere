import { config } from "dotenv";
config();

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Worker } from "bullmq";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";

console.log("OPenAI Key:", !!process.env.OPENAI_API_KEY);
console.log("Qdrant URL:", !!process.env.QDRANT_URL);

const worker = new Worker('file-processing', async job => {
    const data = JSON.parse(job.data);

    const loader = new PDFLoader(data.filePath);
    const docs = await loader.load();
    console.log(`PDF ${data.originalName} loaded with ${docs[0]} pages`);

    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });

    const chunks = await textSplitter.splitDocuments(docs);
    console.log(`PDF ${data.originalName} split into ${chunks.length} chunks`);

    const embeddings = new OpenAIEmbeddings({
        model: "text-embedding-3-large",
        apiKey: process.env.OPENAI_API_KEY as string,
    });

    console.log("Creating or connecting to Qdrant collection...");

    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
        url: process.env.QDRANT_URL as string,
        collectionName: "langchainjs-testing",
    });

    console.log(`Adding ${chunks.length} chunks to Qdrant collection...`);

    await vectorStore.addDocuments(chunks);
    console.log(`Added ${chunks.length} chunks to Qdrant collection.`);

}, {
    concurrency: 100, connection: {
        host: 'localhost',
        port: 6379
    }
}); 