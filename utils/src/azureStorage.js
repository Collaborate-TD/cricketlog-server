// Create utils/azureStorage.js
import { BlobServiceClient } from '@azure/storage-blob';

const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.STORAGE_CONNECTION_STRING
);

export const uploadToBlob = async (containerName, blobName, fileBuffer) => {
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.upload(fileBuffer, fileBuffer.length);
  return blockBlobClient.url;
};