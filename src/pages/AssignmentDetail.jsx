import React, { useEffect, useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Calendar, CheckCircle2, Clock, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import AccessibilitySettings from '@/components/accessibility/AccessibilitySettings';
import VoiceController, { speak } from '@/components/voice/VoiceController';
import { format } from 'date-fns';

export default function AssignmentDetail() {
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('accessibilitySettings');
        return saved ? JSON.parse(saved) : { highContrast: false, fontSize: 16, voiceEnabled: true };
    });
    const [settingsOpen, setSettingsOpen] = useState(false);
    const hasAnnouncedRef = useRef(false);
    const mainHeadingRef = useRef(null);

    const urlParams = new URLSearchParams(window.location.search);
    const assignmentId = urlParams.get('id');

    const queryClient = useQueryClient();

    const { data: assignment, isLoading } = useQuery({
        queryKey: ['assignment', assignmentId],
        queryFn: async () => {
            const all = await base44.entities.Assignment.list();
            const found = all.find(a => (a.id === assignmentId) || (a._id === assignmentId));
            return found || null; // Return null instead of undefined
        },
        enabled: !!assignmentId
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => base44.entities.Assignment.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] });
            queryClient.invalidateQueries({ queryKey: ['assignments'] });
        }
    });

    useEffect(() => {
        localStorage.setItem('accessibilitySettings', JSON.stringify(settings));
        document.documentElement.style.fontSize = `${settings.fontSize}px`;
    }, [settings]);

    useEffect(() => {
        if (settings.voiceEnabled && !hasAnnouncedRef.current && assignment) {
            hasAnnouncedRef.current = true;
            setTimeout(() => {
                const statusText = assignment.status === 'completed' ? 'completed' : 'pending';
                const hasDueDate = assignment.due_date && !isNaN(new Date(assignment.due_date).getTime());
                const dueDateText = hasDueDate ? format(new Date(assignment.due_date), 'MMMM d, yyyy') : 'no due date';
                speak(`Assignment details. ${assignment.title}. ${assignment.subject}. ${hasDueDate ? 'Due ' + dueDateText : 'No due date'}. Status: ${statusText}. ${assignment.description || 'No additional description.'}`);
            }, 500);
        }

        if (mainHeadingRef.current) {
            mainHeadingRef.current.focus();
        }
    }, [settings.voiceEnabled, assignment]);

    const handleVoiceCommand = (command) => {
        if (!assignment) return;

        if (command === 'read_page') {
            const hasDueDate = assignment.due_date && !isNaN(new Date(assignment.due_date).getTime());
            const dueDateText = hasDueDate ? format(new Date(assignment.due_date), 'MMMM d, yyyy') : 'no due date';
            const content = `${assignment.title}. ${assignment.subject}. ${hasDueDate ? 'Due ' + dueDateText : 'No due date'}. ${assignment.description || 'No description.'}`;
            speak(content);
        } else if (
            command.includes('mark complete') ||
            command.includes('mark as complete') ||
            command.includes('completed') ||
            command.includes('finished') ||
            command.includes('mark as done') ||
            command.includes('done')
        ) {
            handleMarkComplete();
        } else if (
            command.includes('mark pending') ||
            command.includes('mark as pending') ||
            command.includes('not done') ||
            command.includes('incomplete')
        ) {
            handleMarkPending();
        }
    };

    const handleMarkComplete = () => {
        if (!assignment) return;
        updateMutation.mutate({
            id: assignment.id || assignment._id,
            data: { status: 'completed' }
        });
        if (settings.voiceEnabled) {
            speak('Assignment marked as completed');
        }
    };

    const handleMarkPending = () => {
        if (!assignment) return;
        updateMutation.mutate({
            id: assignment.id || assignment._id,
            data: { status: 'pending' }
        });
        if (settings.voiceEnabled) {
            speak('Assignment marked as pending');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg">Loading assignment...</p>
            </div>
        );
    }

    if (!assignment) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-lg">Assignment not found</p>
                <Link to={createPageUrl('Assignments')} className="text-indigo-600 underline">Back to Assignments</Link>
            </div>
        );
    }

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
                <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => window.history.back()}
                                aria-label="Go back"
                                onFocus={() => settings.voiceEnabled && speak('Back button')}
                            >
                                <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                            </Button>
                            <h1
                                ref={mainHeadingRef}
                                tabIndex={-1}
                                className="text-xl sm:text-2xl font-bold tracking-tight outline-none"
                            >
                                Assignment Details
                            </h1>
                        </div>

                        <div className="flex items-center gap-2">
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
                className="max-w-4xl mx-auto px-4 py-8 sm:px-6"
                role="main"
            >
                <Card className="border-2 mb-6">
                    <CardHeader className="pb-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <CardTitle className="text-2xl sm:text-3xl mb-2">{assignment.title}</CardTitle>
                                <p className="text-lg text-muted-foreground">{assignment.subject}</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-base py-1.5 px-3">
                                <Calendar className="h-4 w-4 mr-1" aria-hidden="true" />
                                {assignment.due_date && !isNaN(new Date(assignment.due_date).getTime())
                                    ? `Due ${format(new Date(assignment.due_date), 'MMMM d, yyyy')}`
                                    : 'No due date'}
                            </Badge>
                            {assignment.priority === 'high' && (
                                <Badge className="bg-red-100 text-red-800 border-red-200 text-base py-1.5 px-3">
                                    High Priority
                                </Badge>
                            )}
                            {assignment.status === 'completed' ? (
                                <Badge className="bg-green-100 text-green-800 border-green-200 text-base py-1.5 px-3">
                                    <CheckCircle2 className="h-4 w-4 mr-1" aria-hidden="true" />
                                    Completed
                                </Badge>
                            ) : (
                                <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-base py-1.5 px-3">
                                    <Clock className="h-4 w-4 mr-1" aria-hidden="true" />
                                    Pending
                                </Badge>
                            )}
                        </div>

                        <div>
                            <h2 className="text-xl font-semibold mb-3">Description</h2>
                            <p className="text-base leading-relaxed">
                                {assignment.description || 'No description provided for this assignment.'}
                            </p>
                        </div>

                        <div className="flex gap-3 pt-4">
                            {assignment.status === 'completed' ? (
                                <Button
                                    onClick={handleMarkPending}
                                    variant="outline"
                                    className="flex-1 h-12 text-base"
                                    aria-label="Mark assignment as pending"
                                    onFocus={() => settings.voiceEnabled && speak('Mark as pending button')}
                                >
                                    <Clock className="h-5 w-5 mr-2" aria-hidden="true" />
                                    Mark as Pending
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleMarkComplete}
                                    className="flex-1 h-12 text-base bg-green-600 hover:bg-green-700"
                                    aria-label="Mark assignment as complete"
                                    onFocus={() => settings.voiceEnabled && speak('Mark as complete button')}
                                >
                                    <CheckCircle2 className="h-5 w-5 mr-2" aria-hidden="true" />
                                    Mark as Complete
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}