import { BlobServiceClient } from '@azure/storage-blob';
import fs from 'fs';

// Initialize blob service client from connection string
const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.STORAGE_CONNECTION_STRING
);

/**
 * Upload a file to Azure Blob Storage
 * @param {string} containerName - Name of the container (e.g., 'videos')
 * @param {string} blobName - Name to give the blob (e.g., 'user123/video1.mp4')
 * @param {string|Buffer} filePathOrBuffer - File path or buffer to upload
 * @returns {Promise<string>} URL of the uploaded blob
 */
export const uploadToBlob = async (containerName, blobName, filePathOrBuffer) => {
  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Handle both file paths and buffers
    let data;
    if (typeof filePathOrBuffer === 'string') {
      // It's a file path
      data = fs.readFileSync(filePathOrBuffer);
    } else {
      // It's already a buffer
      data = filePathOrBuffer;
    }
    
    await blockBlobClient.upload(data, data.length);
    return blockBlobClient.url;
  } catch (error) {
    console.error('Error uploading to Azure Blob Storage:', error);
    throw error;
  }
};

/**
 * Delete a blob from Azure Blob Storage
 * @param {string} containerName - Name of the container
 * @param {string} blobName - Name of the blob to delete
 */
export const deleteBlob = async (containerName, blobName) => {
  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.delete();
  } catch (error) {
    console.error('Error deleting from Azure Blob Storage:', error);
    throw error;
  }
};