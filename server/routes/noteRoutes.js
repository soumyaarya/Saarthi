import express from 'express';
import { getNotes, createNote, updateNote, deleteNote } from '../controllers/noteController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected - require valid JWT token
router.route('/')
    .get(protect, getNotes)
    .post(protect, createNote);

router.route('/:id')
    .put(protect, updateNote)
    .delete(protect, deleteNote);

export default router;
