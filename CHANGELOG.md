# Changelog

All notable changes to this project will be documented in this file.

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
