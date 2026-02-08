/**
 * PasteHandler Utility
 * Handles pasting images from clipboard to a target element or globally.
 */
export const PasteHandler = {
    /**
     * Attaches a paste event listener to the specified element (or document).
     * @param {HTMLElement} element - The element to listen on (e.g., document, modal, input).
     * @param {Function} onImagePaste - Callback function receiving the File object.
     */
    attach(element, onImagePaste) {
        element.addEventListener('paste', (e) => {
            // Get clipboard data
            const clipboardData = e.clipboardData || e.originalEvent.clipboardData;
            if (!clipboardData || !clipboardData.items) return;

            const items = clipboardData.items;

            for (const item of items) {
                // Check if the item is an image
                if (item.type.indexOf('image') === 0) {
                    const blob = item.getAsFile();
                    if (blob) {
                        e.preventDefault(); // Prevent default paste behavior (e.g. text)
                        onImagePaste(blob);
                        return; // Stop after finding the first image
                    }
                }
            }
        });
    }
};
