# Saarthi Frontend – Interview Guide

This guide covers potential interview questions about the Saarthi frontend and how to answer them.

---

## 1. Project Architecture Questions

### Q: "Explain your project's frontend architecture"

**Answer:**
> "Saarthi uses a **React 18** frontend built with **Vite** as the build tool. The architecture follows a component-based structure with:
> - **Pages**: Auth, Dashboard, Assignments, AssignmentDetail
> - **Components**: Reusable UI components, VoiceController, AccessibilitySettings
> - **State Management**: React Query for server state, React's useState for local state
> - **Routing**: React Router v6 with protected routes"

**Key files to reference:**
```
src/
├── App.jsx          # Routes & providers
├── main.jsx         # Entry point
├── pages/           # Page components
├── components/      # Reusable components
│   ├── ui/          # UI primitives (Button, Dialog)
│   ├── voice/       # VoiceController
│   └── accessibility/
└── api/             # API client
```

---

### Q: "Why Vite instead of Create React App?"

**Answer:**
> "Vite offers:
> - **Faster dev server** – Uses native ES modules, instant hot reload
> - **Smaller bundle** – Better tree-shaking
> - **Modern defaults** – No legacy browser bloat
> CRA is now deprecated by the React team."

---

## 2. React Concepts in Your Code

### Q: "Explain the React hooks you used"

| Hook | Where Used | Purpose |
|------|------------|---------|
| `useState` | Auth.jsx:8-13 | Manage form state (email, pin, mode) |
| `useEffect` | Auth.jsx:66-76 | Load voices on mount |
| `useRef` | Auth.jsx:14-28 | DOM references, gesture tracking |
| `useCallback` | VoiceController.jsx:38 | Memoize command handler |
| `useNavigate` | Auth.jsx:7 | Programmatic navigation |

**Example explanation:**
```jsx
// useState - Managing form input
const [email, setEmail] = useState('');

// useEffect - Side effects on mount
useEffect(() => {
    window.speechSynthesis.getVoices();
}, []); // Empty dependency = runs once

// useRef - DOM reference without re-render
const emailRef = useRef(null);
emailRef.current.focus(); // Direct DOM access
```

---

### Q: "What's the difference between useState and useRef?"

**Answer:**
> "**useState** causes re-render when value changes – use for UI state.
> **useRef** persists value without re-render – use for DOM refs, timers, previous values."

**Your code example:**
```jsx
// useState - triggers re-render, updates UI
const [mode, setMode] = useState('login');

// useRef - no re-render, used for touch tracking
const touchStart = useRef(null);
touchStart.current = e.targetTouches[0].clientX;
```

---

### Q: "What is React Query and why did you use it?"

**Answer:**
> "React Query (TanStack Query) handles **server state** – data fetched from APIs. It provides:
> - **Automatic caching** – No duplicate requests
> - **Background refetching** – Data stays fresh
> - **Loading/error states** – Built-in handling
> - **Mutations** – For POST/PUT/DELETE"

**Your code in Dashboard.jsx:**
```jsx
const { data: assignments, isLoading, error } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => axios.get('/api/assignments')
});
```

---

## 3. Web Speech API Questions

### Q: "Explain how you implemented voice input"

**Answer:**
> "I used the **Web Speech API** which has two parts:
> 1. **SpeechSynthesis** – Text-to-Speech (speaking to user)
> 2. **SpeechRecognition** – Speech-to-Text (listening to user)"

**Your code (Auth.jsx:30-63):**
```jsx
// TEXT-TO-SPEECH
const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9; // Slower for accessibility
    window.speechSynthesis.speak(utterance);
};

// SPEECH-TO-TEXT
const startListening = (field) => {
    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setEmail(transcript); // Use the spoken text
    };
    
    recognition.start();
};
```

---

### Q: "What browser compatibility issues did you face?"

**Answer:**
> "The Web Speech API has cross-browser issues:
> 1. **Chrome uses `webkitSpeechRecognition`** – Need prefix check
> 2. **Voices load asynchronously** – Need `onvoiceschanged` event
> 3. **Garbage collection bug** – Utterance gets silenced if not stored"

**Your workaround (Auth.jsx:57-58):**
```jsx
// Store reference to prevent garbage collection
window.currentUtterance = utterance;
```

---

## 4. Accessibility Questions

### Q: "How did you make this accessible for blind users?"

**Answer:**
> "I implemented multiple accessibility layers:
> 1. **ARIA attributes** – `aria-label`, `aria-live`, `aria-invalid`
> 2. **Keyboard navigation** – E, P, S shortcuts + Arrow keys
> 3. **Screen reader support** – NVDA tested, live regions
> 4. **Voice I/O** – Full voice input/output flow
> 5. **Touch gestures** – Swipe for mode switching"

**Key code patterns:**
```jsx
// ARIA Live Region - Announces changes to screen readers
<div role="alert" aria-live="assertive">
    {statusData}
</div>

// Keyboard shortcuts
const handleKeyDown = (e) => {
    if (e.key === 'e' || e.key === 'E') {
        speak("Speak your email address");
        startListening('email');
    }
};
```

---

### Q: "What is WCAG and how did you follow it?"

**Answer:**
> "WCAG = Web Content Accessibility Guidelines. Four principles:
> - **Perceivable** – Alt text, contrast, text alternatives
> - **Operable** – Keyboard accessible, no time limits
> - **Understandable** – Clear labels, error messages
> - **Robust** – Works with assistive tech"

*Reference: `docs/accessibility-audit.md`*

---

## 5. Touch Gesture Implementation

### Q: "How did you implement swipe gestures?"

**Answer:**
> "I tracked touch coordinates to detect swipe direction:"

**Your code (Auth.jsx:91-115):**
```jsx
const touchStart = useRef(null);
const touchEnd = useRef(null);

const onTouchStart = (e) => {
    touchStart.current = e.targetTouches[0].clientX;
};

const onTouchMove = (e) => {
    touchEnd.current = e.targetTouches[0].clientX;
};

const onTouchEnd = () => {
    const distance = touchStart.current - touchEnd.current;
    const isLeftSwipe = distance > 50;  // 50px threshold
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe) setMode('login');
    if (isRightSwipe) setMode('signup');
};
```

---

## 6. State Management Questions

### Q: "How did you manage state in this application?"

**Answer:**
> "I used a layered approach:
> - **Local state (useState)** – Form inputs, UI toggles
> - **Server state (React Query)** – API data with caching
> - **URL state (React Router)** – Navigation, page routing
> No Redux needed since the app is not deeply nested."

---

## 7. Common Follow-up Questions

| Question | Quick Answer |
|----------|--------------|
| "How would you scale this?" | Add Redux/Zustand if state gets complex, code splitting for routes |
| "How would you test this?" | Jest + React Testing Library, Cypress for E2E |
| "What would you improve?" | Add offline support (PWA), more voice commands, multi-language |
| "Why no TypeScript?" | Time constraints; would add for better type safety |

---

## 8. Demo Script

When demonstrating:
1. Show the **welcome screen** → Explain first user interaction
2. Press **E** → Show voice email input
3. Press **P** → Show voice PIN input  
4. Press **S** → Show voice submit
5. Swipe or Arrow key → Show mode switching
6. Turn on **NVDA** → Show screen reader compatibility

---

## Key Talking Points Summary

✅ Built for **accessibility-first** design (WCAG 2.1)  
✅ **Voice-controlled** authentication using Web Speech API  
✅ **Keyboard + Touch + Voice** – Multiple input methods  
✅ **React 18 + Vite** modern stack  
✅ **NVDA screen reader** tested  
✅ **MongoDB + Express** backend with JWT auth
