async function performPasteByTyping() {
    void 0;
    
    const activeElement = document.activeElement;
    console.log('[PasteByTyping] Active element:', {
        tagName: activeElement?.tagName,
        isContentEditable: activeElement?.isContentEditable,
        id: activeElement?.id,
        className: activeElement?.className
    });

    if (!activeElement || !(activeElement.isContentEditable || activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        void 0;
        return;
    }

    try {
        let clipText = '';
        let clipboardSource = 'none';
        
        // First, try native clipboard (prioritize external app copies)
        try {
            clipText = await navigator.clipboard.readText();
            clipboardSource = 'native';
            void 0;
        } catch (clipErr) {
            void 0;
        }
        
        // If empty, fall back to our custom clipboard storage
        if (!clipText && window._xcb) {
            clipText = window._xcb;
            clipboardSource = '_xcb';
            void 0;
        }
        
        if (!clipText) {
            void 0;
            // alert('No clipboard content available. Please copy some text first.');
            return;
        }
        
        void 0;

        // Normalize line endings and filter out tab characters
        const textToType = clipText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\t/g, '');
        
        window._pta = true;
        
        const stopTypingHandler = (e) => {
            if (e.key === 'Backspace' && window._pta) {
                void 0;
                window._pta = false;
            }
        };
        
        document.addEventListener('keydown', stopTypingHandler);

        try {
            // Simulate typing character by character with realistic delays
            for (let i = 0; i < textToType.length; i++) {
                if (!window._pta) {
                    break;
                }
                
                const char = textToType[i];
            
            // Insert character at current cursor position
            if (activeElement.isContentEditable) {
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const textNode = document.createTextNode(char);
                    range.insertNode(textNode);
                    range.setStartAfter(textNode);
                    range.setEndAfter(textNode);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            } else {
                const start = activeElement.selectionStart || 0;
                const end = activeElement.selectionEnd || 0;
                const text = activeElement.value || '';
                const newText = text.substring(0, start) + char + text.substring(end);
                activeElement.value = newText;
                activeElement.setSelectionRange(start + 1, start + 1);
            }
            
            // Dispatch input event for each character
            activeElement.dispatchEvent(new InputEvent('input', { 
                bubbles: true, 
                cancelable: true,
                inputType: 'insertText',
                data: char
            }));
            
            // Random delay between 50-200ms for each letter (realistic typing speed)
            const letterDelay = Math.random() * 150 + 50; // Random between 50-200ms
            await new Promise(resolve => setTimeout(resolve, letterDelay));
            
            // Add extra delay after space (end of word)
            if (char === ' ') {
                const wordDelay = Math.random() * 500 + 300; // Random between 300-800ms
                await new Promise(resolve => setTimeout(resolve, wordDelay));
            }
            
            // Add extra delay after sentence-ending punctuation
            if (char === '.' || char === '!' || char === '?') {
                const sentenceDelay = Math.random() * 500 + 500; // Random between 500-1000ms
                await new Promise(resolve => setTimeout(resolve, sentenceDelay));
            }
        }
        
        } finally {
            document.removeEventListener('keydown', stopTypingHandler);
        }

        // Dispatch change event after all typing is complete
        activeElement.dispatchEvent(new Event('change', { bubbles: true }));
        void 0;

    } catch (err) {
        void 0;
    }
}

async function performDragDropPaste() {
    void 0;
    
    const activeElement = document.activeElement;
    console.log('[DragDropPaste] Active element:', {
        tagName: activeElement?.tagName,
        isContentEditable: activeElement?.isContentEditable,
        id: activeElement?.id,
        className: activeElement?.className
    });

    if (!activeElement || !(activeElement.isContentEditable || activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        void 0;
        return;
    }

    try {
        let clipText = '';
        let clipboardSource = 'none';
        
        // First, try native clipboard (prioritize external app copies)
        try {
            clipText = await navigator.clipboard.readText();
            clipboardSource = 'native';
            void 0;
        } catch (clipErr) {
            void 0;
        }
        
        // If empty, fall back to our custom clipboard storage
        if (!clipText && window._xcb) {
            clipText = window._xcb;
            clipboardSource = '_xcb';
            void 0;
        }
        
        if (!clipText) {
            void 0;
            // alert('No clipboard content available. Please copy some text first.');
            return;
        }
        
        void 0;

        // Normalize line endings
        clipText = clipText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

        // Store initial value to check if drop worked
        const initialValue = activeElement.value || activeElement.textContent || activeElement.innerHTML || '';
        const initialLength = initialValue.length;

        // Create a DataTransfer object with items
        const dataTransfer = new DataTransfer();
        
        // Add the text as both plain text and HTML
        dataTransfer.items.add(clipText, 'text/plain');
        dataTransfer.items.add(clipText, 'text/html');
        
        console.log('[DragDropPaste] DataTransfer created:', {
            types: Array.from(dataTransfer.types),
            items: dataTransfer.items.length,
            hasText: dataTransfer.types.includes('text/plain'),
            getData: dataTransfer.getData('text/plain').substring(0, 30)
        });

        // Get the position where to drop (cursor position or center of element)
        let clientX, clientY;
        
        if (activeElement.isContentEditable) {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                clientX = rect.left || rect.x;
                clientY = rect.top || rect.y;
            } else {
                const rect = activeElement.getBoundingClientRect();
                clientX = rect.left + rect.width / 2;
                clientY = rect.top + rect.height / 2;
            }
        } else {
            const rect = activeElement.getBoundingClientRect();
            clientX = rect.left + rect.width / 2;
            clientY = rect.top + rect.height / 2;
        }

        // Create and dispatch dragenter event
        const dragenterEvent = new DragEvent('dragenter', {
            bubbles: true,
            cancelable: true,
            composed: true,
            dataTransfer: dataTransfer,
            clientX: clientX,
            clientY: clientY,
            screenX: clientX,
            screenY: clientY,
            view: window
        });
        
        activeElement.dispatchEvent(dragenterEvent);

        // Create and dispatch dragover event
        const dragoverEvent = new DragEvent('dragover', {
            bubbles: true,
            cancelable: true,
            composed: true,
            dataTransfer: dataTransfer,
            clientX: clientX,
            clientY: clientY,
            screenX: clientX,
            screenY: clientY,
            view: window
        });
        
        activeElement.dispatchEvent(dragoverEvent);

        // Create and dispatch the drop event
        const dropEvent = new DragEvent('drop', {
            bubbles: true,
            cancelable: true,
            composed: true,
            dataTransfer: dataTransfer,
            clientX: clientX,
            clientY: clientY,
            screenX: clientX,
            screenY: clientY,
            view: window
        });

        const dropResult = activeElement.dispatchEvent(dropEvent);

        // Give a small delay for the drop to be processed
        await new Promise(resolve => setTimeout(resolve, 150));
        
        // Check if the drop event actually worked by checking exact length change
        const finalValue = activeElement.value || activeElement.textContent || activeElement.innerHTML || '';
        const finalLength = finalValue.length;
        const expectedLength = initialLength + clipText.length;
        const lengthChanged = finalLength !== initialLength;
        const lengthMatches = Math.abs(finalLength - expectedLength) <= 5; // Allow small variance for HTML

        // If drop didn't work, use fallback method
        if (!lengthChanged) {
            
            if (activeElement.isContentEditable) {
                
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    range.deleteContents();
                    const textNode = document.createTextNode(clipText);
                    range.insertNode(textNode);
                    range.setStartAfter(textNode);
                    range.setEndAfter(textNode);
                    selection.removeAllRanges();
                    selection.addRange(range);
                    
                    activeElement.dispatchEvent(new InputEvent('input', { 
                        bubbles: true, 
                        cancelable: true,
                        inputType: 'insertText',
                        data: clipText
                    }));
                    activeElement.dispatchEvent(new Event('change', { bubbles: true }));
                }
            } else {
                
                const start = activeElement.selectionStart || 0;
                const end = activeElement.selectionEnd || 0;
                const text = activeElement.value || '';
                const newText = text.substring(0, start) + clipText + text.substring(end);
                const newCursorPos = start + clipText.length;
                
                activeElement.value = newText;
                activeElement.setSelectionRange(newCursorPos, newCursorPos);
                
                activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                activeElement.dispatchEvent(new Event('change', { bubbles: true }));
            }
        } else {
        }

    } catch (err) {
    }
}

// Override drag and drop events to enable pasting via drag-drop
(function() {
    // Enable drag and drop paste by preventing default blocking
    ['dragenter', 'dragover', 'drop'].forEach(eventName => {
        document.addEventListener(eventName, function(event) {
            // Allow drag and drop for input elements
            const target = event.target;
            if (target && (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
                event.stopPropagation();
                // Don't prevent default for 'drop' - let it pass through
                if (eventName !== 'drop') {
                    event.preventDefault();
                }
            }
        }, true); // Capture phase to intercept before website's handlers
    });

    // Also enable paste events
    document.addEventListener('paste', function(event) {
        const target = event.target;
        if (target && (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
            event.stopPropagation();
        }
    }, true);

    void 0;
})();

// Handle both Ctrl+V/Cmd+V (standard paste) and Alt+Shift+V/Option+Shift+V (drag-drop paste)
document.addEventListener('keydown', async function(event) {
    const altKey = event.altKey;
    const ctrlKey = event.ctrlKey || event.metaKey; // Support both Ctrl (Windows/Linux) and Cmd (macOS)
    
    // Ctrl+V / Cmd+V (standard default paste behavior)
    if (ctrlKey && !event.shiftKey && !event.altKey && (event.key === 'V' || event.key === 'v')) {
        const activeElement = document.activeElement;
        
        // Only handle paste for input elements
        if (activeElement && (activeElement.isContentEditable || activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            
            try {
                let clipText = '';
                
                // First try native clipboard (prioritize external app copies)
                try {
                    clipText = await navigator.clipboard.readText();
                    void 0;
                } catch (err) {
                    void 0;
                }
                
                // If empty, fall back to _xcb
                if (!clipText && window._xcb) {
                    clipText = window._xcb;
                    void 0;
                }
                
                if (clipText) {
                    // Normalize line endings
                    clipText = clipText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
                    
                    // Store initial value to check if paste worked
                    const initialValue = activeElement.value || activeElement.textContent || activeElement.innerHTML || '';
                    const initialLength = initialValue.length;
                    
                    // Direct paste for input elements
                    if (activeElement.isContentEditable) {
                        const selection = window.getSelection();
                        if (selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0);
                            range.deleteContents();
                            const textNode = document.createTextNode(clipText);
                            range.insertNode(textNode);
                            range.setStartAfter(textNode);
                            range.setEndAfter(textNode);
                            selection.removeAllRanges();
                            selection.addRange(range);
                            
                            activeElement.dispatchEvent(new InputEvent('input', { 
                                bubbles: true, 
                                cancelable: true,
                                inputType: 'insertText',
                                data: clipText
                            }));
                            activeElement.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    } else {
                        const start = activeElement.selectionStart || 0;
                        const end = activeElement.selectionEnd || 0;
                        const text = activeElement.value || '';
                        const newText = text.substring(0, start) + clipText + text.substring(end);
                        const newCursorPos = start + clipText.length;
                        
                        activeElement.value = newText;
                        activeElement.setSelectionRange(newCursorPos, newCursorPos);
                        
                        activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                        activeElement.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    
                    // Check if paste actually worked by verifying content changed
                    await new Promise(resolve => setTimeout(resolve, 50));
                    const finalValue = activeElement.value || activeElement.textContent || activeElement.innerHTML || '';
                    const finalLength = finalValue.length;
                    
                    // If the content didn't change, fall back to typing method
                    if (finalLength === initialLength) {
                        void 0;
                        await performPasteByTyping();
                    } else {
                        void 0;
                    }
                }
            } catch (err) {
                void 0;
                // If error occurs, try typing method as fallback
                void 0;
                await performPasteByTyping();
            }
        }
    }
    // Alt+Shift+V (Option+Shift+V on macOS) triggers drag-drop paste
    else if (altKey && event.shiftKey && (event.key === 'V' || event.key === 'v')) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        await performDragDropPaste();
    }
}, true);
