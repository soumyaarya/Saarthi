import React, { useEffect, useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, FileText, Settings, Plus, Trash2, Mic } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import AccessibilitySettings from '@/components/accessibility/AccessibilitySettings';
import VoiceController, { speak } from '@/components/voice/VoiceController';
import { format } from 'date-fns';
import axios from 'axios';
import { API_ENDPOINTS } from '@/config/api';

export default function Notes() {
    const navigate = useNavigate();
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('accessibilitySettings');
        return saved ? JSON.parse(saved) : { highContrast: false, fontSize: 16, voiceEnabled: true, screenReaderMode: false };
    });
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);

    // New Note State
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');

    // Dictation state
    const [isDictatingTitle, setIsDictatingTitle] = useState(false);
    const [isDictatingContent, setIsDictatingContent] = useState(false);

    const hasAnnouncedRef = useRef(false);
    const mainHeadingRef = useRef(null);
    const queryClient = useQueryClient();

    // Get user info and auth headers
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const authHeaders = userInfo.token ? { Authorization: `Bearer ${userInfo.token}` } : {};

    // Fetch notes
    const { data: notes = [], isLoading } = useQuery({
        queryKey: ['notes'],
        queryFn: async () => {
            if (!userInfo.token) return [];
            const response = await axios.get(API_ENDPOINTS.NOTES, {
                headers: authHeaders
            });
            return response.data;
        },
        enabled: !!userInfo.token
    });

    // Create note mutation
    const createMutation = useMutation({
        mutationFn: async (noteData) => {
            const response = await axios.post(API_ENDPOINTS.NOTES, noteData, {
                headers: authHeaders
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['notes']);
            setCreateOpen(false);
            setNewTitle('');
            setNewContent('');
            speak("Note created successfully");
        },
        onError: (error) => {
            speak('Error creating note. Please try again.');
            console.error('Create note error:', error);
        }
    });

    // Delete note mutation
    const deleteMutation = useMutation({
        mutationFn: async (noteId) => {
            const response = await axios.delete(`${API_ENDPOINTS.NOTES}/${noteId}`, {
                headers: authHeaders
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['notes']);
            speak("Note deleted");
        },
        onError: (error) => {
            speak('Error deleting note.');
            console.error('Delete note error:', error);
        }
    });

    useEffect(() => {
        localStorage.setItem('accessibilitySettings', JSON.stringify(settings));
        document.documentElement.style.fontSize = `${settings.fontSize}px`;
    }, [settings]);

    useEffect(() => {
        if (settings.voiceEnabled && !hasAnnouncedRef.current && !isLoading) {
            hasAnnouncedRef.current = true;
            setTimeout(() => {
                if (notes.length > 0) {
                    const titles = notes.slice(0, 5).map(n => n.title).join(', ');
                    const moreText = notes.length > 5 ? ` and ${notes.length - 5} more` : '';
                    speak(`You have ${notes.length} notes: ${titles}${moreText}. Say a note title to hear its content. Say "create note" to add a new one.`);
                } else {
                    speak('You have no notes. Say "create note" to add your first note.');
                }
            }, 500);
        }

        if (mainHeadingRef.current) {
            mainHeadingRef.current.focus();
        }
    }, [settings.voiceEnabled, notes, isLoading]);

    // Find note by title (fuzzy match)
    const findNoteByTitle = (searchTitle) => {
        if (!searchTitle || !notes || notes.length === 0) return null;
        const lowerSearch = searchTitle.toLowerCase();
        return notes.find(n =>
            n.title && (
                n.title.toLowerCase().includes(lowerSearch) ||
                lowerSearch.includes(n.title.toLowerCase())
            )
        );
    };

    const handleVoiceCommand = (command) => {
        if (command === 'read_page' || command.includes('list all') || command.includes('read all') || command.includes('list notes')) {
            if (!notes || notes.length === 0) {
                speak('You have no notes.');
                return;
            }
            let summary = `You have ${notes.length} notes. `;
            notes.forEach((n, i) => {
                summary += `${i + 1}. ${n.title}. `;
            });
            summary += `Say a note title to hear its content.`;
            speak(summary);
        } else if (command === 'create_note' || command.includes('create note') || command.includes('new note') || command.includes('add note')) {
            setCreateOpen(true);
            speak("Opening create note form. Enter a title and content.");
        } else if (command.startsWith('delete ')) {
            const titlePart = command.replace('delete', '').trim();
            const targetNote = findNoteByTitle(titlePart);
            if (targetNote) {
                speak(`Deleting note: ${targetNote.title}`);
                deleteMutation.mutate(targetNote._id);
            } else {
                speak(`Note not found. Say "list notes" to hear your notes.`);
            }
        } else if (command && command.length > 2) {
            // Try to find note by title and read it
            const foundNote = findNoteByTitle(command);
            if (foundNote) {
                speak(`${foundNote.title}. ${foundNote.content}. Say "delete ${foundNote.title}" to delete this note.`);
            } else {
                speak(`Note "${command}" not found. Say "list notes" to hear your notes.`);
            }
        }
    };

    // Voice dictation function for single field
    const startDictation = (field, callback) => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            speak('Voice dictation is not supported in this browser.');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        if (field === 'title') {
            setIsDictatingTitle(true);
        } else {
            setIsDictatingContent(true);
        }

        recognition.start();

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (field === 'title') {
                setNewTitle(prev => prev + (prev ? ' ' : '') + transcript);
                setIsDictatingTitle(false);
                speak(`Title set to: ${transcript}. Now click the microphone next to content to speak your note.`);
                if (callback) callback(transcript);
            } else {
                setNewContent(prev => prev + (prev ? ' ' : '') + transcript);
                setIsDictatingContent(false);
                speak(`Content added: ${transcript}. Click Create Note to save, or click the microphone to add more.`);
                if (callback) callback(transcript);
            }
        };

        recognition.onerror = (event) => {
            console.error('Dictation error:', event.error);
            speak('Could not hear you. Click the microphone to try again.');
            setIsDictatingTitle(false);
            setIsDictatingContent(false);
        };

        recognition.onend = () => {
            setIsDictatingTitle(false);
            setIsDictatingContent(false);
        };
    };

    // Start the voice-driven note creation flow
    const startVoiceNoteFlow = () => {
        speak('Create Note. Click the microphone button next to title, speak your title, then click the microphone next to content and speak your note. Finally click Create Note to save.');
    };

    // Open create dialog and start voice flow
    const openCreateWithVoice = () => {
        setCreateOpen(true);
        setTimeout(() => {
            startVoiceNoteFlow();
        }, 500);
    };

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        if (!newTitle.trim() || !newContent.trim()) {
            speak('Please enter both title and content.');
            return;
        }
        createMutation.mutate({
            title: newTitle,
            content: newContent
        });
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
                                My Notes
                            </h1>
                        </div>

                        <div className="flex items-center gap-2">
                            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                                <Button
                                    variant="default"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                                    aria-label="Create new note"
                                    onClick={() => {
                                        setCreateOpen(true);
                                        speak("Create Note Form. Enter Title.");
                                    }}
                                >
                                    <Plus className="h-5 w-5" />
                                    <span className="hidden sm:inline">New</span>
                                </Button>
                                <DialogContent className={`sm:max-w-md ${settings.highContrast ? 'bg-gray-900 text-white' : ''}`}>
                                    <DialogHeader>
                                        <DialogTitle>Create Note</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleCreateSubmit} className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <label htmlFor="note-title" className="text-lg font-medium">Title</label>
                                            <div className="flex gap-2">
                                                <input
                                                    id="note-title"
                                                    className="flex-1 p-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                    value={newTitle}
                                                    onChange={(e) => setNewTitle(e.target.value)}
                                                    placeholder="My Study Notes"
                                                    required
                                                    onFocus={() => settings.voiceEnabled && speak('Title field. Click microphone to dictate.')}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className={`px-3 ${isDictatingTitle ? 'bg-red-100 text-red-600 animate-pulse' : ''}`}
                                                    onClick={() => startDictation('title')}
                                                    disabled={isDictatingTitle || isDictatingContent}
                                                    aria-label="Dictate title"
                                                >
                                                    <Mic className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="note-content" className="text-lg font-medium">Content</label>
                                            <div className="flex gap-2">
                                                <textarea
                                                    id="note-content"
                                                    className="flex-1 p-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500 min-h-[120px]"
                                                    value={newContent}
                                                    onChange={(e) => setNewContent(e.target.value)}
                                                    placeholder="Write your note here..."
                                                    required
                                                    onFocus={() => settings.voiceEnabled && speak('Content field. Click microphone to dictate.')}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className={`px-3 h-fit ${isDictatingContent ? 'bg-red-100 text-red-600 animate-pulse' : ''}`}
                                                    onClick={() => startDictation('content')}
                                                    disabled={isDictatingTitle || isDictatingContent}
                                                    aria-label="Dictate content"
                                                >
                                                    <Mic className="h-5 w-5" />
                                                </Button>
                                            </div>
                                            <p className="text-sm text-muted-foreground">Click the mic button to speak your note content</p>
                                        </div>
                                        <DialogFooter>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setCreateOpen(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                className="bg-indigo-600 hover:bg-indigo-700"
                                                disabled={createMutation.isPending}
                                            >
                                                {createMutation.isPending ? 'Creating...' : 'Create Note'}
                                            </Button>
                                        </DialogFooter>
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
                {isLoading ? (
                    <Card className="border-2">
                        <CardContent className="p-8 text-center">
                            <p className="text-lg text-muted-foreground">Loading notes...</p>
                        </CardContent>
                    </Card>
                ) : notes.length === 0 ? (
                    <Card className="border-2">
                        <CardContent className="p-8 text-center">
                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
                            <p className="text-lg text-muted-foreground">No notes yet. Click "New" or say "create note" to add one.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4" role="list">
                        {notes.map((note, index) => (
                            <Card
                                key={note._id}
                                className="border-2 hover:border-indigo-500 hover:shadow-lg transition-all cursor-pointer"
                                role="listitem"
                                tabIndex={0}
                                aria-label={`Note ${index + 1}: ${note.title}`}
                                onFocus={() => settings.voiceEnabled && speak(`${note.title}`)}
                                onClick={() => {
                                    speak(`${note.title}. ${note.content}`);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        speak(`${note.title}. ${note.content}`);
                                    }
                                }}
                            >
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-xl mb-2">{note.title}</h3>
                                            <p className="text-base text-muted-foreground line-clamp-2">{note.content}</p>
                                            <p className="text-sm text-muted-foreground mt-2">
                                                {note.createdAt && format(new Date(note.createdAt), 'MMM d, yyyy')}
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                speak(`Deleting ${note.title}`);
                                                deleteMutation.mutate(note._id);
                                            }}
                                            aria-label={`Delete ${note.title}`}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
