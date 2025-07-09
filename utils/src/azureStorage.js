import { BlobServiceClient } from '@azure/storage-blob';
import fs from 'fs';

// Initialize blob service client
let blobServiceClient;

// Initialize with better error handling
try {
  if (process.env.STORAGE_CONNECTION_STRING) {
    blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.STORAGE_CONNECTION_STRING
    );
    console.log("Azure Blob Storage client initialized successfully");
  } else {
    console.error("STORAGE_CONNECTION_STRING environment variable is not set");
  }
} catch (error) {
  console.error("Failed to initialize Azure Blob Storage client:", error);
}

/**
 * Upload a file to Azure Blob Storage
 */
export const uploadToBlob = async (containerName, blobName, filePath) => {
  try {
    // Verify client is initialized
    if (!blobServiceClient) {
      throw new Error("Blob service client not initialized");
    }
    
    // Get container client
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Verify file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    // Read file with error handling
    const data = fs.readFileSync(filePath);
    if (!data || !data.length) {
      throw new Error(`File is empty or could not be read: ${filePath}`);
    }
    
    // Upload file
    console.log(`Uploading file ${filePath} to ${containerName}/${blobName}`);
    const uploadResponse = await blockBlobClient.upload(data, data.length);
    
    return blockBlobClient.url;
  } catch (error) {
    console.error('Error uploading to Azure Blob Storage:', error);
    throw error;
  }
};