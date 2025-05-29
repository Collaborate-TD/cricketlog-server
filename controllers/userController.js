import User from '../models/User.js';

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
        const users = await User.find(filters).select('-password');

        res.status(200).json(users);
    } catch (err) {
        console.error('Get Users Error:', err);
        res.status(500).json({ message: 'Server error while fetching users.' });
    }
};

// Update user by ID
const updateUser = async (req, res) => {
    try {
        const updates = req.body;
        if (updates.password) delete updates.password; // disallow password update here
        if (updates.email) delete updates.email; // disallow password update here

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

export { getUserDetails, getUserList, updateUser, deleteUser };
