import React, { useEffect, useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { BookOpen, Calendar, CheckCircle2, Clock, Settings, Volume2, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import AccessibilitySettings from '@/components/accessibility/AccessibilitySettings';
import VoiceController, { speak } from '@/components/voice/VoiceController';
import { format } from 'date-fns';
import axios from 'axios';

const DEFAULT_SETTINGS = {
    highContrast: false,
    fontSize: 16,
    voiceEnabled: true
};

export default function Dashboard() {
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('accessibilitySettings');
        return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    });
    const [settingsOpen, setSettingsOpen] = useState(false);
    const hasAnnouncedRef = useRef(false);
    const mainHeadingRef = useRef(null);

    // Create Assignment Modal State
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [newAssignment, setNewAssignment] = useState({
        title: '',
        subject: '',
        dueDate: '',
        priority: 'medium',
        description: ''
    });

    const queryClient = useQueryClient();

    const { data: assignments = [] } = useQuery({
        queryKey: ['assignments'],
        queryFn: () => base44.entities.Assignment.list('-due_date')
    });

    const pendingCount = assignments.filter(a => a.status === 'pending').length;
    const completedCount = assignments.filter(a => a.status === 'completed').length;

    useEffect(() => {
        localStorage.setItem('accessibilitySettings', JSON.stringify(settings));
        document.documentElement.style.fontSize = `${settings.fontSize}px`;
    }, [settings]);

    const [hasInteracted, setHasInteracted] = useState(false);

    // Focus management
    useEffect(() => {
        if (mainHeadingRef.current && hasInteracted) {
            mainHeadingRef.current.focus();
        }
    }, [hasInteracted]);

    const handleStartInteraction = () => {
        setHasInteracted(true);
        speak("Welcome to Saarthi Dashboard. Speak menu for all commands.Click anywhere to speak");
    };

    const handleVoiceCommand = (command) => {
        if (command === 'read_page') {
            const pageContent = `Student Dashboard. You have ${pendingCount} pending assignments and ${completedCount} completed assignments. Say "open assignments" to view them or say "create assignment" to add new.`;
            speak(pageContent);
        } else if (command.includes('how many') || command.includes('status')) {
            speak(`You have ${pendingCount} pending assignments and ${completedCount} completed.`);
        } else if (command === 'create_assignment' || command.includes('create') || command.includes('new assignment')) {
            setCreateModalOpen(true);
            speak('Opening create assignment form. Fill in the title and subject, then say submit or click create.');
        }
    };

    // Create Assignment Mutation
    const createAssignmentMutation = useMutation({
        mutationFn: async (assignmentData) => {
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const response = await axios.post('http://localhost:5000/api/assignments', {
                ...assignmentData,
                userId: userInfo._id
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assignments'] });
            setCreateModalOpen(false);
            setNewAssignment({ title: '', subject: '', dueDate: '', priority: 'medium', description: '' });
            speak('Assignment created successfully!');
        },
        onError: (error) => {
            speak('Error creating assignment. Please try again.');
            console.error('Create assignment error:', error);
        }
    });

    const handleCreateAssignment = (e) => {
        e.preventDefault();
        if (!newAssignment.title || !newAssignment.subject) {
            speak('Please fill in the title and subject fields.');
            return;
        }
        createAssignmentMutation.mutate(newAssignment);
    };

    const openCreateModal = () => {
        setCreateModalOpen(true);
        speak('Create new assignment. Fill in the title, subject, and due date.');
    };

    return (
        <div
            className={`min-h-screen transition-colors ${settings.highContrast
                ? 'bg-gray-950 text-white'
                : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'
                }`}
        >
            {/* Screen Reader Announcement - Native Accessibility */}
            <div aria-live="polite" aria-atomic="true" className="sr-only">
                Welcome to Saarthi Dashboard. Press menu for all commands.
            </div>

            {/* Skip Link */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-4 focus:ring-indigo-300"
            >
                Skip to main content
            </a>

            {/* Header */}
            <header
                className={`sticky top-0 z-40 border-b-2 ${settings.highContrast
                    ? 'bg-gray-900 border-gray-700'
                    : 'bg-white/95 backdrop-blur-sm border-gray-200'
                    }`}
                role="banner"
            >
                <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between gap-4">
                        <h1
                            ref={mainHeadingRef}
                            tabIndex={-1}
                            className="text-2xl sm:text-3xl font-bold tracking-tight outline-none"
                        >
                            Saarthi
                        </h1>

                        <div className="flex items-center gap-2">
                            <VoiceController
                                voiceEnabled={settings.voiceEnabled}
                                onCommand={handleVoiceCommand}
                            />

                            <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
                                <SheetTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="gap-2"
                                        aria-label="Open accessibility settings"
                                    >
                                        <Settings className="h-5 w-5" aria-hidden="true" />
                                        <span className="hidden sm:inline">Settings</span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent
                                    side="right"
                                    className={`w-full sm:max-w-md ${settings.highContrast ? 'bg-gray-900 text-white' : ''}`}
                                >
                                    <div className="mt-6">
                                        <AccessibilitySettings
                                            settings={settings}
                                            onSettingsChange={setSettings}
                                        />
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main
                id="main-content"
                className="max-w-6xl mx-auto px-4 py-8 sm:px-6"
                role="main"
                aria-label="Dashboard overview"
            >
                {/* Stats Cards */}
                <section
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
                    aria-label="Assignment statistics"
                >
                    <Card
                        className="border-2 hover:shadow-lg transition-shadow"
                        role="region"
                        aria-label="Pending assignments count"
                    >
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Clock className="h-4 w-4" aria-hidden="true" />
                                Pending Assignments
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-orange-600">{pendingCount}</div>
                            <p className="text-sm text-muted-foreground mt-1">Need attention</p>
                        </CardContent>
                    </Card>

                    <Card
                        className="border-2 hover:shadow-lg transition-shadow"
                        role="region"
                        aria-label="Completed assignments count"
                    >
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                                Completed
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-600">{completedCount}</div>
                            <p className="text-sm text-muted-foreground mt-1">Great progress!</p>
                        </CardContent>
                    </Card>

                    <Card
                        className="border-2 hover:shadow-lg transition-shadow"
                        role="region"
                        aria-label="Total assignments count"
                    >
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <BookOpen className="h-4 w-4" aria-hidden="true" />
                                Total Assignments
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-indigo-600">{assignments.length}</div>
                            <p className="text-sm text-muted-foreground mt-1">This semester</p>
                        </CardContent>
                    </Card>
                </section>

                {/* Quick Actions */}
                <section
                    className="mb-8"
                    aria-labelledby="quick-actions-heading"
                >
                    <h2 id="quick-actions-heading" className="text-2xl font-bold mb-4">
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Link
                            to={createPageUrl('Assignments')}
                            className="block focus:outline-none focus:ring-4 focus:ring-indigo-300 rounded-lg"
                            aria-label="View all assignments"
                            onFocus={() => settings.voiceEnabled && speak('View assignments button')}
                        >
                            <Card className="border-2 hover:border-indigo-500 hover:shadow-lg transition-all cursor-pointer">
                                <CardContent className="p-6 flex items-center gap-4">
                                    <div className="p-3 bg-indigo-100 rounded-full">
                                        <BookOpen className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">View Assignments</h3>
                                        <p className="text-sm text-muted-foreground">See all your coursework</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>

                        <Card
                            className="border-2 hover:border-purple-500 hover:shadow-lg transition-all cursor-pointer"
                            role="button"
                            tabIndex={0}
                            aria-label="View calendar"
                            onFocus={() => settings.voiceEnabled && speak('Calendar button')}
                        >
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="p-3 bg-purple-100 rounded-full">
                                    <Calendar className="h-6 w-6 text-purple-600" aria-hidden="true" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">Calendar</h3>
                                    <p className="text-sm text-muted-foreground">View upcoming deadlines</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Create Assignment Button */}
                        <Card
                            className="border-2 hover:border-green-500 hover:shadow-lg transition-all cursor-pointer"
                            role="button"
                            tabIndex={0}
                            aria-label="Create new assignment"
                            onClick={openCreateModal}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openCreateModal(); }}
                            onFocus={() => settings.voiceEnabled && speak('Create new assignment button')}
                        >
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="p-3 bg-green-100 rounded-full">
                                    <Plus className="h-6 w-6 text-green-600" aria-hidden="true" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">Create Assignment</h3>
                                    <p className="text-sm text-muted-foreground">Add new coursework</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* Upcoming Deadlines */}
                <section aria-labelledby="upcoming-heading">
                    <h2 id="upcoming-heading" className="text-2xl font-bold mb-4">
                        Upcoming Deadlines
                    </h2>
                    {pendingCount === 0 ? (
                        <Card className="border-2">
                            <CardContent className="p-8 text-center">
                                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" aria-hidden="true" />
                                <p className="text-lg text-muted-foreground">No pending assignments. You're all caught up!</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4" role="list">
                            {assignments
                                .filter(a => a.status === 'pending')
                                .slice(0, 3)
                                .map((assignment) => {
                                    const hasDueDate = assignment.due_date && !isNaN(new Date(assignment.due_date).getTime());
                                    const dueDateFormatted = hasDueDate ? format(new Date(assignment.due_date), 'MMMM d') : 'No due date';
                                    const dueDateShort = hasDueDate ? format(new Date(assignment.due_date), 'MMM d, yyyy') : 'No due date';

                                    return (
                                        <Link
                                            key={assignment.id || assignment._id}
                                            to={`${createPageUrl('AssignmentDetail')}?id=${assignment.id || assignment._id}`}
                                            className="block focus:outline-none focus:ring-4 focus:ring-indigo-300 rounded-lg"
                                            role="listitem"
                                            aria-label={`${assignment.title}, ${assignment.subject}, due ${dueDateFormatted}`}
                                            onFocus={() => settings.voiceEnabled && speak(`${assignment.title}, due ${dueDateFormatted}`)}
                                        >
                                            <Card className="border-2 hover:border-indigo-500 hover:shadow-lg transition-all">
                                                <CardContent className="p-6">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1">
                                                            <h3 className="font-semibold text-lg mb-1">{assignment.title}</h3>
                                                            <p className="text-sm text-muted-foreground mb-3">{assignment.subject}</p>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <Badge variant="outline" className="text-sm">
                                                                    <Calendar className="h-3 w-3 mr-1" aria-hidden="true" />
                                                                    {hasDueDate ? `Due ${dueDateShort}` : 'No due date'}
                                                                </Badge>
                                                                {assignment.priority === 'high' && (
                                                                    <Badge className="bg-red-100 text-red-800 border-red-200">
                                                                        High Priority
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    );
                                })}
                        </div>
                    )}
                </section>
            </main>

            {/* Footer */}
            <footer
                className={`mt-16 py-6 border-t-2 ${settings.highContrast
                    ? 'bg-gray-900 border-gray-700'
                    : 'bg-white border-gray-200'
                    }`}
                role="contentinfo"
            >
                <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        Voice-controlled accessible student dashboard. Press Tab to navigate, Enter to select.
                    </p>
                </div>
            </footer>

            {/* Click to Start Overlay */}
            {
                !hasInteracted && (
                    <div
                        ref={(el) => {
                            // Combine refs if needed, or just use this one for the overlay
                            if (el) el.focus();
                        }}
                        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer outline-none"
                        onClick={handleStartInteraction}
                        tabIndex={0}
                        aria-label="Welcome screen. Click or press Enter or Space to start."
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                handleStartInteraction();
                            }
                        }}
                    >
                        <div className="text-center space-y-4">
                            <div className="p-4 bg-primary/10 rounded-full inline-block animate-pulse">
                                <Volume2 className="h-12 w-12 text-primary" />
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight">Welcome to Saarthi</h2>
                            <p className="text-xl text-muted-foreground">Click anywhere or press Enter or Space to start</p>
                        </div>
                    </div>
                )
            }

            {/* Create Assignment Modal */}
            <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                <DialogContent
                    className={`sm:max-w-lg max-h-[90vh] overflow-y-auto ${settings.highContrast ? 'bg-gray-900 text-white' : ''}`}
                    aria-describedby="create-assignment-description"
                >
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Create New Assignment</DialogTitle>
                        <p id="create-assignment-description" className="text-sm text-muted-foreground">
                            Fill in the details below. Title and Subject are required.
                        </p>
                    </DialogHeader>

                    <form onSubmit={handleCreateAssignment} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="assignment-title" className="block font-semibold">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="assignment-title"
                                type="text"
                                className="w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={newAssignment.title}
                                onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                                onFocus={() => settings.voiceEnabled && speak('Title field. Enter assignment title.')}
                                placeholder="e.g., Math Homework Chapter 5"
                                required
                                aria-required="true"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="assignment-subject" className="block font-semibold">
                                Subject <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="assignment-subject"
                                type="text"
                                className="w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={newAssignment.subject}
                                onChange={(e) => setNewAssignment({ ...newAssignment, subject: e.target.value })}
                                onFocus={() => settings.voiceEnabled && speak('Subject field. Enter the subject name.')}
                                placeholder="e.g., Mathematics"
                                required
                                aria-required="true"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="assignment-duedate" className="block font-semibold">
                                Due Date
                            </label>
                            <input
                                id="assignment-duedate"
                                type="date"
                                className="w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={newAssignment.dueDate}
                                onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                                onFocus={() => settings.voiceEnabled && speak('Due date field. Select or type the due date.')}
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="assignment-priority" className="block font-semibold">
                                Priority
                            </label>
                            <select
                                id="assignment-priority"
                                className="w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={newAssignment.priority}
                                onChange={(e) => setNewAssignment({ ...newAssignment, priority: e.target.value })}
                                onFocus={() => settings.voiceEnabled && speak('Priority field. Select low, medium, or high.')}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="assignment-description" className="block font-semibold">
                                Description
                            </label>
                            <textarea
                                id="assignment-description"
                                className="w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[80px]"
                                value={newAssignment.description}
                                onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                                onFocus={() => settings.voiceEnabled && speak('Description field. Add any additional details.')}
                                placeholder="Add any additional details..."
                            />
                        </div>

                        <DialogFooter className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setCreateModalOpen(false);
                                    speak('Cancelled. Modal closed.');
                                }}
                                onFocus={() => settings.voiceEnabled && speak('Cancel button')}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                disabled={createAssignmentMutation.isPending}
                                onFocus={() => settings.voiceEnabled && speak('Create assignment button. Press Enter to submit.')}
                            >
                                {createAssignmentMutation.isPending ? 'Creating...' : 'Create Assignment'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div >
    );
}