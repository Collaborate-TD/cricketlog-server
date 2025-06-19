import path from 'path';
import fs from 'fs';
import generateRandomString from './generateRandomString.js';
import { FOLDER_PATH } from '../../constants/folderPath.js';

export function saveProfilePhoto({ filename, userId, username }) {
    if (!filename) return null;
    const ext = path.extname(filename).toLowerCase();
    const timestamp = Date.now();
    const randStr = generateRandomString(6);
    const newFileName = `${username}_${timestamp}_${randStr}${ext}`;
    const userDir = path.join('data', 'profile', userId);
    fs.mkdirSync(userDir, { recursive: true });

    const srcPath = path.join(FOLDER_PATH.TMP_PATH, filename);
    const destPath = path.join(userDir, newFileName);
    fs.renameSync(srcPath, destPath);

    return newFileName;
}