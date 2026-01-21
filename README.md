# 🧭 Saarthi
**An Accessibility-First, Voice-Assisted Student Dashboard**

Saarthi is a production-ready, accessibility-first student dashboard built for visually impaired users.
It enables students to authenticate, manage notes, and track assignments using screen readers, keyboard-only navigation, or optional voice commands — without relying on visual interaction.

> ⭐ If you care about real accessibility, voice-driven workflows, or human-centric system design, this project is for you.

---

## � Why Saarthi Exists

Most web apps are readable by screen readers but not truly usable.
Dynamic UI updates, broken focus flow, silent state changes, and mouse-only actions make modern SPAs frustrating for visually impaired users.

**Saarthi solves this by design, not as an afterthought.**

---

## ✨ What Makes Saarthi Different

### ♿ Accessibility as a First-Class System

- Fully compatible with NVDA / JAWS
- Semantic HTML + ARIA live regions
- Explicit focus management for every state change
- Prevents double announcements when screen readers are enabled

### 🎙️ Optional Voice Interaction (Non-Intrusive)

- Voice input using Web Speech API
- Dictate email, PIN, notes, and commands
- Voice feedback is user-controlled, not forced
- Designed to coexist safely with screen readers

### 🧑‍🎓 Real Student Workflows

- Secure Sign In / Sign Up
- Voice-controlled note taking
- Assignments dashboard with status tracking (Pending / Completed)

### ⌨️ Fully Keyboard-Operable

- No mouse dependency
- Predictable navigation order
- Clear shortcuts and feedback

---



## �️ Tech Stack

### Frontend
- React
- Tailwind CSS
- Web Speech API (Speech Recognition & Synthesis)
- ARIA / Accessibility APIs

### Backend
- Node.js
- Express
- JWT Authentication

### Database
- MongoDB

---

## 🧠 Interaction & System Design

Saarthi is built around **intent-driven, stateful workflows**:

```
User intent → tool-like action → explicit feedback
```

- No silent UI updates
- No hidden state transitions
- Human-in-the-loop control at every step

This design maps closely to agentic systems where **reliability and clarity matter more than novelty**.

---

## 🚫 Intentional Tradeoffs

| Decision | Reason |
|----------|--------|
| ❌ No automatic screen-reader detection | User chooses instead |
| ❌ No raw audio recording | Text interaction keeps behavior predictable |


These decisions were made to prioritize **correctness and accessibility**.

---

## 🚀 Getting Started

```bash
# Clone the repo
git clone https://github.com/your-username/Saarthi.git

# Install dependencies
npm install

# Start the backend server
npm run server

# Start the frontend (in a new terminal)
npm run dev
```

---

## 📄 License

This project is licensed under the MIT License.

---

Made with ❤️ for accessibility
