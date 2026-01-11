import Note from '../models/Note.js';

// @desc    Get notes for a user
// @route   GET /api/notes
// @access  Public
const getNotes = async (req, res, next) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            res.status(400);
            throw new Error('User ID is required');
        }

        const notes = await Note.find({ userId }).sort({ createdAt: -1 });
        res.json(notes);
    } catch (error) {
        next(error);
    }
};

// @desc    Create new note
// @route   POST /api/notes
// @access  Public
const createNote = async (req, res, next) => {
    try {
        const { userId, title, content } = req.body;

        if (!userId || !title || !content) {
            res.status(400);
            throw new Error('Please add all required fields (userId, title, content)');
        }

        const note = await Note.create({
            userId,
            title,
            content
        });

        res.status(201).json(note);
    } catch (error) {
        next(error);
    }
};

// @desc    Update note
// @route   PUT /api/notes/:id
// @access  Public
const updateNote = async (req, res, next) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            res.status(404);
            throw new Error('Note not found');
        }

        const updatedNote = await Note.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json(updatedNote);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete note
// @route   DELETE /api/notes/:id
// @access  Public
const deleteNote = async (req, res, next) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            res.status(404);
            throw new Error('Note not found');
        }

        await Note.findByIdAndDelete(req.params.id);

        res.json({ id: req.params.id, message: 'Note deleted' });
    } catch (error) {
        next(error);
    }
};

export { getNotes, createNote, updateNote, deleteNote };
