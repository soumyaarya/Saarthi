import Assignment from '../models/Assignment.js';

// @desc    Get assignments for a user
// @route   GET /api/assignments
// @access  Private (requires JWT token)
const getAssignments = async (req, res, next) => {
    try {
        // Get user ID from authenticated user (set by protect middleware)
        const userId = req.user._id;

        const assignments = await Assignment.find({ userId }).sort({ createdAt: -1 });
        res.json(assignments);
    } catch (error) {
        next(error);
    }
};

// @desc    Create new assignment
// @route   POST /api/assignments
// @access  Private (requires JWT token)
const createAssignment = async (req, res, next) => {
    try {
        const { title, subject, dueDate, priority, description } = req.body;
        // Get user ID from authenticated user (set by protect middleware)
        const userId = req.user._id;

        if (!title || !subject) {
            res.status(400);
            throw new Error('Please add all required fields (title, subject)');
        }

        const assignment = await Assignment.create({
            userId,
            title,
            subject,
            dueDate,
            priority,
            description
        });

        res.status(201).json(assignment);
    } catch (error) {
        next(error);
    }
};

// @desc    Update assignment
// @route   PUT /api/assignments/:id
// @access  Private (requires JWT token)
const updateAssignment = async (req, res, next) => {
    try {
        const assignment = await Assignment.findById(req.params.id);

        if (!assignment) {
            res.status(404);
            throw new Error('Assignment not found');
        }

        // Verify ownership - user can only update their own assignments
        if (assignment.userId.toString() !== req.user._id.toString()) {
            res.status(401);
            throw new Error('Not authorized to update this assignment');
        }

        const updatedAssignment = await Assignment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json(updatedAssignment);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete assignment
// @route   DELETE /api/assignments/:id
// @access  Private (requires JWT token)
const deleteAssignment = async (req, res, next) => {
    try {
        const assignment = await Assignment.findById(req.params.id);

        if (!assignment) {
            res.status(404);
            throw new Error('Assignment not found');
        }

        // Verify ownership - user can only delete their own assignments
        if (assignment.userId.toString() !== req.user._id.toString()) {
            res.status(401);
            throw new Error('Not authorized to delete this assignment');
        }

        await Assignment.findByIdAndDelete(req.params.id);

        res.json({ id: req.params.id, message: 'Assignment deleted' });
    } catch (error) {
        next(error);
    }
};

export { getAssignments, createAssignment, updateAssignment, deleteAssignment };

