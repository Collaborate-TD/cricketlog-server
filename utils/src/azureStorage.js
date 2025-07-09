import { BlobServiceClient } from '@azure/storage-blob';

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
    // Verify client is initialized
    if (!blobServiceClient) {
      throw new Error("Blob service client not initialized");
    }
    
    // Get container client
    const containerClient = blobServiceClient.getContainerClient(containerName);
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