import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, ArrowRight, ArrowLeft } from 'lucide-react';
import axios from 'axios';

const Auth = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState('login'); // 'login' or 'signup'
    const [email, setEmail] = useState('');
    const [pin, setPin] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [statusData, setStatusData] = useState('');

    // Refs for touch gestures
    const touchStart = useRef(null);
    const touchEnd = useRef(null);

    // Refs for focus management
    const emailRef = useRef(null);
    const pinRef = useRef(null);

    // Initial Greeting & Focus
    const [started, setStarted] = useState(false);
    const containerRef = useRef(null);
    const startRef = useRef(null);
    const headingRef = useRef(null);

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
            // Speak instructions
            speak("Welcome to Saarthi. Swipe Right for Sign Up. Swipe Left for Sign In. or use Arrow Keys.");
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
        if (e.key === 'ArrowRight') {
            setMode('signup');
            speak("Sign Up Mode");
        }
        if (e.key === 'ArrowLeft') {
            setMode('login');
            speak("Sign In Mode");
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
                className="min-h-screen bg-black text-yellow-400 flex flex-col items-center justify-center p-6 text-center cursor-pointer"
                tabIndex={-1}
                onClick={() => setStarted(true)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        setStarted(true);
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
                    Welcome to Saarthi! Press Enter or Space to start. Then swipe right for sign up or swipe left for sign in.
                </div>

                <h1
                    id="welcome-heading"
                    ref={headingRef}
                    tabIndex={-1}
                    className="text-6xl font-bold mb-8 outline-none"
                >
                    Welcome to Saarthi!
                </h1>
                <p className="text-3xl animate-pulse" aria-hidden="true">Click anywhere or Press Enter or Space to start</p>
                <p className="sr-only">Press Enter or Space to start the application</p>
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
            </main>
        );
    }

    return (
        <div
            ref={containerRef}
            className="min-h-screen bg-black text-yellow-400 flex flex-col items-center justify-center p-6 space-y-8 outline-none"
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

            <form onSubmit={handleSubmit} noValidate className="w-full max-w-md space-y-8">
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

                <button
                    type="submit"
                    className="w-full bg-yellow-400 text-black font-black text-4xl p-8 rounded-2xl hover:scale-105 transition-transform"
                >
                    {mode === 'login' ? 'ENTER' : 'JOIN'}
                </button>
            </form>

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
