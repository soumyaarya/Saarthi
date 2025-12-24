import express from 'express';
import { getAssignments, createAssignment, updateAssignment, deleteAssignment } from '../controllers/assignmentController.js';

const router = express.Router();

router.route('/')
    .get(getAssignments)
    .post(createAssignment);

router.route('/:id')
    .put(updateAssignment)
    .delete(deleteAssignment);

export default router;
