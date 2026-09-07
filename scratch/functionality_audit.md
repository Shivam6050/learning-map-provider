# Comprehensive Functionality Audit & Upgrade Plan

## 1. Executive Summary
This scratchpad documents the systematic audit of every core page, API, component, user flow, and AI pipeline in the **Learning Map Provider** application. Based on this audit, we outline key upgrades to transform the application into a state-of-the-art, high-converting, visually wowed learning platform.

---

## 2. Page-by-Page Audit & Functionality Evaluation

### A. Landing Page (`/`)
- **Current State**: Features hero section, stat badges, feature grid, and static sample roadmap. Redirects logged-in users to `/dashboard`.
- **Opportunities for Upgrade**:
  - Add interactive demo preview (allow visitors to toggle between different sample roadmaps like Frontend, Backend, AI/ML directly on the home page).
  - Add animated glow badges and micro-interactions on features.

### B. Onboarding & Path Creation (`/onboarding` & `/onboarding/select`)
- **Current State**: Field picker, 5-question technical quiz, skill level selector, weekly hours, budget, currency, 3-option comparison view (`Mastery`, `Practical`, `Saver`).
- **Opportunities for Upgrade**:
  - **Learning Format Preference**: Allow learners to select preferred content types (e.g., Video-heavy, Documentation-heavy, Balanced).
  - **Interactive Time Estimator**: Show dynamic live estimate of total weeks based on selected weekly hours while filling out the form.
  - **Enhanced Quiz Experience**: Add progress bar (e.g. `Question 3 of 5`), instant feedback option, and summary calibration card.
  - **Roadmap Comparison Details**: Upgrade option cards with expandable stage previews, breakdown of free vs paid resources, and total hours badge.

### C. Learning Path Detail & Interactive Board (`/paths/[id]`)
- **Current State**: Metric header, timeline, budget conversion, SVG PathBoard with animated avatar, stage cards with resource links, practice check tasks, star ratings, and ICS export.
- **Opportunities for Upgrade**:
  - **Interactive Practice Check Verification**: Add a submission modal/field where learners can paste project URLs or notes for practice tasks, with progress saved to DB.
  - **Stage Filter & Search Bar**: Filter stages by status (`All`, `In Progress`, `Completed`, `Not Started`) or search stage titles/topics.
  - **Smooth Node Navigation**: Clicking a node on the `PathBoard` smoothly scrolls and highlights the targeted stage card.
  - **Custom Notes & Resources**: Allow learners to add personal notes or additional custom links to any stage.

### D. User Dashboard (`/dashboard`)
- **Current State**: Profile header with avatar, overall pie chart, quick action card, active roadmaps list with progress bars and delete modal.
- **Opportunities for Upgrade**:
  - **"Resume Learning" Hero Callout**: Highlight the exact current stage in progress across all paths so the user can jump right back in with 1 click.
  - **Learning Streak & Analytics**: Display active streak (days studied), total hours logged, and completed stage count.
  - **Sorting & Filtering**: Sort roadmaps by `Recently Updated`, `Progress %`, or `Domain`.

### E. Settings & Profile (`/settings`)
- **Current State**: Display name edit, 8 companion avatars, password confirm for account deletion.
- **Opportunities for Upgrade**:
  - **Live Avatar Card Preview**: Show a preview card of how the selected companion avatar looks on stage roadmaps.
  - **Toast Notifications**: Add smooth feedback alerts for saved profile changes.

---

## 3. Implementation Plan Highlights
1. **Core Data & Schema Upgrades**:
   - Extend `stage_progress` schema / payload to support learner notes & practice task completion submissions.
2. **Interactive UI Components**:
   - Build `PracticeCheckModal` / `StageNoteEditor` component.
   - Build `StageFilterBar` component for path pages.
   - Build `ResumeLearningCard` on the dashboard.
   - Build `SampleRoadmapTabs` on the landing page.
3. **Design System & Aesthetics**:
   - Polish CSS with glassmorphism glow, smooth transitions, and responsive dark theme accents.
