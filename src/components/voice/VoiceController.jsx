import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';

export function speak(text, rate = 0.9, onEnd) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;
        utterance.pitch = 1;
        utterance.volume = 1;
        if (onEnd) utterance.onend = onEnd;
        window.speechSynthesis.speak(utterance);
    }
}

export function stopSpeaking() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
}

export function getMenuText(pathname) {
    let menuText = `Available commands: 
        Say "create assignment" to add a new assignment.
        Say "open assignments" to view your assignments.
        Say "open notes" or "my notes" to view your notes.
        Say "create note" to add a new note.
        Say "open dashboard" to go to the dashboard. 
        Say "read page" to hear the current page content. 
        Say "go back" to navigate back.
        Say "logout" or "sign out" to logout.`;

    if (pathname === '/assignments' || pathname.includes('assignment')) {
        menuText += ` Say "mark complete" to complete first pending assignment. Say "mark pending" to undo.`;
    }

    if (pathname === '/notes') {
        menuText += ` Say a note title to hear its content. Say "delete" followed by the title to delete a note.`;
    }

    menuText += ` Say "stop speaking" to stop audio.`;
    return menuText;
}

export default function VoiceController({ voiceEnabled, onCommand }) {
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(true);
    const recognitionRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            setIsSupported(false);
        }
    }, []);

    const handleCommand = useCallback((command) => {
        // Stop listening immediately to prevent the mic from picking up the response
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }

        const lowerCommand = command.toLowerCase().trim();

        console.log('Voice command:', lowerCommand);
        console.log('Current Path:', location.pathname);
        console.log('Is Assignment Path?', location.pathname === '/assignment');

        // Stop speaking
        if (lowerCommand.includes('stop') || lowerCommand.includes('quiet')) {
            stopSpeaking();
            return;
        }

        // Menu
        if (lowerCommand.includes('menu') || lowerCommand.includes('help')) {
            speak(getMenuText(location.pathname));
            return;
        }

        // Create Assignment
        if (lowerCommand.includes('create assignment') ||
            lowerCommand.includes('new assignment') ||
            lowerCommand.includes('add assignment')) {
            speak('Opening create assignment form.');
            if (onCommand) {
                onCommand('create_assignment');
            }
            return;
        }

        // Navigation
        // Navigation
        if (lowerCommand.includes('open assignment') ||
            lowerCommand.includes('view assignment') ||
            lowerCommand.includes('go to assignment') ||
            lowerCommand === 'assignments') {
            speak('Opening assignments');
            navigate(createPageUrl('Assignments'));
            return;
        }

        // Notes navigation
        if (lowerCommand.includes('open note') ||
            lowerCommand.includes('my note') ||
            lowerCommand.includes('view note') ||
            lowerCommand === 'notes') {
            speak('Opening notes');
            navigate(createPageUrl('Notes'));
            return;
        }

        // Create note - also handle just "note" as it might mean create
        if (lowerCommand.includes('create note') ||
            lowerCommand.includes('new note') ||
            lowerCommand.includes('add note') ||
            lowerCommand === 'note' ||
            (lowerCommand.includes('note') && (lowerCommand.includes('create') || lowerCommand.includes('new') || lowerCommand.includes('add')))) {
            speak('Opening create note form.');
            if (onCommand) {
                onCommand('create_note');
            }
            navigate(createPageUrl('Notes'));
            return;
        }

        if (lowerCommand.includes('dashboard') ||
            lowerCommand === 'home' ||
            lowerCommand === 'go home' ||
            lowerCommand.includes('open home')) {
            speak('Opening dashboard');
            navigate(createPageUrl('Dashboard'));
            return;
        }

        if (lowerCommand === 'go back' || lowerCommand === 'back' || lowerCommand === 'go home') {
            speak('Going to dashboard');
            navigate(createPageUrl('Dashboard'));
            return;
        }

        // Read page
        if (lowerCommand.includes('read page') || lowerCommand.includes('read this')) {
            if (onCommand) {
                onCommand('read_page');
            }
            return;
        }

        // Pass to parent for page-specific commands
        if (onCommand) {
            onCommand(lowerCommand);
        } else {
            speak("Command not recognized. Say 'menu' to hear available options.");
        }
    }, [navigate, location, onCommand]);

    const startListening = useCallback(() => {
        if (!voiceEnabled) {
            speak('Voice control is disabled. Enable it in settings.');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log('Transcript:', transcript);
            handleCommand(transcript);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
            if (event.error === 'not-allowed') {
                speak('Microphone access denied. Please enable microphone permissions.');
            }
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
    }, [voiceEnabled, handleCommand]);

    useEffect(() => {
        const handleGlobalClick = (e) => {
            // Don't trigger if clicking on buttons, links, inputs, or our toggle button
            if (e.target.closest('button') ||
                e.target.closest('a') ||
                e.target.closest('input') ||
                e.target.closest('textarea') ||
                !voiceEnabled) {
                return;
            }

            // Toggle listening
            startListening();
        };

        const handleGlobalKeyDown = (e) => {
            // Press 'M' to speak menu commands
            if (e.key.toLowerCase() === 'm' &&
                voiceEnabled &&
                !e.target.closest('input') &&
                !e.target.closest('textarea')) {
                e.preventDefault();
                speak(getMenuText(location.pathname));
                return;
            }

            // Spacebar to toggle listening
            if ((e.code === 'Space' || e.code === 'Enter') &&
                voiceEnabled &&
                document.activeElement === document.body) {
                e.preventDefault();
                startListening();
            }
        };

        window.addEventListener('click', handleGlobalClick);
        window.addEventListener('keydown', handleGlobalKeyDown);

        return () => {
            window.removeEventListener('click', handleGlobalClick);
            window.removeEventListener('keydown', handleGlobalKeyDown);
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [voiceEnabled, startListening]);

    if (!isSupported) {
        return (
            <Button
                variant="outline"
                disabled
                className="gap-2"
                aria-label="Voice control not supported"
            >
                <MicOff className="h-5 w-5" aria-hidden="true" />
                <span className="hidden sm:inline">Not Supported</span>
            </Button>
        );
    }

    return (
        <Button
            onClick={startListening}
            disabled={!voiceEnabled}
            className={`gap-2 ${isListening ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            aria-label={isListening ? "Listening for voice command" : "Click to give voice command"}
            aria-pressed={isListening}
        >
            {isListening ? (
                <>
                    <Volume2 className="h-5 w-5 animate-bounce" aria-hidden="true" />
                    <span className="hidden sm:inline">Listening...</span>
                </>
            ) : (
                <>
                    <Mic className="h-5 w-5" aria-hidden="true" />
                    <span className="hidden sm:inline">Voice Command</span>
                </>
            )}
        </Button>
    );
}