import React, { useEffect, useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, BookOpen, Calendar, CheckCircle2, Clock, Settings, Plus, Circle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AccessibilitySettings from '@/components/accessibility/AccessibilitySettings';
import VoiceController, { speak } from '@/components/voice/VoiceController';
import { format } from 'date-fns';
import axios from 'axios';
import { API_ENDPOINTS } from '@/config/api';

export default function Assignments() {
    const navigate = useNavigate();
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('accessibilitySettings');
        return saved ? JSON.parse(saved) : { highContrast: false, fontSize: 16, voiceEnabled: true };
    });
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('all');

    // New Assignment State
    const [newTitle, setNewTitle] = useState('');
    const [newSubject, setNewSubject] = useState('');

    const hasAnnouncedRef = useRef(false);
    const mainHeadingRef = useRef(null);
    const queryClient = useQueryClient();

    const { data: assignments = [] } = useQuery({
        queryKey: ['assignments'],
        queryFn: () => base44.entities.Assignment.list('-due_date')
    });

    const createMutation = useMutation({
        mutationFn: base44.entities.Assignment.create,
        onSuccess: () => {
            queryClient.invalidateQueries(['assignments']);
            setCreateOpen(false);
            setNewTitle('');
            setNewSubject('');
            speak("Assignment created successfully");
        }
    });

    // Get auth headers for API calls
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const authHeaders = userInfo.token ? { Authorization: `Bearer ${userInfo.token}` } : {};

    // Status update mutation
    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }) => {
            const response = await axios.put(`${API_ENDPOINTS.ASSIGNMENTS}/${id}`, { status }, {
                headers: authHeaders
            });
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries(['assignments']);
            const statusText = variables.status === 'completed' ? 'marked as complete' : 'marked as pending';
            speak(`Assignment ${statusText}`);
        },
        onError: (error) => {
            speak('Error updating assignment status.');
            console.error('Update status error:', error);
        }
    });

    const pending = assignments.filter(a => a.status === 'pending');
    const completed = assignments.filter(a => a.status === 'completed');

    useEffect(() => {
        localStorage.setItem('accessibilitySettings', JSON.stringify(settings));
        document.documentElement.style.fontSize = `${settings.fontSize}px`;
    }, [settings]);

    useEffect(() => {
        if (settings.voiceEnabled && !hasAnnouncedRef.current && assignments.length > 0) {
            hasAnnouncedRef.current = true;
            setTimeout(() => {
                if (pending.length > 0) {
                    // List all pending assignment titles
                    const allTitles = pending.slice(0, 5).map(a => a.title).join(', ');
                    const moreText = pending.length > 5 ? ` and ${pending.length - 5} more` : '';
                    speak(`You have ${pending.length} pending assignments: ${allTitles}${moreText}. Say an assignment title to hear details. To mark complete, say "complete" followed by the title, for example "complete ${pending[0].title}".`);
                } else {
                    speak('You have no pending assignments. Say "create assignment" to add a new one.');
                }
            }, 500);
        }

        if (mainHeadingRef.current) {
            mainHeadingRef.current.focus();
        }
    }, [settings.voiceEnabled, assignments, pending]);

    // Find assignment by title (fuzzy match)
    const findAssignmentByTitle = (searchTitle) => {
        try {
            if (!searchTitle || !assignments || assignments.length === 0) {
                return null;
            }
            const lowerSearch = searchTitle.toLowerCase();
            return assignments.find(a =>
                a.title && (
                    a.title.toLowerCase().includes(lowerSearch) ||
                    lowerSearch.includes(a.title.toLowerCase())
                )
            );
        } catch (error) {
            console.error('Error finding assignment:', error);
            return null;
        }
    };

    const handleVoiceCommand = (command) => {
        try {
            if (command === 'read_page' || command.includes('list all') || command.includes('read all')) {
                // List all assignments with details
                if (!assignments || assignments.length === 0) {
                    speak('You have no assignments.');
                    return;
                }
                let summary = `You have ${pending.length} pending and ${completed.length} completed assignments. `;
                pending.forEach((a, i) => {
                    const hasDueDate = a.due_date && !isNaN(new Date(a.due_date).getTime());
                    const dueText = hasDueDate ? `due ${format(new Date(a.due_date), 'MMMM d')}` : 'no due date';
                    summary += `${i + 1}. ${a.title}, ${dueText}. `;
                });
                summary += `Say an assignment title to hear more details. Say "mark complete" to complete first pending.`;
                speak(summary);
            } else if (command.includes('mark complete') || command.includes('complete assignment')) {
                // Mark the first pending assignment as complete
                if (pending.length > 0) {
                    const firstPending = pending[0];
                    speak(`Marking ${firstPending.title} as complete.`);
                    updateStatusMutation.mutate({
                        id: firstPending.id || firstPending._id,
                        status: 'completed'
                    });
                } else {
                    speak('No pending assignments to mark as complete.');
                }
            } else if (command.includes('mark pending') || command.includes('undo complete')) {
                // Mark the first completed assignment as pending
                if (completed.length > 0) {
                    const firstCompleted = completed[0];
                    speak(`Marking ${firstCompleted.title} as pending.`);
                    updateStatusMutation.mutate({
                        id: firstCompleted.id || firstCompleted._id,
                        status: 'pending'
                    });
                } else {
                    speak('No completed assignments to mark as pending.');
                }
            } else if (command.startsWith('complete ') || command.includes('complete ')) {
                // User said "complete [title]" - complete specific assignment
                const titlePart = command.replace('complete', '').trim();
                const targetAssignment = findAssignmentByTitle(titlePart);
                if (targetAssignment) {
                    if (targetAssignment.status === 'completed') {
                        speak(`${targetAssignment.title} is already completed.`);
                    } else {
                        speak(`Marking ${targetAssignment.title} as complete.`);
                        updateStatusMutation.mutate({
                            id: targetAssignment.id || targetAssignment._id,
                            status: 'completed'
                        });
                    }
                } else {
                    speak(`Assignment not found. Say "list all" to hear your assignments.`);
                }
            } else if (command === 'create_assignment' || command.includes('create') || command.includes('add')) {
                setCreateOpen(true);
                speak("Opening create assignment form. Please fill in the title and subject.");
            } else if (command && command.length > 2) {
                // Try to find assignment by title
                const foundAssignment = findAssignmentByTitle(command);
                if (foundAssignment) {
                    const hasDueDate = foundAssignment.due_date && !isNaN(new Date(foundAssignment.due_date).getTime());
                    const dueText = hasDueDate ? `due ${format(new Date(foundAssignment.due_date), 'MMMM d')}` : 'no due date';
                    const statusText = foundAssignment.status === 'completed' ? 'completed' : 'pending';

                    if (foundAssignment.status === 'pending') {
                        speak(`${foundAssignment.title}. ${foundAssignment.subject}. ${dueText}. Status: ${statusText}. Say "complete ${foundAssignment.title}" to mark it complete.`);
                    } else {
                        speak(`${foundAssignment.title}. ${foundAssignment.subject}. ${dueText}. Status: ${statusText}. This assignment is already completed.`);
                    }
                } else {
                    speak(`Assignment "${command}" not found. Say "list all" to hear your assignments.`);
                }
            }
        } catch (error) {
            console.error('Voice command error:', error);
            speak('Sorry, there was an error processing your command. Please try again.');
        }
    };

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate({
            title: newTitle,
            subject: newSubject,
            due_date: new Date().toISOString(), // Default to today
            priority: 'medium',
            description: 'Created via Dashboard'
        });
    };

    const renderAssignments = (list) => {
        if (list.length === 0) {
            return (
                <Card className="border-2">
                    <CardContent className="p-8 text-center">
                        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
                        <p className="text-lg text-muted-foreground">No assignments in this category</p>
                    </CardContent>
                </Card>
            );
        }

        return (
            <div className="space-y-4" role="list">
                {list.map((assignment, index) => {
                    const hasDueDate = assignment.due_date && !isNaN(new Date(assignment.due_date).getTime());
                    const dueDateFormatted = hasDueDate ? format(new Date(assignment.due_date), 'MMMM d') : 'No due date';
                    const dueDateShort = hasDueDate ? format(new Date(assignment.due_date), 'MMM d, yyyy') : 'No due date';

                    return (
                        <Link
                            key={assignment.id || assignment._id}
                            to={`${createPageUrl('AssignmentDetail')}?id=${assignment.id || assignment._id}`}
                            className="block focus:outline-none focus:ring-4 focus:ring-indigo-300 rounded-lg"
                            role="listitem"
                            aria-label={`Assignment ${index + 1}: ${assignment.title}, ${assignment.subject}, ${hasDueDate ? 'due ' + dueDateFormatted : 'no due date'}`}
                            onFocus={() => settings.voiceEnabled && speak(`${assignment.title}, ${assignment.subject}, ${hasDueDate ? 'due ' + dueDateFormatted : 'no due date'}`)}
                        >
                            <Card className="border-2 hover:border-indigo-500 hover:shadow-lg transition-all">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-xl mb-2">{assignment.title}</h3>
                                            <p className="text-base text-muted-foreground mb-3">{assignment.subject}</p>
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
                                                {assignment.status === 'completed' && (
                                                    <Badge className="bg-green-100 text-green-800 border-green-200">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" aria-hidden="true" />
                                                        Completed
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        {/* Mark Complete/Pending Button */}
                                        <Button
                                            variant={assignment.status === 'completed' ? 'outline' : 'default'}
                                            size="sm"
                                            className={assignment.status === 'completed'
                                                ? 'border-yellow-500 text-yellow-700 hover:bg-yellow-50'
                                                : 'bg-green-600 hover:bg-green-700 text-white'}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                const newStatus = assignment.status === 'completed' ? 'pending' : 'completed';
                                                updateStatusMutation.mutate({
                                                    id: assignment.id || assignment._id,
                                                    status: newStatus
                                                });
                                            }}
                                            onFocus={() => settings.voiceEnabled && speak(
                                                assignment.status === 'completed'
                                                    ? 'Mark as pending button'
                                                    : 'Mark as complete button'
                                            )}
                                            aria-label={assignment.status === 'completed'
                                                ? 'Mark assignment as pending'
                                                : 'Mark assignment as complete'}
                                            disabled={updateStatusMutation.isPending}
                                        >
                                            {assignment.status === 'completed' ? (
                                                <><Circle className="h-4 w-4 mr-1" /> Mark Pending</>
                                            ) : (
                                                <><CheckCircle2 className="h-4 w-4 mr-1" /> Mark Complete</>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>
        );
    };

    return (
        <div
            className={`min-h-screen transition-colors ${settings.highContrast
                ? 'bg-gray-950 text-white'
                : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'
                }`}
        >
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-4 focus:ring-indigo-300"
            >
                Skip to main content
            </a>

            <header
                className={`sticky top-0 z-40 border-b-2 ${settings.highContrast
                    ? 'bg-gray-900 border-gray-700'
                    : 'bg-white/95 backdrop-blur-sm border-gray-200'
                    }`}
                role="banner"
            >
                <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Link
                                to={createPageUrl('Dashboard')}
                                aria-label="Go back to dashboard"
                                className="focus:outline-none focus:ring-4 focus:ring-indigo-300 rounded-lg"
                                onFocus={() => settings.voiceEnabled && speak('Back to dashboard button')}
                            >
                                <Button variant="ghost" size="icon">
                                    <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                                </Button>
                            </Link>
                            <h1
                                ref={mainHeadingRef}
                                tabIndex={-1}
                                className="text-2xl sm:text-3xl font-bold tracking-tight outline-none"
                            >
                                My Assignments
                            </h1>
                        </div>

                        <div className="flex items-center gap-2">
                            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="default"
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                                        aria-label="Create new assignment"
                                        onClick={() => speak("Create Assignment Form. Enter Title.")}
                                    >
                                        <Plus className="h-5 w-5" />
                                        <span className="hidden sm:inline">New</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Create Assignment</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleCreateSubmit} className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <label htmlFor="title" className="text-lg font-medium">Title</label>
                                            <input
                                                id="title"
                                                className="w-full p-2 border rounded-md"
                                                value={newTitle}
                                                onChange={(e) => setNewTitle(e.target.value)}
                                                placeholder="Math Homework"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="subject" className="text-lg font-medium">Subject</label>
                                            <input
                                                id="subject"
                                                className="w-full p-2 border rounded-md"
                                                value={newSubject}
                                                onChange={(e) => setNewSubject(e.target.value)}
                                                placeholder="Mathematics"
                                                required
                                            />
                                        </div>
                                        <Button type="submit" className="w-full text-lg py-6">Create Assignment</Button>
                                    </form>
                                </DialogContent>
                            </Dialog>

                            <VoiceController
                                voiceEnabled={settings.voiceEnabled}
                                onCommand={handleVoiceCommand}
                            />

                            <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="outline" className="gap-2" aria-label="Open settings">
                                        <Settings className="h-5 w-5" aria-hidden="true" />
                                        <span className="hidden sm:inline">Settings</span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent
                                    side="right"
                                    className={`w-full sm:max-w-md ${settings.highContrast ? 'bg-gray-900 text-white' : ''}`}
                                >
                                    <div className="mt-6">
                                        <AccessibilitySettings settings={settings} onSettingsChange={setSettings} />
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </header>

            <main
                id="main-content"
                className="max-w-6xl mx-auto px-4 py-8 sm:px-6"
                role="main"
            >
                <Tabs
                    value={activeTab}
                    onValueChange={(val) => {
                        setActiveTab(val);
                        if (settings.voiceEnabled) {
                            const count = val === 'all' ? assignments.length : val === 'pending' ? pending.length : completed.length;
                            speak(`Showing ${count} ${val} assignments`);
                        }
                    }}
                    className="w-full"
                >
                    <TabsList
                        className="w-full h-auto p-1 bg-gray-100 rounded-xl grid grid-cols-3 gap-1 mb-6"
                        aria-label="Filter assignments by status"
                    >
                        <TabsTrigger value="all" className="h-12 text-base data-[state=active]:bg-white rounded-lg">
                            <BookOpen className="h-4 w-4 mr-2" aria-hidden="true" />
                            All ({assignments.length})
                        </TabsTrigger>
                        <TabsTrigger value="pending" className="h-12 text-base data-[state=active]:bg-white rounded-lg">
                            <Clock className="h-4 w-4 mr-2" aria-hidden="true" />
                            Pending ({pending.length})
                        </TabsTrigger>
                        <TabsTrigger value="completed" className="h-12 text-base data-[state=active]:bg-white rounded-lg">
                            <CheckCircle2 className="h-4 w-4 mr-2" aria-hidden="true" />
                            Completed ({completed.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="all">{renderAssignments(assignments)}</TabsContent>
                    <TabsContent value="pending">{renderAssignments(pending)}</TabsContent>
                    <TabsContent value="completed">{renderAssignments(completed)}</TabsContent>
                </Tabs>
            </main>
        </div>
    );
}