import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, ArrowRight, ArrowLeft, Accessibility } from 'lucide-react';
import axios from 'axios';

const Auth = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState('login'); // 'login' or 'signup'
    const [email, setEmail] = useState('');
    const [pin, setPin] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isCommandListening, setIsCommandListening] = useState(false);
    const [statusData, setStatusData] = useState('');
    const formRef = useRef(null);

    // Refs for touch gestures
    const touchStart = useRef(null);
    const touchEnd = useRef(null);

    // Refs for focus management
    const emailRef = useRef(null);
    const pinRef = useRef(null);

    const [started, setStarted] = useState(false);
    const containerRef = useRef(null);
    const startRef = useRef(null);
    const headingRef = useRef(null);

    // Screen Reader Mode - read from localStorage
    const [screenReaderMode, setScreenReaderMode] = useState(() => {
        const saved = localStorage.getItem('accessibilitySettings');
        if (saved) {
            const parsed = JSON.parse(saved);
            return parsed.screenReaderMode || false;
        }
        return false;
    });

    // Track if user has interacted (to speak about toggle)
    const [hasInteracted, setHasInteracted] = useState(false);

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech first
            window.speechSynthesis.cancel();

            // Small timeout to ensure cancel completes (Chrome workaround)
            setTimeout(() => {
                // Ensure we are in a resumed state
                if (window.speechSynthesis.paused) {
                    window.speechSynthesis.resume();
                }

                // Create utterance
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'en-US';
                utterance.rate = 0.9; // Slightly slower for accessibility
                utterance.volume = 1.0;

                // Try to get a voice (some browsers need this)
                const voices = window.speechSynthesis.getVoices();
                if (voices.length > 0) {
                    const englishVoice = voices.find(v => v.lang.startsWith('en'));
                    if (englishVoice) {
                        utterance.voice = englishVoice;
                    }
                }

                // Critical: Store reference to prevent garbage collection silences
                window.currentUtterance = utterance;

                window.speechSynthesis.speak(utterance);
            }, 100);
        }
    };

    // Wrapper that respects screenReaderMode for automatic announcements
    const speakIfNoScreenReader = (text) => {
        if (!screenReaderMode) {
            speak(text);
        }
    };

    // Toggle screen reader mode and save to localStorage
    const toggleScreenReaderMode = () => {
        const newValue = !screenReaderMode;
        setScreenReaderMode(newValue);
        // Update localStorage
        const saved = localStorage.getItem('accessibilitySettings');
        const settings = saved ? JSON.parse(saved) : {};
        settings.screenReaderMode = newValue;
        localStorage.setItem('accessibilitySettings', JSON.stringify(settings));
    };

    // Handle first interaction on welcome screen - speak about the toggle
    const handleFirstInteraction = (e) => {
        if (!hasInteracted) {
            e.stopPropagation();
            setHasInteracted(true);
            speak("Welcome to Saarthi. If you use a screen reader, say Toggle to enable screen reader mode. To continue to sign in or sign up, click the Start button or say Start.");

            // Start listening for "toggle" command after speech ends (longer delay)
            setTimeout(() => {
                startToggleListening();
            }, 7000); // Wait longer for speech to finish
        }
    };

    // Listen for "toggle" voice command on welcome screen
    const startToggleListening = () => {
        if (!('webkitSpeechRecognition' in window)) return;

        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';

        // Flag to prevent restart when start command is recognized
        let shouldRestart = true;

        try {
            recognition.start();
        } catch (e) {
            // Recognition might already be running
            return;
        }

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase().trim();
            console.log('Toggle recognition heard:', transcript);

            if (transcript.includes('toggle') || transcript.includes('enable') || transcript.includes('disable') || transcript.includes('switch')) {
                // Read current state from localStorage to avoid closure issues
                const saved = localStorage.getItem('accessibilitySettings');
                const settings = saved ? JSON.parse(saved) : {};
                const currentState = settings.screenReaderMode || false;
                const newState = !currentState;

                // Update state and localStorage
                setScreenReaderMode(newState);
                settings.screenReaderMode = newState;
                localStorage.setItem('accessibilitySettings', JSON.stringify(settings));

                if (newState) {
                    speak("Screen reader mode enabled. Click Start or say Start to continue.");
                } else {
                    speak("Screen reader mode disabled. Click Start or say Start to continue.");
                }
                // Restart listening for more commands
                shouldRestart = false; // Prevent onend restart
                setTimeout(() => startToggleListening(), 4000);
            } else if (transcript.includes('start') || transcript.includes('continue') || transcript.includes('go') || transcript.includes('begin')) {
                shouldRestart = false; // Stop restarting - we're navigating away
                speak("Starting Saarthi.");
                setTimeout(() => {
                    setStarted(true);
                }, 500);
            } else {
                speak("Say Toggle to switch screen reader mode, or click Start to continue.");
                // Restart listening
                shouldRestart = false; // Prevent onend restart
                setTimeout(() => startToggleListening(), 3000);
            }
        };

        recognition.onerror = (event) => {
            console.log('Recognition error:', event.error);
            shouldRestart = false;
            // Restart listening after error (except for "not-allowed")
            if (event.error !== 'not-allowed') {
                setTimeout(() => startToggleListening(), 1000);
            }
        };

        recognition.onend = () => {
            // Only restart if we didn't process a valid command
            if (shouldRestart) {
                console.log('Recognition ended, restarting...');
                setTimeout(() => startToggleListening(), 500);
            }
        };
    };

    // Preload voices on mount (Chrome loads voices asynchronously)
    useEffect(() => {
        if ('speechSynthesis' in window) {
            // Initial call to trigger voice loading
            window.speechSynthesis.getVoices();

            // Listen for voices changed event
            window.speechSynthesis.onvoiceschanged = () => {
                window.speechSynthesis.getVoices();
            };
        }
    }, []);

    // Removed unused welcomeRef and its focus effect; relying on heading focus and live region.

    useEffect(() => {
        if (started) {
            // Focus for keyboard accessibility
            if (containerRef.current) {
                containerRef.current.focus();
            }
            // Speak instructions only if screen reader mode is OFF
            speakIfNoScreenReader("Welcome to Saarthi. Press E to speak your email. Press P to speak your PIN. Press S to submit by voice. Use Arrow keys to switch between Sign In and Sign Up.");
        }
    }, [started]);

    // Gesture Handling
    const onTouchStart = (e) => {
        touchEnd.current = null;
        touchStart.current = e.targetTouches[0].clientX;
    };

    const onTouchMove = (e) => {
        touchEnd.current = e.targetTouches[0].clientX;
    };

    const onTouchEnd = () => {
        if (!touchStart.current || !touchEnd.current) return;
        const distance = touchStart.current - touchEnd.current;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe && mode !== 'login') {
            setMode('login');
            speak("Switched to Sign In mode. Enter Email and Pin.");
        }
        if (isRightSwipe && mode !== 'signup') {
            setMode('signup');
            speak("Switched to Sign Up mode. Enter Email, Pin, and Name.");
        }
    };

    // Keyboard Handling
    const handleKeyDown = (e) => {
        // Don't trigger shortcuts when typing in input fields
        const isTyping = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';

        if (e.key === 'ArrowRight') {
            setMode('signup');
            speak("Sign Up Mode");
        }
        if (e.key === 'ArrowLeft') {
            setMode('login');
            speak("Sign In Mode");
        }

        // Voice input shortcuts (only when not typing)
        if (!isTyping) {
            if (e.key === 'e' || e.key === 'E') {
                e.preventDefault();
                speak("Speak your email address");
                setTimeout(() => startListening('email'), 1500);
            }
            if (e.key === 'p' || e.key === 'P') {
                e.preventDefault();
                speak("Speak your PIN");
                setTimeout(() => startListening('pin'), 1500);
            }
            if (e.key === 's' || e.key === 'S') {
                e.preventDefault();
                startVoiceCommand();
            }
        }
    };

    // Voice Input
    const startListening = (field) => {
        if (!('webkitSpeechRecognition' in window)) {
            speak("Voice input not supported in this browser.");
            return;
        }
        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';

        setIsListening(true);
        recognition.start();

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (field === 'email') {
                const cleanEmail = transcript
                    .toLowerCase()
                    .replace(/at the rate/g, '@')
                    .replace(/at rate/g, '@')
                    .replace(/ at /g, '@')
                    .replace(/ dot /g, '.')
                    .replace(/\s+/g, '');
                setEmail(cleanEmail);
                speak(`Email set to ${cleanEmail}`);
            } else if (field === 'pin') {
                const cleanPin = transcript.replace(/\D/g, ''); // keep only numbers
                setPin(cleanPin);
                speak(`Pin set, value hidden.`);
            }
            setIsListening(false);
        };

        recognition.onerror = () => {
            speak("Could not hear you. Please try again.");
            setIsListening(false);
        };
    };

    // Voice Command for Form Submission
    const startVoiceCommand = () => {
        if (!('webkitSpeechRecognition' in window)) {
            speak("Voice commands not supported in this browser.");
            return;
        }

        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';

        setIsCommandListening(true);
        speak("Listening for command. Say Enter, Join, or Submit.");

        setTimeout(() => {
            recognition.start();
        }, 1500); // Wait for the speak to finish

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase().trim();
            setIsCommandListening(false);

            // Check for submit commands
            const submitCommands = ['enter', 'join', 'submit', 'login', 'sign in', 'sign up', 'go', 'proceed'];
            const hasSubmitCommand = submitCommands.some(cmd => transcript.includes(cmd));

            if (hasSubmitCommand) {
                speak("Submitting form.");
                // Trigger form submission
                if (formRef.current) {
                    formRef.current.requestSubmit();
                }
            } else {
                speak(`Command not recognized: ${transcript}. Please say Enter or Join to submit.`);
            }
        };

        recognition.onerror = () => {
            speak("Could not hear the command. Please try again.");
            setIsCommandListening(false);
        };

        recognition.onend = () => {
            setIsCommandListening(false);
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Improved Regex Validation
        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        if (!isValidEmail) {
            const msg = "Invalid email. Please say or type a valid email address.";
            setStatusData(msg);
            speak(msg);
            // Auto-focus on error
            emailRef.current?.focus();
            return;
        }

        // PIN Validation
        const isValidPin = /^\d{4}$/.test(pin);
        if (!isValidPin) {
            const msg = "Invalid PIN. Please enter a 4-digit number.";
            setStatusData(msg);
            speak(msg);
            pinRef.current?.focus();
            return;
        }

        try {
            const endpoint = mode === 'signup' ? 'http://localhost:5000/api/auth/signup' : 'http://localhost:5000/api/auth/login';
            const payload = mode === 'signup' ? { email, pin, name: 'User' } : { email, pin };

            const res = await axios.post(endpoint, payload);

            localStorage.setItem('userInfo', JSON.stringify(res.data));
            speak(`Successfully ${mode === 'signup' ? 'Signed Up' : 'Signed In'}. Redirecting to Dashboard.`);
            setStatusData("Success! Redirecting...");
            setTimeout(() => navigate('/dashboard'), 2000);

        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || "Something went wrong";
            speak(`Error. ${msg}`);
            setStatusData(`Error: ${msg}`);
        }
    };

    // Ref for the welcome container (focusable alert)
    const welcomeRef = useRef(null);

    // Focus the welcome container on mount for NVDA to read the alert
    useEffect(() => {
        if (!started && welcomeRef.current) {
            welcomeRef.current.focus();
        }
    }, [started]);

    if (!started) {
        return (
            <main
                ref={welcomeRef}
                role="main"
                aria-labelledby="welcome-heading"
                className="min-h-screen bg-black text-yellow-400 flex flex-col items-center justify-center p-6 text-center"
                tabIndex={-1}
                onClick={handleFirstInteraction}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        handleFirstInteraction(e);
                    }
                }}
            >
                {/* ARIA Live Region - NVDA will announce this automatically */}
                <div
                    role="alert"
                    aria-live="assertive"
                    aria-atomic="true"
                    className="sr-only"
                >
                    Welcome to Saarthi! Click the Start button or say Start to begin.
                </div>

                <h1
                    id="welcome-heading"
                    ref={headingRef}
                    tabIndex={-1}
                    className="text-6xl font-bold mb-8 outline-none"
                >
                    Welcome to Saarthi!
                </h1>
                <p className="text-3xl animate-pulse" aria-hidden="true">
                    {hasInteracted ? 'Click Start or say Start to continue' : 'Click anywhere to hear instructions'}
                </p>
                <p className="sr-only">
                    {hasInteracted ? 'Click the Start button or say Start to continue' : 'Click anywhere to hear instructions'}
                </p>
                <button
                    className="mt-8 px-8 py-4 bg-yellow-400 text-black text-2xl font-bold rounded-xl focus:ring-4 focus:ring-yellow-200"
                    aria-label="Start Saarthi application"
                    onClick={(e) => {
                        e.stopPropagation();
                        setStarted(true);
                    }}
                >
                    Start
                </button>

                {/* Screen Reader Toggle */}
                <div className="mt-8 flex items-center gap-4 bg-gray-900 p-4 rounded-xl border-2 border-yellow-400">
                    <Accessibility className="h-8 w-8" aria-hidden="true" />
                    <label htmlFor="sr-toggle" className="text-xl cursor-pointer flex-1 text-left">
                        I use a Screen Reader (NVDA/JAWS)
                    </label>
                    <button
                        id="sr-toggle"
                        role="switch"
                        aria-checked={screenReaderMode}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleScreenReaderMode();
                        }}
                        className={`w-16 h-8 rounded-full transition-colors ${screenReaderMode ? 'bg-green-500' : 'bg-gray-600'}`}
                        aria-label={screenReaderMode ? 'Screen reader mode is on' : 'Screen reader mode is off'}
                    >
                        <span className={`block w-6 h-6 bg-white rounded-full transform transition-transform ${screenReaderMode ? 'translate-x-9' : 'translate-x-1'}`} />
                    </button>
                </div>
                <p className="mt-2 text-yellow-200 text-lg">Enable this to prevent double announcements</p>
            </main>
        );
    }

    return (
        <div
            ref={containerRef}
            className="min-h-screen bg-black text-yellow-400 flex flex-col items-center justify-center p-6 pb-32 space-y-8 outline-none relative"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onKeyDown={handleKeyDown}
            tabIndex={0}
        >
            {/* ARIA Live Region for Screen Readers */}
            <div role="alert" aria-live="assertive" className="sr-only">
                {statusData}
            </div>

            <div className="text-center space-y-4">
                <h1 className="text-6xl font-bold tracking-wider uppercase">{mode === 'login' ? 'Sign In' : 'Sign Up'}</h1>
                <p className="text-2xl text-yellow-200">
                    {mode === 'login' ? 'Swipe Right for Sign Up' : 'Swipe Left for Sign In'}
                </p>
                {/* Visual Error Message */}
                {statusData && (
                    <p
                        id="email-error"
                        className="text-xl font-bold text-red-400 p-4 border border-red-400 rounded"
                    >
                        {statusData}
                    </p>
                )}
            </div>

            <form ref={formRef} onSubmit={handleSubmit} noValidate className="w-full max-w-md space-y-8">
                <div className="space-y-4">
                    <label htmlFor="email-input" className="text-4xl block font-bold">Email</label>
                    <div className="flex gap-4">
                        <input
                            id="email-input"
                            ref={emailRef}
                            type="email"
                            className="w-full bg-gray-900 border-4 border-yellow-400 p-6 text-3xl rounded-xl focus:ring-4 ring-yellow-200"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@example.com"
                            aria-label="Email Address Input"
                            aria-invalid={statusData && statusData.includes("Invalid email") ? "true" : "false"}
                            aria-describedby="email-error"
                        />
                        <button
                            type="button"
                            onClick={() => startListening('email')}
                            className="bg-yellow-400 text-black p-6 rounded-xl"
                            aria-label="Dictate Email"
                        >
                            <Mic size={40} />
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <label htmlFor="pin-input" className="text-4xl block font-bold">PIN (4 digits)</label>
                    <div className="flex gap-4">
                        <input
                            id="pin-input"
                            ref={pinRef}
                            type="text"
                            className="w-full bg-gray-900 border-4 border-yellow-400 p-6 text-3xl rounded-xl focus:ring-4 ring-yellow-200"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            placeholder="1234"
                            maxLength={6}
                            aria-label="PIN Input (4-6 digits)"
                            aria-invalid={statusData && statusData.includes("PIN") ? "true" : "false"}
                            aria-describedby="email-error"
                        />
                        <button
                            type="button"
                            onClick={() => startListening('pin')}
                            className="bg-yellow-400 text-black p-6 rounded-xl"
                            aria-label="Dictate PIN"
                        >
                            <Mic size={40} />
                        </button>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        type="submit"
                        className="flex-1 bg-yellow-400 text-black font-black text-4xl p-8 rounded-2xl hover:scale-105 transition-transform"
                        aria-label={mode === 'login' ? 'Sign In Submit Button' : 'Sign Up Submit Button'}
                    >
                        {mode === 'login' ? 'ENTER' : 'JOIN'}
                    </button>
                    <button
                        type="button"
                        onClick={startVoiceCommand}
                        className={`p-8 rounded-2xl transition-all ${isCommandListening ? 'bg-red-500 animate-pulse' : 'bg-yellow-400'} text-black`}
                        aria-label="Voice Command - Say Enter or Join to submit"
                    >
                        <Mic size={48} />
                    </button>
                </div>
            </form>

            {/* Voice Input Hint */}
            <div className="text-center text-yellow-200 text-xl opacity-75 max-w-md space-y-2" aria-live="polite">
                <p>⌨️ <strong>E</strong> = Email | <strong>P</strong> = PIN | <strong>S</strong> = Submit</p>
                <p>🎤 Or tap the <strong>microphone buttons</strong> to speak</p>
                <p>⬅️ ➡️ Arrow keys to switch Sign In / Sign Up</p>
            </div>

            <div className="absolute bottom-10 flex gap-10 opacity-50">
                <div className="flex flex-col items-center">
                    <ArrowLeft size={48} />
                    <span>Sign In</span>
                </div>
                <div className="flex flex-col items-center">
                    <ArrowRight size={48} />
                    <span>Sign Up</span>
                </div>
            </div>
        </div>
    );
};

export default Auth;
