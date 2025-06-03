import User from '../models/User.js';
import { USER_ROLES } from '../constants/userRoles.js';
import { updateUserSchema } from '../validation/userValidation.js';

// Get single user by ID
const getUserDetails = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
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

        const users = await User.find(filters).select('-password');
        res.status(200).json(users);
    } catch (err) {
        console.error('Get Users Error:', err);
        res.status(500).json({ message: 'Server error while fetching users.' });
    }
};

// Update user by ID
const updateUser = async (req, res) => {
    // Validate input
    const { error } = updateUserSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    try {
        const updates = req.body;
        if (updates.password) delete updates.password;
        if (updates.email) delete updates.email;

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

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) return res.status(404).json({ message: 'User not found.' });

        res.status(200).json({ message: 'User updated successfully.', user: updatedUser });
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

        res.status(200).json(matchedUsers);
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

        // Find users not in approvedIds
        const unmatchedUsers = await User.find({ _id: { $nin: approvedIds } })
            .select('firstName lastName email userName role createdAt updatedAt');

        res.status(200).json(unmatchedUsers);
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
