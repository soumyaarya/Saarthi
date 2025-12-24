import Assignment from '../models/Assignment.js';

// @desc    Get assignments for a user
// @route   GET /api/assignments
// @access  Public (should be private in prod, using query user_id for now)
const getAssignments = async (req, res, next) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            res.status(400);
            throw new Error('User ID is required');
        }

        const assignments = await Assignment.find({ userId }).sort({ createdAt: -1 });
        res.json(assignments);
    } catch (error) {
        next(error);
    }
};

// @desc    Create new assignment
// @route   POST /api/assignments
// @access  Public
const createAssignment = async (req, res, next) => {
    try {
        const { userId, title, subject, dueDate, priority, description } = req.body;

        if (!userId || !title || !subject) {
            res.status(400);
            throw new Error('Please add all required fields');
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
// @access  Public
const updateAssignment = async (req, res, next) => {
    try {
        const assignment = await Assignment.findById(req.params.id);

        if (!assignment) {
            res.status(404);
            throw new Error('Assignment not found');
        }

        // Check for user match could go here if we had auth middleware

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
// @access  Public
const deleteAssignment = async (req, res, next) => {
    try {
        const assignment = await Assignment.findById(req.params.id);

        if (!assignment) {
            res.status(404);
            throw new Error('Assignment not found');
        }

        await assignment.remove();

        res.json({ id: req.params.id });
    } catch (error) {
        next(error);
    }
};

export { getAssignments, createAssignment, updateAssignment, deleteAssignment };
