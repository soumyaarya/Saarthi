import express from 'express';
import { getAssignments, createAssignment, updateAssignment, deleteAssignment } from '../controllers/assignmentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected - require valid JWT token
router.route('/')
    .get(protect, getAssignments)
    .post(protect, createAssignment);

router.route('/:id')
    .put(protect, updateAssignment)
    .delete(protect, deleteAssignment);

export default router;
