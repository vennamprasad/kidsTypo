# Changelog

All notable changes to the KiddoTaps project will be documented in this file.

## [Unreleased] - 2026-03-17

### Added
- **Landing Page**: New premium, magical landing page explaining features at `/`.
- **Parent Profile Onboarding**: First-time login captures Parent Name, Child Name, and Child Age at `/setup`.
- **Play Area Routing**: Relocated the interactive games from `/` to `/play`.
- **Firebase Cloud Sync**: Live bidirectional sync of offline `session` stats (key presses, bubbles popped, stars caught) to Firestore upon exit to the Parent Dashboard.
- **Firebase Storage for Art**: "Save" button in the Magic Canvas now syncs the `.png` artwork to Firebase Storage in addition to the local download.
- **Persistent Stats**: Enabled Zustand `persist` middleware to survive hard page reloads.

### Changed
- Dashboard charts now fetch live aggregated Firestore data instead of rendering hardcoded dummy arrays.
- Parent Control lock button now functions securely, routing directly to the Parent Dashboard.

### Fixed
- Stabilized `usePixiApp` React hook lifecycle to prevent memory leaks and `TypeError: reading 'geometry'` crashes when rapidly switching between games.
- Resolved "blank image" issues by correctly passing the native drawing buffer to the canvas capturer.
- Fixed the Paint Size slider CSS visibility issue in the DrawCanvas.
- Corrected the 'Rex' typo on the sticker button.
