# Saarthi – Accessibility Audit (WCAG 2.1)

This document maps Saarthi's features to WCAG 2.1 accessibility principles
and explains how accessibility was implemented and tested.

---

## 1. Perceivable

### 1.1 Text Alternatives
- All interactive elements include `aria-label`
- Icons (Mic, Arrow) have accessible labels
- Decorative elements marked with `aria-hidden="true"`

✅ Implemented in:
- Auth.jsx (Mic buttons, navigation arrows)

---

### 1.2 Adaptable Content
- Semantic HTML elements (`main`, `form`, `label`, `button`)
- Screen-reader-only content hidden using off-screen positioning, not `display: none`

✅ Implemented in:
- Auth.jsx (welcome heading, status messages)

---

## 2. Operable

### 2.1 Keyboard Accessible
- Full authentication flow usable using keyboard only
- Custom keyboard shortcuts:
  - E → Speak Email
  - P → Speak PIN
  - S → Submit
  - Arrow keys → Switch Sign In / Sign Up

✅ Implemented in:
- handleKeyDown() in Auth.jsx

---

### 2.2 Enough Time
- No time-based session expiration during authentication
- Voice input waits for user completion

---

### 2.3 Seizure & Physical Reactions
- No flashing or rapidly animated elements
- Pulse animations kept under safe frequency

---

## 3. Understandable

### 3.1 Input Assistance
- Real-time spoken feedback for:
  - Invalid email
  - Invalid PIN
  - Submission success / failure
- Focus moves automatically to the field with error

✅ Implemented in:
- handleSubmit() validation logic
- aria-invalid and aria-describedby usage

---

### 3.2 Predictable Navigation
- Arrow keys and swipe gestures behave consistently
- Voice commands provide confirmation feedback

---

## 4. Robust

### 4.1 Compatible with Assistive Technologies
- Tested with NVDA screen reader
- Uses ARIA roles and live regions correctly
- No reliance on auto speech synthesis on page load

✅ Tested on:
- Chrome + NVDA
- Keyboard-only navigation

---

## 5. Known Limitations
- Voice features require explicit user interaction (browser security policy)
- Web Speech API availability varies by browser

---

## 6. Conclusion
Saarthi follows WCAG 2.1 principles to ensure perceivable, operable,
understandable, and robust accessibility for visually impaired users.
