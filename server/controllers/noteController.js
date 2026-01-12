import Note from '../models/Note.js';

// @desc    Get notes for a user
// @route   GET /api/notes
// @access  Private (requires JWT token)
const getNotes = async (req, res, next) => {
    try {
        // Get user ID from authenticated user (set by protect middleware)
        const userId = req.user._id;

        const notes = await Note.find({ userId }).sort({ createdAt: -1 });
        res.json(notes);
    } catch (error) {
        next(error);
    }
};

// @desc    Create new note
// @route   POST /api/notes
// @access  Private (requires JWT token)
const createNote = async (req, res, next) => {
    try {
        const { title, content } = req.body;
        // Get user ID from authenticated user (set by protect middleware)
        const userId = req.user._id;

        if (!title || !content) {
            res.status(400);
            throw new Error('Please add all required fields (title, content)');
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
// @access  Private (requires JWT token)
const updateNote = async (req, res, next) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            res.status(404);
            throw new Error('Note not found');
        }

        // Verify ownership - user can only update their own notes
        if (note.userId.toString() !== req.user._id.toString()) {
            res.status(401);
            throw new Error('Not authorized to update this note');
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
// @access  Private (requires JWT token)
const deleteNote = async (req, res, next) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            res.status(404);
            throw new Error('Note not found');
        }

        // Verify ownership - user can only delete their own notes
        if (note.userId.toString() !== req.user._id.toString()) {
            res.status(401);
            throw new Error('Not authorized to delete this note');
        }

        await Note.findByIdAndDelete(req.params.id);

        res.json({ id: req.params.id, message: 'Note deleted' });
    } catch (error) {
        next(error);
    }
};

export { getNotes, createNote, updateNote, deleteNote };

