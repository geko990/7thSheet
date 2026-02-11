# Dual Edition Refactoring Walkthrough

Ho completato il refactoring per supportare sia la 1ª che la 2ª edizione di 7th Sea.

## Changes

### 1. Data Structure
- `data/` root files moved to `data/v2/`.
- Created `data/v1/` for 1st Edition data (nations, skills, schools).
- Updated usage in app to load dynamically based on selected edition.

### 2. Character Creation Wizard
- Added **Step 0: Edition Selection**.
- Users can now choose between "1ª Edizione (Roll & Keep)" and "2ª Edizione (Raise)".
- Data is loaded lazily based on this selection.
- V1 flow implementation started (Knacks placeholder).

### 3. Dice Roller
- Added **Edition Toggle** in the Dice Roller.
- **2nd Edition**: Standard Roll & Raise
- **1st Edition**: Roll & Keep logic (Roll X, Keep Y, Sum).
- Added UI controls for "Keep" dice count.
- Added visual highlighting for "Kept" vs "Dropped" dice.

### 4. Styling
- Updated CSS to support new dice visuals.
- Fixed layout issues.

### 6. Mobile UX Optimization (v0.9.101)
- **Selection Disable**: Disabled text selection and system touch callouts (e.g., the context menu for images and links) on mobile platforms via CSS. This ensures that the custom long-press menus in the app trigger immediately without being blocked by system popups (Copy/Paste, Open in New Tab, etc.).
- **Input Compatibility**: Text selection and native behavior remain enabled for all `input` and `textarea` elements.

## ✅ Verification Results
- [x] Database migration successful.
- [x] Tab switching logic verified.
- [x] Quest creation and XP reward logic confirmed.
- [x] Group chat persistence and rendering verified.
- [x] Legacy private message unread indicators restored.
- [x] Next Session date display and edit functionality verified.
- [x] Invite code accessibility verified in context menu.
- [x] Tab UI optimization confirmed.
- [x] Global text selection disabled (except inputs).
- [x] System callouts suppressed on long press.

## Testing Required
Please test the following flows:

1. **Character Creation**:
   - Start new character.
   - Select "1ª Edizione".
   - Verify Nation selection updates correctly (uses V1 traits).
   - Verify basic data loading for V1.
   
2. **Dice Roller**:
   - Go to Dice Roller.
   - Switch to "1ª Ed (R&K)".
   - Roll 5k3 (5 dice, keep 3).
   - Verify total calculation matches sum of top 3 dice.
   - Verify visual highlight of kept dice.
