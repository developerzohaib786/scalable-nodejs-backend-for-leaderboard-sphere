import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Worker } from "bullmq";

const worker = new Worker('file-processing', async job => {
    const data = JSON.parse(job.data);

    const loader = new PDFLoader(data.filePath);
    const docs = await loader.load();

    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });

    const chunks = await textSplitter.splitDocuments(docs);
    
    console.log(`Split into ${chunks.length} chunks`);
    console.log(`Loaded ${docs.length} documents from ${docs}`);


}, {
    concurrency: 100, connection: {
        host: 'localhost',
        port: 6379
    }
}); 