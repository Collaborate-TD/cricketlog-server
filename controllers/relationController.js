import User from '../models/User.js';
import { RELATION_STATUS, REQUEST_TYPES } from '../constants/relationStatus.js';

// Send a relation request (student to coach or coach to student)
export const requestRelation = async (req, res) => {
    const { requesterId, targetId } = req.body; // requester sends request to target
    try {
        // Check if relation already exists for requester
        const requester = await User.findById(requesterId);
        const existingRelation = requester.relation.find(
            rel => rel.userId && rel.userId.toString() === targetId
        );

        if (existingRelation) {
            if (existingRelation.status === RELATION_STATUS.REQUESTED) {
                return res.status(400).json({ message: 'Relation already requested.' });
            }
            if (existingRelation.status === RELATION_STATUS.APPROVED) {
                return res.status(400).json({ message: 'Relation already approved.' });
            }
            if (existingRelation.status === RELATION_STATUS.REJECTED) {
                return res.status(400).json({ message: 'Relation already rejected.' });
            }
        }

        // Update requester
        await User.findByIdAndUpdate(requesterId, {
            $push: {
                relation: {
                    userId: targetId,
                    status: RELATION_STATUS.REQUESTED,
                    requestType: REQUEST_TYPES.SENT,
                    requestDate: new Date(),
                    approvedDate: null
                }
            }
        });
        // Update target (add requester to their relation array)
        await User.findByIdAndUpdate(targetId, {
            $push: {
                relation: {
                    userId: requesterId,
                    status: RELATION_STATUS.REQUESTED,
                    requestType: REQUEST_TYPES.RECEIVED,
                    requestDate: new Date(),
                    approvedDate: null
                }
            }
        });
        res.status(200).json({ message: 'Request sent' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Approve a relation request (either direction)
export const approveRelation = async (req, res) => {
    const { approverId, requesterId } = req.body; // approverId is the user who is trying to approve, requesterId is the one who sent the request
    try {
        // Only allow if approver has a 'received' request from requester
        const approver = await User.findById(approverId);
        const relation = approver.relation.find(
            rel => rel.userId.toString() === requesterId && rel.requestType === REQUEST_TYPES.RECEIVED && rel.status === RELATION_STATUS.REQUESTED
        );
        if (!relation) {
            return res.status(403).json({ message: "You are not authorized to approve this request." });
        }

        // Update both users' relation status to approved
        await User.updateOne(
            { _id: approverId, "relation.userId": requesterId, "relation.requestType": REQUEST_TYPES.RECEIVED },
            { $set: { "relation.$.status": RELATION_STATUS.APPROVED, "relation.$.approvedDate": new Date() } }
        );
        await User.updateOne(
            { _id: requesterId, "relation.userId": approverId, "relation.requestType": REQUEST_TYPES.SENT },
            { $set: { "relation.$.status": RELATION_STATUS.APPROVED, "relation.$.approvedDate": new Date() } }
        );
        res.status(200).json({ message: 'Request approved' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Decline a relation request (either direction)
export const declineRelation = async (req, res) => {
    const { approverId, requesterId } = req.body; // approverId is the user who is trying to decline, requesterId is the one who sent the request
    try {
        // Only allow if approver has a 'received' request from requester
        const approver = await User.findById(approverId);
        const relation = approver.relation.find(
            rel => rel.userId.toString() === requesterId && rel.requestType === REQUEST_TYPES.RECEIVED && rel.status === RELATION_STATUS.REQUESTED
        );
        if (!relation) {
            return res.status(403).json({ message: "You are not authorized to decline this request." });
        }

        // Update both users' relation status to rejected
        await User.updateOne(
            { _id: approverId, "relation.userId": requesterId, "relation.requestType": REQUEST_TYPES.RECEIVED },
            { $set: { "relation.$.status": RELATION_STATUS.REJECTED, "relation.$.approvedDate": new Date() } }
        );
        await User.updateOne(
            { _id: requesterId, "relation.userId": approverId, "relation.requestType": REQUEST_TYPES.SENT },
            { $set: { "relation.$.status": RELATION_STATUS.REJECTED, "relation.$.approvedDate": new Date() } }
        );
        res.status(200).json({ message: 'Request declined' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};