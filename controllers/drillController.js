import fs from 'fs';
import path from 'path';
import Drill from '../models/Drill.js';
import User from '../models/User.js';
import { createDrillSchema, updateDrillSchema, drillIdParamSchema, drillFilterSchema, deleteDrillsSchema } from '../validation/drillValidation.js';
import { deleteFileUrl, getFileUrl, saveFileUrl } from '../utils/src/localUpload.js';
import { FOLDER_PATH } from '../constants/folderPath.js';

// Create Drill
export const createDrill = async (req, res) => {
    const { error, value } = createDrillSchema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ message: error.details[0].message });

    try {
        const { userId, fileName, isPrivate, title, desc } = value;

        const timestamp = Date.now();
        const subFolder = `${userId}/`;
        const newFileName = `${timestamp}-${fileName}`;

        const srcPath = path.join(FOLDER_PATH.TEMP_PATH, fileName);
        // Read file as buffer
        const fileBuffer = fs.readFileSync(srcPath);

        // Save video in local storage or cloud storage
        const url = await saveFileUrl(
            FOLDER_PATH.DRILL_PATH,
            subFolder,
            newFileName,
            fileBuffer
        );

        // Delete temporary file
        fs.unlinkSync(srcPath);

        await deleteFileUrl(FOLDER_PATH.TMP_PATH, fileName, null, userId);

        const drill = await Drill.create({
            userId,
            isPrivate: isPrivate ?? false,
            fileName: newFileName,
            title,
            desc,
            url
        });

        res.status(201).json({ message: 'Drill created successfully', data: drill });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get All Drills (with owner info & filters)
export const getDrills = async (req, res) => {
    // Validate filters using Joi
    const { error, value: filters } = drillFilterSchema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ message: error.details[0].message });

    try {
        const drills = await Drill.find(filters).populate('userId', 'firstName lastName userName').sort({ _id: -1 });
        const list = await Promise.all(drills.map(async d => ({
            _id: d._id,
            userId: d.userId._id,
            ownerName: `${d.userId.firstName} ${d.userId.lastName}`,
            userName: d.userId.userName,
            fileName: d.fileName,
            url: await getFileUrl(FOLDER_PATH.DRILL_PATH, `${d.userId._id}/${d.fileName}`),
            title: d.title,
            desc: d.desc,
            isPrivate: d.isPrivate,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt
        })));
        res.status(200).json(list);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get Single Drill
export const getDrill = async (req, res) => {
    const { error } = drillIdParamSchema.validate(req.params, { stripUnknown: true });
    if (error) return res.status(400).json({ message: error.details[0].message });

    try {
        const drill = await Drill.findById(req.params.id).populate('userId', 'firstName lastName userName');
        if (!drill) return res.status(404).json({ message: 'Drill not found' });
        res.status(200).json({
            _id: drill._id,
            userId: drill.userId._id,
            ownerName: `${drill.userId.firstName} ${drill.userId.lastName}`,
            userName: drill.userId.userName,
            fileName: drill.fileName,
            url: await getFileUrl(FOLDER_PATH.DRILL_PATH, `${drill.userId._id}/${drill.fileName}`),
            title: drill.title,
            desc: drill.desc,
            isPrivate: drill.isPrivate,
            createdAt: drill.createdAt,
            updatedAt: drill.updatedAt
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update Drill
export const updateDrill = async (req, res) => {
    const { error } = updateDrillSchema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ message: error.details[0].message });

    try {
        const drill = await Drill.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: new Date() },
            { new: true }
        );
        if (!drill) return res.status(404).json({ message: 'Drill not found' });
        res.status(200).json(drill);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete Drill
export const deleteDrill = async (req, res) => {
    const { error, value } = deleteDrillsSchema.validate(req.body, { stripUnknown: true });
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { userId, ids } = value;

    try {
        // Find the user to check their role
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find all drills to be deleted
        const drills = await Drill.find({ _id: { $in: ids }, userId });
        if (!drills.length) return res.status(200).json({ message: 'No drills found to delete.' });

        // Delete files for each drill (await if deleteFileUrl is async)
        for (const drill of drills) {
            const filePath = path.join(drill.userId.toString(), drill.fileName);
            await deleteFileUrl(FOLDER_PATH.DRILL_PATH, filePath, null, drill.userId);
        }

        // Delete drills from DB
        await Drill.deleteMany({ _id: { $in: ids }, userId });

        res.status(200).json({ message: 'Drills deleted successfully.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};