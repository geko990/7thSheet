
# Tabs & Inventory Implementation Plan

## 1. CharacterSheet Class Update
- Add state `activeTab` (default: 'sheet').
- `renderCharacter(id)`:
  - Check/Migrate data (add `inventory: []`, `journal: []`, `wealth: 0` if missing).
  - Render Tab Navigation (Top of card).
  - Render Content based on `activeTab`.

## 2. Views
- **Sheet View**: Existing content.
  - Add "Modifica" button next to Wealth.
  - Add "Level Up" button.
- **Inventory View**:
  - List items.
  - "Aggiungi Oggetto" button (Modal or inline inputs).
  - Delete item button.
- **Journal View**:
  - Textarea for free text OR list of dated entries. Use list of entries for structure.
  - "Nuova Nota" button.

## 3. Data Persistence
- Every change (Add Item, Save Note, Spend Wealth) triggers `Storage.saveCharacter(this.character)`.

