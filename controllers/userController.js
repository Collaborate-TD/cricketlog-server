import User from '../models/User.js';
import { USER_ROLES } from '../constants/userRoles.js';
import { updateUserSchema } from '../validation/userValidation.js';
import { deleteFileUrl, getFileUrl, saveFileUrl } from '../utils/src/localUpload.js';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { FOLDER_PATH } from '../constants/folderPath.js';

// Get single user by ID
const getUserDetails = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select(['-password', '-relation']);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        res.status(200).json(user);
    } catch (err) {
        console.error('Get User Error:', err);
        res.status(500).json({ message: 'Server error while fetching user.' });
    }
};

// Get list of all users
const getUserList = async (req, res) => {
    try {
        const filters = req.body;

        // If filtering by role, use USER_ROLES constants
        if (filters.role && Object.values(USER_ROLES).includes(filters.role)) {
            filters.role = filters.role;
        }

        const users = await User.find(filters)
            .select(['-password', '-relation']).sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (err) {
        console.error('Get Users Error:', err);
        res.status(500).json({ message: 'Server error while fetching users.' });
    }
};

// Update user by ID
const updateUser = async (req, res) => {
    // Validate input and strip unknown fields
    const { value: updates, error } = updateUserSchema.validate(req.body, { stripUnknown: true });
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        // Check for unique username
        if (updates.userName) {
            const existingUser = await User.findOne({
                userName: updates.userName,
                _id: { $ne: req.params.id } // exclude current user
            });

            if (existingUser) {
                return res.status(409).json({ message: 'Username is already taken by another user.' });
            }
        }

        if (updates.profilePhoto) {
            const timestamp = Date.now();
            const subFolder = `${user._id}/`;
            const fileName = `${timestamp}-${updates.profilePhoto}`;

            const srcPath = path.join(FOLDER_PATH.TEMP_PATH, updates.profilePhoto);
            // Read file as buffer
            const fileBuffer = fs.readFileSync(srcPath);

            // Save video in local storage or cloud storage
            await saveFileUrl(
                FOLDER_PATH.PROFILE_PHOTO_PATH,
                subFolder,
                fileName,
                fileBuffer
            );

            // Delete temporary file
            fs.unlinkSync(srcPath);

            // Delete temporary file from TMP_PATH
            await deleteFileUrl(FOLDER_PATH.TMP_PATH, updates.profilePhoto, null, user._id);

            // Save profile photo name in updates
            updates.profilePhoto = fileName;
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        ).select(['-password', '-relation']);

        if (!updatedUser) return res.status(404).json({ message: 'User not found.' });

        const subFolder = `${updatedUser._id.toString()}/${updatedUser.profilePhoto}`;
        const profilePhotoUrl = await getFileUrl(FOLDER_PATH.PROFILE_PHOTO_PATH, subFolder);

        const token = jwt.sign(
            {
                id: updatedUser._id,
                userName: updatedUser.userName,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                role: updatedUser.role,
                profilePhoto: profilePhotoUrl
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY }
        );

        res.status(200).json({
            message: 'User updated successfully.',
            user: {
                id: updatedUser._id,
                userName: updatedUser.userName,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                role: updatedUser.role,
                profilePhoto: profilePhotoUrl
            },
            token
        });
    } catch (err) {
        console.error('Update User Error:', err);
        res.status(500).json({ message: 'Server error while updating user.' });
    }
};

// Delete user by ID
const deleteUser = async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ message: 'User not found.' });

        res.status(200).json({ message: 'User deleted successfully.' });
    } catch (err) {
        console.error('Delete User Error:', err);
        res.status(500).json({ message: 'Server error while deleting user.' });
    }
};

const getOtherUserDetails = async (req, res) => {
    try {
        const userId = req.params.id;
        if (!userId) {
            return res.status(400).json({ message: 'userId is required.' });
        }
        const user = await User.findById(userId).select('firstName lastName email userName role createdAt updatedAt');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json(user);
    } catch (err) {
        console.error('Get User Details Error:', err);
        res.status(500).json({ message: 'Server error while fetching user details.' });
    }
};

const getMatchedUsers = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        // Find userIds with approved relation
        const matchedIds = user.relation
            .filter(rel => rel.status === 'approved')
            .map(rel => rel.userId);

        const matchedUsers = await User.find({ _id: { $in: matchedIds } })
            .select('firstName lastName email userName role createdAt updatedAt');

        // Attach relation status if exists
        const usersWithStatus = matchedUsers.map(u => {
            const rel = user.relation.find(r => r.userId.toString() === u._id.toString());
            return {
                ...u.toObject(),
                status: rel ? rel.status : null,
                updatedAt: rel ? rel.approvedDate || rel.requestDate : null,
            };
        }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        res.status(200).json(usersWithStatus);
    } catch (err) {
        console.error('Get Matched Users Error:', err);
        res.status(500).json({ message: 'Server error while fetching matched users.' });
    }
};

const getUnmatchedUsers = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        // Collect only approved userIds
        const approvedIds = user.relation
            .filter(rel => rel.status === 'approved')
            .map(rel => rel.userId.toString());
        approvedIds.push(userId); // Exclude self

        // Find users not in approvedIds and with opposite role
        const oppositeRole = user.role === 'student' ? 'coach' : 'student';
        const unmatchedUsers = await User.find({
            _id: { $nin: approvedIds },
            role: oppositeRole
        }).select('firstName lastName email userName role createdAt updatedAt');

        // Attach relation status if exists
        const usersWithStatus = unmatchedUsers.map(u => {
            const rel = user.relation.find(r => r.userId.toString() === u._id.toString());
            const userObj = u.toObject();
            userObj.userId = userObj._id;

            return {
                ...userObj,
                requestType: rel ? rel.requestType : null,
                status: rel ? rel.status : null,
                updatedAt: rel ? rel.approvedDate || rel.requestDate : null,
            };
        }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        res.status(200).json(usersWithStatus);
    } catch (err) {
        console.error('Get Unmatched Users Error:', err);
        res.status(500).json({ message: 'Server error while fetching unmatched users.' });
    }
};

export {
    getUserDetails,
    getUserList,
    updateUser,
    deleteUser,
    getOtherUserDetails,
    getMatchedUsers,
    getUnmatchedUsers
};