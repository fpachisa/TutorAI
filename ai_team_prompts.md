# 🎯 AI Team Prompt Templates

This document provides **ready-to-use prompt templates** for each AI agent role in your AI-first tutoring startup. Copy, adapt, and reuse these to direct your AI workforce consistently.

---

## 1. AI Architect Agent
**Purpose**: Cloud architecture, infrastructure, CI/CD.
```
Task: Design Google Cloud architecture for [feature/system].
Constraints: Must use Cloud Run, Firestore, Cloud Functions, Firebase Auth, and Cloud Storage. Ensure scalability and compliance with Singapore PDPA.
Output: Step-by-step infrastructure plan + YAML configs if needed.
Validation: Confirm alignment with performance goals (<1s latency for 95% queries).
```

---

## 2. AI/ML Engineer Agent
**Purpose**: Socratic conversation design, LLM tuning, memory.
```
Task: Create Socratic question flow for [math topic].
Constraints: Must NOT give direct answers. Must guide thinking through at least 3 levels of questions. Align with MOE syllabus style.
Output: JSON or structured flow with question branches, hints, and escalation paths.
Validation: Ensure logical progression, no hallucinations, accuracy double-checked.
```

---

## 3. Full-Stack Developer Agent
**Purpose**: Frontend + backend implementation.
```
Task: Implement [feature/component] in Next.js + Tailwind + Firebase.
Constraints: Code must be modular, reusable, and mobile-responsive. Use Firestore for real-time data.
Output: PR-ready code snippet with explanation.
Validation: Must run successfully in dev environment, linked to Firestore.
```

---

## 4. QA/Tester Agent
**Purpose**: Automated testing, correctness validation.
```
Task: Test [feature/system/problem set].
Constraints: Simulate 50 student sessions with diverse inputs. Check for math accuracy, conversational flow, and error handling.
Output: Report with bug list, error rates, and improvement suggestions.
Validation: Identify at least 3 failure cases and propose fixes.
```

---

## 5. Curriculum Specialist Agent
**Purpose**: Generate MOE-aligned math problems and content.
```
Task: Generate problem set for [MOE topic].
Constraints: Must follow P6 MOE syllabus. Include worked solutions + step explanations. Problems should be story-driven and contextually relevant.
Output: 5 example problems with step-by-step solutions.
Validation: Verify correctness and syllabus alignment. Ensure difficulty matches P6 level.
```

---

## 6. UX/UI Agent
**Purpose**: Design child-friendly interfaces.
```
Task: Design wireframe for [feature/page].
Constraints: Age-appropriate for 11–12 year olds. Simple, colorful, with progress indicators. Must fit mobile-first design.
Output: Low-fi or hi-fi wireframe (Figma-style) + usability notes.
Validation: Must include at least 2 engagement elements (story cues, badges, etc.).
```

---

## 7. Project Manager Agent
**Purpose**: Task breakdown, milestone tracking.
```
Task: Break down implementation of [feature/phase] into smaller tasks.
Constraints: Each task should be <1 week effort. Assign to relevant AI agent role. Sequence logically.
Output: Kanban-style task board or milestone checklist.
Validation: Timeline should fit within [X weeks/months].
```

---

## 8. Marketing Agent
**Purpose**: Campaigns, launch materials.
```
Task: Create marketing campaign for [audience/product milestone].
Constraints: Parent-focused, emphasize learning outcomes and trust. Must be culturally relevant for Singapore market.
Output: Campaign copy (ads, landing page, parent email).
Validation: Run 3 parent persona simulations and check resonance.
```

---

## 9. General QA Rule Prompt
For any role, before accepting outputs:
```
Task: Validate output from [agent].
Constraints: Must check accuracy, usability, and alignment with central requirements doc.
Output: List of issues + corrections.
Validation: Confirm output is ready for production OR specify required fixes.
```

---

✅ With these templates, you can **assign tasks to your AI team instantly** by copy-pasting the relevant prompt into your chosen LLM. This ensures consistent outputs across roles and keeps development tightly aligned with your vision.

