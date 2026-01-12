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
> 3. **Garbage collection bug** – Utterance gets silenced if not stored
> 4. **Browser autoplay policy** – Speech blocked without user interaction"

**Workaround 1 - Garbage Collection (Auth.jsx:57-58):**
```jsx
// Store reference to prevent garbage collection
window.currentUtterance = utterance;
```

**Workaround 2 - Autoplay Policy:**
> "Modern browsers block automatic audio/speech on page load to prevent annoying autoplay.
> The `speechSynthesis.speak()` call is **silently ignored** if there's no prior user gesture (click, tap, keypress).
> 
> **Solution:** We require user interaction first (click/Enter to start), then speech works.
> For screen reader users, we use **ARIA live regions** which don't need user interaction – 
> screen readers (like NVDA) read `aria-live="assertive"` content automatically on page load."

**Your code (Auth.jsx – Welcome Screen):**
```jsx
// Welcome screen requires user click/Enter to proceed
<main
    onClick={() => setStarted(true)}
    onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            setStarted(true);  // After this, speech works!
        }
    }}

>
    {/* ARIA Live Region - Screen readers read this WITHOUT user click */}
    <div role="alert" aria-live="assertive" aria-atomic="true" className="sr-only">
        Welcome to Saarthi! Press Enter or Space to start.
    </div>
    
    <h1>Welcome to Saarthi!</h1>
    <button>Start</button>
</main>
```

**Key Insight:**
| Method | Works on First Load? | User Interaction Needed? |
|--------|---------------------|--------------------------|
| `speechSynthesis.speak()` | ❌ No (blocked) | Yes |
| ARIA `aria-live="assertive"` | ✅ Yes | No |
| Screen Reader (NVDA) | ✅ Yes | No |

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

## 7. Backend Architecture Questions

### Q: "Explain your backend architecture"

**Answer:**
> "Saarthi uses a **Node.js + Express** backend with **MongoDB** as the database. The architecture follows an MVC-like pattern:
> - **Models**: Mongoose schemas (User, Assignment, Note)
> - **Controllers**: Business logic for each route
> - **Routes**: RESTful API endpoints
> - **Middleware**: Error handling, authentication"

**Key files to reference:**
```
server/
├── index.js           # Express app setup
├── config/
│   └── db.js          # MongoDB connection
├── models/
│   ├── User.js        # User schema with bcrypt
│   ├── Assignment.js  # Assignment schema
│   └── Note.js        # Note schema
├── controllers/
│   ├── authController.js
│   ├── assignmentController.js
│   └── noteController.js
├── routes/
│   ├── authRoutes.js
│   ├── assignmentRoutes.js
│   └── noteRoutes.js
└── middleware/
    └── errorMiddleware.js
```

---

### Q: "Why did you choose MongoDB over SQL?"

**Answer:**
> "MongoDB was chosen for:
> - **Schema flexibility** – Easy to add new fields as the app grows
> - **JSON-like documents** – Natural fit with JavaScript/Node.js
> - **Quick prototyping** – No migrations needed during development
> - **Mongoose ODM** – Provides schema validation and helpful methods"

---

## 8. Express.js Concepts

### Q: "Explain the Express middleware pattern"

**Answer:**
> "Middleware functions have access to `req`, `res`, and `next`. They can:
> - Execute code
> - Modify request/response objects
> - End the request-response cycle
> - Call the next middleware in the stack"

**Your code (index.js):**
```javascript
// Built-in middleware
app.use(express.json());  // Parse JSON body
app.use(cors());          // Enable CORS

// Route middleware
app.use('/api/auth', userRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/notes', noteRoutes);

// Error handling middleware (runs last)
app.use(notFound);
app.use(errorHandler);
```

---

### Q: "How did you handle errors in Express?"

**Answer:**
> "I created centralized error handling middleware with two functions:
> 1. **notFound** – Catches 404 for undefined routes
> 2. **errorHandler** – Catches all errors, formats response"

**Your code (errorMiddleware.js):**
```javascript
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);  // Pass error to errorHandler
};

const errorHandler = (err, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message;

    // Handle Mongoose invalid ObjectId
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        message = 'Resource not found';
        statusCode = 404;
    }

    res.status(statusCode).json({
        message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};
```

**Key insight:**
| Environment | Stack Trace | Reason |
|-------------|-------------|--------|
| Development | ✅ Shown | Helps debugging |
| Production | ❌ Hidden | Security (no code exposure) |

---

## 9. MongoDB & Mongoose

### Q: "Explain your Mongoose schema design"

**Answer:**
> "I used Mongoose schemas to define data structure and add functionality:"

**User Schema (with password hashing):**
```javascript
const userSchema = mongoose.Schema({
    email: { type: String, required: true, unique: true },
    pin: { type: String, required: true },
    name: { type: String, default: 'User' }
}, {
    timestamps: true  // Adds createdAt, updatedAt
});

// Pre-save hook - hash PIN before storing
userSchema.pre('save', async function (next) {
    if (!this.isModified('pin')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.pin = await bcrypt.hash(this.pin, salt);
});

// Instance method - compare PINs
userSchema.methods.matchPin = async function (enteredPin) {
    return await bcrypt.compare(enteredPin, this.pin);
};
```

**Assignment Schema (with references):**
```javascript
const assignmentSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'  // Reference to User model
    },
    title: { type: String, required: true },
    subject: { type: String, required: true },
    status: {
        type: String,
        enum: ['pending', 'completed'],  // Only these values allowed
        default: 'pending'
    },
    priority: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium'
    }
});
```

---

### Q: "What are Mongoose hooks and when did you use them?"

**Answer:**
> "Mongoose hooks (middleware) run at specific points in document lifecycle:
> - **pre('save')** – Runs before saving, used for password hashing
> - **post('save')** – Runs after saving
> - **pre('remove')** – Runs before deletion"

**Your code:**
```javascript
// Pre-save hook - hash password BEFORE storing in DB
userSchema.pre('save', async function (next) {
    if (!this.isModified('pin')) {
        next();  // Skip if PIN wasn't changed
    }
    const salt = await bcrypt.genSalt(10);
    this.pin = await bcrypt.hash(this.pin, salt);
});
```

---

## 10. Authentication & Security

### Q: "How did you implement authentication?"

**Answer:**
> "I used **JWT (JSON Web Tokens)** for stateless authentication:
> 1. User logs in with email + PIN
> 2. Server validates credentials
> 3. Server returns a signed JWT token
> 4. Client stores token and sends with each request"

**Your code (authController.js):**
```javascript
import jwt from 'jsonwebtoken';

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign(
        { id },                            // Payload
        process.env.JWT_SECRET,            // Secret key
        { expiresIn: '30d' }               // Expiry
    );
};

// Login endpoint
const authUser = async (req, res, next) => {
    const { email, pin } = req.body;
    const user = await User.findOne({ email });

    if (user && await user.matchPin(pin)) {
        res.json({
            _id: user._id,
            email: user.email,
            token: generateToken(user._id),  // Send token
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or PIN');
    }
};
```

---

### Q: "Why bcrypt for password/PIN hashing?"

**Answer:**
> "bcrypt is designed for password hashing with:
> - **Salt** – Random value added before hashing (prevents rainbow table attacks)
> - **Cost factor** – Configurable work factor (10 rounds = 2^10 iterations)
> - **Slow by design** – Makes brute force attacks impractical"

**Your code:**
```javascript
import bcrypt from 'bcryptjs';

// Hashing (in pre-save hook)
const salt = await bcrypt.genSalt(10);       // 10 rounds
this.pin = await bcrypt.hash(this.pin, salt);

// Comparing (in instance method)
userSchema.methods.matchPin = async function (enteredPin) {
    return await bcrypt.compare(enteredPin, this.pin);
};
```

**Security comparison:**
| Method | Vulnerable To | Use Case |
|--------|---------------|----------|
| Plain text | Everything | ❌ Never |
| MD5/SHA1 | Rainbow tables | ❌ Not for passwords |
| SHA256 | Fast brute force | ❌ Not for passwords |
| **bcrypt** | Very slow attacks | ✅ Passwords |

---

### Q: "What is JWT and how does it work?"

**Answer:**
> "JWT = JSON Web Token. It's a self-contained token with three parts:
> 1. **Header** – Algorithm & token type
> 2. **Payload** – Data (user ID, expiry)
> 3. **Signature** – Verification with secret key"

**JWT structure:**
```
eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjEyMyIsImV4cCI6MTY5...}.SflKxwRJSMeKKF2QT4...
|____HEADER____|._________PAYLOAD__________|._____SIGNATURE_____|
```

**Advantages:**
- **Stateless** – No server-side session storage
- **Scalable** – Works across multiple servers
- **Self-contained** – Carries user info in payload

---

## 11. REST API Design

### Q: "Explain your REST API design"

**Answer:**
> "I followed REST conventions for all endpoints:"

| Method | Endpoint | Action | Controller |
|--------|----------|--------|------------|
| POST | `/api/auth/signup` | Register user | `registerUser` |
| POST | `/api/auth/login` | Login user | `authUser` |
| GET | `/api/assignments` | Get all assignments | `getAssignments` |
| POST | `/api/assignments` | Create assignment | `createAssignment` |
| PUT | `/api/assignments/:id` | Update assignment | `updateAssignment` |
| DELETE | `/api/assignments/:id` | Delete assignment | `deleteAssignment` |

**Your route structure (assignmentRoutes.js):**
```javascript
import express from 'express';
const router = express.Router();

// Protected routes - require valid JWT token
router.route('/')
    .get(protect, getAssignments)
    .post(protect, createAssignment);

router.route('/:id')
    .put(protect, updateAssignment)
    .delete(protect, deleteAssignment);

export default router;
```

---

### Q: "How do you handle a CRUD operation in your controller?"

**Answer:**
> "Each controller function follows a pattern: validate → perform operation → respond"

**Your code (createAssignment with authentication):**
```javascript
const createAssignment = async (req, res, next) => {
    try {
        // 1. Extract data from request (userId comes from JWT token)
        const { title, subject, dueDate, priority } = req.body;
        const userId = req.user._id;  // From protect middleware

        // 2. Validate required fields
        if (!title || !subject) {
            res.status(400);
            throw new Error('Please add all required fields');
        }

        // 3. Create in database
        const assignment = await Assignment.create({
            userId, title, subject, dueDate, priority
        });

        // 4. Return success response
        res.status(201).json(assignment);
    } catch (error) {
        // 5. Pass errors to middleware
        next(error);
    }
};
```

---

## 12. Database Connection

### Q: "How did you connect to MongoDB?"

**Answer:**
> "I used Mongoose with async/await pattern and environment variables:"

**Your code (config/db.js):**
```javascript
import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(
            process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/saarthi-vi-app'
        );
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);  // Exit with failure
    }
};

export default connectDB;
```

**Key points:**
- Uses **environment variable** for connection string (security)
- **Fallback** to localhost for development
- **Graceful exit** if connection fails

---

## 13. Protected Routes Implementation

### Q: "How did you implement protected routes?"

**Answer:**
> "I implemented protection at both frontend and backend levels:
> 1. **Frontend** – `ProtectedRoute` component checks for token before rendering
> 2. **Backend** – `protect` middleware verifies JWT on each API request
> 3. **Ownership** – Controllers verify users can only access their own data"

**Frontend ProtectedRoute (components/ProtectedRoute.jsx):**
```jsx
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const userInfo = localStorage.getItem('userInfo');
    
    if (!userInfo) {
        return <Navigate to="/auth" replace />;
    }
    
    const user = JSON.parse(userInfo);
    if (!user.token) {
        return <Navigate to="/auth" replace />;
    }
    
    return children;  // Render protected content
};
```

**Usage in App.jsx:**
```jsx
<Route path="/dashboard" element={
    <ProtectedRoute>
        <Dashboard />
    </ProtectedRoute>
} />
```

---

### Q: "How does your backend authentication middleware work?"

**Answer:**
> "The `protect` middleware extracts and verifies the JWT from the Authorization header:"

**Your code (middleware/authMiddleware.js):**
```javascript
const protect = async (req, res, next) => {
    let token;

    // Check for Bearer token in Authorization header
    if (req.headers.authorization?.startsWith('Bearer')) {
        try {
            // Extract token from "Bearer <token>"
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach user to request (exclude password)
            req.user = await User.findById(decoded.id).select('-pin');

            next();  // Continue to route handler
        } catch (error) {
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
};
```

---

### Q: "How do you verify resource ownership?"

**Answer:**
> "In each controller, I compare the resource's userId with the authenticated user:"

**Your code (noteController.js):**
```javascript
const deleteNote = async (req, res, next) => {
    const note = await Note.findById(req.params.id);

    if (!note) {
        res.status(404);
        throw new Error('Note not found');
    }

    // Verify ownership - user can only delete their own notes
    if (note.userId.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to delete this note');
    }

    await Note.findByIdAndDelete(req.params.id);
    res.json({ message: 'Note deleted' });
};
```

**Security layers:**
| Layer | What it Checks | Where |
|-------|---------------|-------|
| Frontend Route | Token exists in localStorage | `ProtectedRoute.jsx` |
| Backend Middleware | Token is valid JWT | `authMiddleware.js` |
| Controller | User owns the resource | Each controller |

---

### Q: "How do frontend API calls include authentication?"

**Answer:**
> "All API calls include the JWT token in the Authorization header:"

**Your code (base44Client.js):**
```javascript
const getAuthHeaders = () => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
        const { token } = JSON.parse(userInfo);
        return {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };
    }
    return {};
};

// Usage in API calls
const response = await axios.get(API_URL, getAuthHeaders());
const response = await axios.post(API_URL, data, getAuthHeaders());
```

---

## 14. Backend Common Follow-up Questions

| Question | Answer |
|----------|--------|
| "How did you implement authentication middleware?" | ✅ Created `protect` middleware that verifies JWT token from Authorization header |
| "How would you add rate limiting?" | Use `express-rate-limit` package to prevent abuse |
| "How would you add input validation?" | Use `express-validator` or `Joi` for schema validation |
| "Why ES modules (`import`) vs CommonJS (`require`)?" | ES modules are modern standard, tree-shakeable, used with `"type": "module"` in package.json |
| "How would you deploy this?" | Use services like Railway, Render, or Heroku with environment variables |
| "How do you prevent users from accessing others' data?" | ✅ Ownership verification in controllers comparing `req.user._id` with resource `userId` |

---

## 15. Common Follow-up Questions

| Question | Quick Answer |
|----------|--------------|
| "How would you scale this?" | Add Redux/Zustand if state gets complex, code splitting for routes |
| "How would you test this?" | Jest + React Testing Library, Cypress for E2E |
| "What would you improve?" | Add offline support (PWA), more voice commands, multi-language |
| "Why no TypeScript?" | Time constraints; would add for better type safety |

---

## 16. Demo Script

When demonstrating:

### Frontend Demo:
1. Show the **welcome screen** → Explain first user interaction
2. Press **E** → Show voice email input
3. Press **P** → Show voice PIN input  
4. Press **S** → Show voice submit
5. Swipe or Arrow key → Show mode switching
6. Turn on **NVDA** → Show screen reader compatibility

### Protected Routes Demo:
7. Try visiting `/dashboard` directly → Get redirected to `/auth`
8. Login successfully → Navigate to `/dashboard`
9. Check browser DevTools Network tab → Show `Authorization: Bearer` header

### Backend Demo:
10. Show **Postman/Thunder Client** → Test API endpoints
11. POST `/api/auth/signup` → Create a new user
12. POST `/api/auth/login` → Get JWT token
13. GET `/api/assignments` without token → Get 401 Unauthorized
14. GET `/api/assignments` with Bearer token → Get user's data
15. Show **MongoDB Compass** → View stored data
16. Explain **bcrypt hashing** → Show hashed PIN in database

---

## Key Talking Points Summary

### Frontend
✅ Built for **accessibility-first** design (WCAG 2.1)  
✅ **Voice-controlled** authentication using Web Speech API  
✅ **Keyboard + Touch + Voice** – Multiple input methods  
✅ **React 18 + Vite** modern stack  
✅ **NVDA screen reader** tested  
✅ **Protected routes** with ProtectedRoute component  

### Backend
✅ **Node.js + Express** RESTful API  
✅ **MongoDB + Mongoose** for database  
✅ **JWT authentication** for stateless auth  
✅ **bcrypt** for secure password hashing  
✅ **Centralized error handling** middleware  
✅ **MVC architecture** pattern  
✅ **Protected routes** with auth middleware  
✅ **Ownership verification** in controllers  


