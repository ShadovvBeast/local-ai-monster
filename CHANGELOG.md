# Changelog

All notable changes to this project will be documented in this file.

## [0.0.2] – 2025-07-19

### Added

* **Complete UI Overhaul** – Redesigned the entire application with a modern, professional interface.
  * **Modern Dark Theme** – Implemented a sophisticated dark theme with blue-purple gradient accents.
  * **Custom Design System** – Created a unified design system with CSS custom properties for consistent theming.
  * **Welcome Screen** – Added an elegant welcome message with feature highlights for new users.
  * **Professional Header** – Three-section layout with hamburger menu, centered gradient logo, and status indicator.
  * **Enhanced Sidebar** – Modern chat list with card-style buttons, gradient "New Chat" button, and collapsible settings.
  * **Improved Chat Interface** – Redesigned message bubbles, typing indicators, and input area with animations.
  * **Status Bar Enhancements** – Dynamic SVG icons for different states and animated progress bar with percentage display.
  * **Micro-interactions** – Added smooth animations, hover effects, and transitions throughout the interface.
  * **Glass Morphism Effects** – Subtle transparency and backdrop blur for modern visual appeal.

### Changed

* **Replaced Tailwind CSS** – Completely migrated from Tailwind CSS to custom CSS for unified styling approach.
* **Component Architecture** – Refactored all components to use custom CSS classes instead of utility classes.
* **Temperature Control** – Replaced Potentiometer component with native range input for better type safety.
* **Typography** – Upgraded to Inter font family with proper weights and improved readability.
* **Color Palette** – Introduced a sophisticated color system with CSS custom properties.
* **Layout Structure** – Improved responsive design and fixed layout positioning issues.

### Removed

* **Tailwind CSS Dependencies** – Removed `tailwindcss`, `postcss`, `autoprefixer`, and related packages.
* **ShadCN Dependencies** – Removed `@shadcn/ui`, `class-variance-authority`, `tailwind-merge`, and `tailwindcss-animate`.
* **Configuration Files** – Removed `tailwind.config.js` and `postcss.config.cjs` as they're no longer needed.
* **Legacy Styles** – Cleaned up old utility classes and inconsistent styling approaches.

### Fixed

* **Layout Issues** – Resolved sidebar overlap and content positioning problems.
* **Type Safety** – Fixed TypeScript errors related to component props and event handlers.
* **Styling Conflicts** – Eliminated conflicts between Tailwind classes and custom CSS.
* **Component Integration** – Improved component communication and state management.

---

## [0.0.1] – 2025-07-13

### Added

* **Rotary knob UI** – Replaced the old custom potentiometer with the maintained `react-dial-knob` component.
  * Implements polished `Donut` skin with snapping to three presets: **Speed**, **Balanced**, **Quality**.
* **GPU VRAM optimisation groundwork** – Updated `useModels` hook to better estimate GPU VRAM and rank models accordingly (speed / recency weighting).
* **Sidebar controls** – Integrated the new potentiometer into settings sidebar for seamless optimisation-mode switching.

### Changed

* Migrated dependencies; removed `react-rotary-knob` & skin-pack, added `react-dial-knob`.
* Minor UI tweaks to chat container height for better layout.

### Fixed

* Runtime errors caused by previous knob skin package.

---

Past versions have not been tracked.
