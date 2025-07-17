import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';

// Use connection string authentication instead of Microsoft Entra ID
let blobServiceClient;

try {
    if (!process.env.STORAGE_CONNECTION_STRING) {
        console.error("STORAGE_CONNECTION_STRING environment variable is not set");
    } else {
        blobServiceClient = BlobServiceClient.fromConnectionString(
            process.env.STORAGE_CONNECTION_STRING
        );
        console.log("Azure Blob Storage client initialized");
    }
} catch (error) {
    console.error("Failed to initialize Azure Blob Storage client:", error);
}

/**
 * Upload a file to Azure Blob Storage
 * @param {string} containerName Container name
 * @param {string} blobName Blob name
 * @param {Buffer|string} filePathOrBuffer File path or buffer
 * @returns {Promise<string>} The URL of the uploaded blob
 */
export const uploadToBlob = async (containerName, blobName, filePathOrBuffer) => {
    try {
        // Get container client
        const containerClient = blobServiceClient.getContainerClient(containerName);
        // Don't add extra path segments to blobName
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        // Handle both file paths and buffers
        let data;
        if (typeof filePathOrBuffer === 'string') {
            // It's a file path
            const fs = await import('fs');
            if (!fs.existsSync(filePathOrBuffer)) {
                throw new Error(`File not found: ${filePathOrBuffer}`);
            }
            data = fs.readFileSync(filePathOrBuffer);
        } else {
            // It's already a buffer
            data = filePathOrBuffer;
        }

        // Upload
        console.log(`Uploading to ${containerName}/${blobName}`);
        await blockBlobClient.upload(data, data.length);

        return blockBlobClient.url;
    } catch (error) {
        console.error('Error uploading to Azure Blob Storage:', error);
        throw error;
    }
};

/**
 * Delete a blob from Azure Blob Storage
 * @param {string} containerName Container name
 * @param {string} blobName Blob name
 * @returns {Promise<void>}
 */
export const deleteBlob = async (containerName, blobName) => {
    try {
        // Verify client is initialized
        if (!blobServiceClient) {
            throw new Error("Blob service client not initialized");
        }

        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        console.log(`Deleting blob: ${containerName}/${blobName}`);
        await blockBlobClient.delete();

        return true;
    } catch (error) {
        console.error('Error deleting from Azure Blob Storage:', error);
        throw error;
    }
};

// Function to generate SAS URL
export const generateSasUrl = async (containerName, blobName) => {
    try {
        const account = "cricketvideos";
        const accountKey = process.env.STORAGE_ACCOUNT_KEY;

        if (!accountKey) {
            console.error("STORAGE_ACCOUNT_KEY environment variable is not set");
            // Fall back to direct URL if SAS can't be generated
            return `${process.env.BACKEND_FOLDER}/${containerName}/${blobName}`;
        }

        const sharedKeyCredential = new StorageSharedKeyCredential(account, accountKey);
        const blobServiceClient = new BlobServiceClient(
            `${process.env.BACKEND_FOLDER}`,
            sharedKeyCredential
        );

        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blobClient = containerClient.getBlobClient(blobName);

        // Generate SAS token that expires in 1 hour
        const sasToken = await blobClient.generateSasUrl({
            permissions: "r", // Read permission
            expiresOn: new Date(new Date().valueOf() + 3600 * 1000), // 1 hour
        });

        return sasToken;
    } catch (error) {
        console.error("Error generating SAS URL:", error);
        // Fall back to direct URL
        return `${process.env.BACKEND_FOLDER}/${containerName}/${blobName}`;
    }
}

/**
 * Download a blob from Azure Blob Storage to a buffer
 * @param {string} containerName Container name
 * @param {string} blobName Blob name
 * @returns {Promise<Buffer>} The blob data as a buffer
 */
export async function downloadBlobToBuffer(containerName, blobName) {
    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const downloadBlockBlobResponse = await blockBlobClient.download();
    return await streamToBuffer(downloadBlockBlobResponse.readableStreamBody);
}

/**
 * Convert a readable stream to a buffer
 * @param {ReadableStream} readableStream The readable stream
 * @returns {Promise<Buffer>} The data from the stream as a buffer
 */
export async function streamToBuffer(readableStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on("data", (data) => {
            chunks.push(data instanceof Buffer ? data : Buffer.from(data));
        });
        readableStream.on("end", () => {
            resolve(Buffer.concat(chunks));
        });
        readableStream.on("error", reject);
    });
}