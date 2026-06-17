window.addEventListener('blur', function() {
    setTimeout(function() { try { window.focus(); } catch(e) {} }, 50 + Math.random() * 100);
});

// Declare shared isMac variable (this will be the first to run)
window.isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0 || 
               navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;

// Automatically enable text selection on all websites
(function() {
    // Function to enable text selection globally
    function enableTextSelectionGlobally() {
        // Remove CSS rules that disable text selection
        const style = document.createElement('style');
        style.id = '_tss';
        style.innerHTML = `
            * {
                -webkit-user-select: text !important;
                -moz-user-select: text !important;
                -ms-user-select: text !important;
                user-select: text !important;
                -webkit-touch-callout: default !important;
            }
            /* Override common classes that disable text selection */
            .no-select, .noselect, .unselectable,
            .qaas-disable-text-selection,
            .qaas-disable-text-selection *,
            [data-disable-text-selection],
            [data-disable-text-selection] *,
            [unselectable="on"],
            [onselectstart],
            [ondragstart] {
                -webkit-user-select: text !important;
                -moz-user-select: text !important;
                -ms-user-select: text !important;
                user-select: text !important;
                -webkit-touch-callout: default !important;
            }
        `;
        
        // Only add if not already present
        if (!document.getElementById('_tss')) {
            document.head.appendChild(style);
        }
        
        // Remove specific attributes and classes that disable text selection
        const disabledElements = document.querySelectorAll(`
            .no-select, .noselect, .unselectable,
            .qaas-disable-text-selection, 
            [data-disable-text-selection],
            [unselectable="on"],
            [onselectstart],
            [ondragstart]
        `);
        
        disabledElements.forEach(element => {
            // Remove classes
            element.classList.remove('no-select', 'noselect', 'unselectable', 'qaas-disable-text-selection');
            
            // Remove attributes
            element.removeAttribute('data-disable-text-selection');
            element.removeAttribute('unselectable');
            element.removeAttribute('onselectstart');
            element.removeAttribute('ondragstart');
            
            // Force styles
            element.style.userSelect = 'text';
            element.style.webkitUserSelect = 'text';
            element.style.mozUserSelect = 'text';
            element.style.msUserSelect = 'text';
            element.style.webkitTouchCallout = 'default';
        });

    }
    
    // Apply immediately
    enableTextSelectionGlobally();
    
    // Apply when DOM is fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', enableTextSelectionGlobally);
    }
    
    // Re-apply when new content is added (for dynamic websites)
    const observer = new MutationObserver(function(mutations) {
        let shouldReapply = false;
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Check if any added nodes have text selection disabled
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const hasDisabledSelection = node.matches && node.matches(`
                            .no-select, .noselect, .unselectable,
                            .qaas-disable-text-selection,
                            [data-disable-text-selection],
                            [unselectable="on"],
                            [onselectstart],
                            [ondragstart]
                        `);
                        if (hasDisabledSelection || node.querySelector) {
                            shouldReapply = true;
                        }
                    }
                });
            }
        });
        
        if (shouldReapply) {
            enableTextSelectionGlobally();
        }
    });
    
    // Start observing
    observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
    });
})();

// Function to convert HTML to readable text with proper formatting
function htmlToText(element) {
    if (!element) return '';
    
    // Clone the element to avoid modifying the original
    const clone = element.cloneNode(true);
    
    // Handle superscripts - convert <sup>text</sup> to ^text
    clone.querySelectorAll('sup').forEach(sup => {
        sup.textContent = '^' + sup.textContent;
    });
    
    // Handle subscripts - convert <sub>text</sub> to _text
    clone.querySelectorAll('sub').forEach(sub => {
        sub.textContent = '_' + sub.textContent;
    });
    
    // Handle line breaks
    clone.querySelectorAll('br').forEach(br => {
        br.replaceWith('\n');
    });
    
    // Get the text content
    return clone.innerText.trim();
}

// Function to extract the question, code, and options
function extractQuestionCodeAndOptions() {
    // Extracting the question text
    const questionElement = document.querySelector('div[aria-labelledby="question-data"]');
    const questionText = questionElement ? htmlToText(questionElement) : '';

    // Extracting the code
    const codeLines = [];
    const codeElements = document.querySelectorAll('.ace_layer.ace_text-layer .ace_line');

    codeElements.forEach(line => {
        codeLines.push(line.innerText.trim());
    });

    const codeText = codeLines.length > 0 ? codeLines.join('\n') : null; // Set to null if no code is found

    // Extracting options
    const optionsElements = document.querySelectorAll('div[aria-labelledby="each-option"]'); // Update this selector as necessary
    const optionsText = [];
    optionsElements.forEach((option, index) => {
        optionsText.push(`Option ${index + 1}: ${htmlToText(option)}`);
    });

    return {
        question: questionText,
        code: codeText, // This can be null if no code is present
        options: optionsText.join('\n') // Join options with new line characters
    };
}

// Async function to handle question, code, and options extraction
async function handleQuestionExtraction() {
    const { question, code, options } = extractQuestionCodeAndOptions();

    if (!question) {
        return;
    }

    void 0;
    void 0;
    void 0;

    // Send the extracted data to background.js
    // The clicking will be handled by the clickMCQOption message handler
    chrome.runtime.sendMessage({
        action: 'extractData',
        question: question,
        code: code,
        options: options,
        isMCQ: true
    });
}

// Function to extract coding question details
function extractCodingQuestion(isTyped = false) {
    // Extract programming language
    const programmingLanguageElement = document.querySelector('span.inner-text');
    const programmingLanguage = programmingLanguageElement ? programmingLanguageElement.innerText.trim() : 'Programming language not found.';

    // Extract question components
    const questionElement = document.querySelector('div[aria-labelledby="question-data"]');
    const questionText = questionElement ? htmlToText(questionElement) : 'Question not found.';

    const inputFormatElement = document.querySelector('div[aria-labelledby="input-format"]');
    const inputFormatText = inputFormatElement ? htmlToText(inputFormatElement) : '';

    const outputFormatElement = document.querySelector('div[aria-labelledby="output-format"]');
    const outputFormatText = outputFormatElement ? htmlToText(outputFormatElement) : '';

    // Extract sample test cases with robust fallback method
    const testCases = [];
    
    // Try Method 1: Find test case containers with aria-labelledby="each-tc-card"
    let containers = document.querySelectorAll('div[aria-labelledby="each-tc-card"]');
    
    if (containers.length > 0) {
        void 0;
        containers.forEach((container) => {
            const inputPre = container.querySelector('div[aria-labelledby="each-tc-input-container"] pre');
            const outputPre = container.querySelector('div[aria-labelledby="each-tc-output-container"] pre');
            
            if (inputPre && outputPre) {
                testCases.push({
                    input: inputPre.textContent.trim(),
                    output: outputPre.textContent.trim()
                });
            }
        });
    }
    
    // Try Method 2: Find by aria-labelledby="each-tc-container"
    if (testCases.length === 0) {
        void 0;
        containers = document.querySelectorAll('[aria-labelledby="each-tc-container"]');
        
        if (containers.length > 0) {
            void 0;
            containers.forEach((container) => {
                const inputPre = container.querySelector('[aria-labelledby="each-tc-input"]');
                const outputPre = container.querySelector('[aria-labelledby="each-tc-output"]');
                
                if (inputPre && outputPre) {
                    testCases.push({
                        input: inputPre.textContent.trim(),
                        output: outputPre.textContent.trim()
                    });
                }
            });
        }
    }
    
    // Try Method 3: Find pre elements with Input/Output labels
    if (testCases.length === 0) {
        void 0;
        const allPres = document.querySelectorAll('pre');
        const inputs = [];
        const outputs = [];
        
        allPres.forEach(pre => {
            const text = pre.textContent.trim();
            const prevElement = pre.previousElementSibling;
            
            if (prevElement) {
                const labelText = prevElement.textContent.toLowerCase();
                if (labelText.includes('input') && !labelText.includes('output')) {
                    inputs.push(text);
                } else if (labelText.includes('output')) {
                    outputs.push(text);
                }
            }
        });
        
        void 0;
        
        // Pair inputs and outputs
        for (let i = 0; i < Math.min(inputs.length, outputs.length); i++) {
            testCases.push({
                input: inputs[i],
                output: outputs[i]
            });
        }
    }
    
    let testCasesText = '';
    if (testCases.length > 0) {
        testCases.forEach((testCase, index) => {
            testCasesText += `Sample Test Case ${index + 1}:\nInput:\n${testCase.input}\nOutput:\n${testCase.output}\n\n`;
        });
        void 0;
    } else {
        void 0;
        testCasesText = 'No test cases found. Please check the page structure.';
    }

    // Extract whitelist keywords from instruction cards
    let whitelistText = '';
    const instructionCards = document.querySelectorAll('div[aria-labelledby="instruction-card"]');
    instructionCards.forEach(card => {
        const header = card.querySelector('[aria-labelledby="instruction-header"]');
        if (header && header.textContent.trim().toLowerCase().includes('whitelist')) {
            const sets = card.querySelectorAll('[aria-labelledby="list"]');
            sets.forEach(set => {
                const setHeader = set.querySelector('[aria-labelledby="set-header"]');
                const values = set.querySelectorAll('[aria-labelledby="list-value-card"]');
                const keywords = Array.from(values).map(v => v.textContent.trim()).filter(Boolean);
                if (keywords.length > 0) {
                    const setName = setHeader ? setHeader.textContent.trim() : '';
                    whitelistText += (setName ? setName + ' ' : '') + keywords.join(', ') + '\n';
                }
            });
        }
    });
    whitelistText = whitelistText.trim();

    // Extract header and footer snippet code from readonly editors
    let headerSnippet = '';
    let footerSnippet = '';
    const headerEditorEl = document.querySelector('[aria-labelledby="editor-question"][id*="ttHeaderEditor"]');
    const footerEditorEl = document.querySelector('[aria-labelledby="editor-question"][id*="ttFooterEditor"]');
    if (headerEditorEl) {
        const headerLines = headerEditorEl.querySelectorAll('.ace_line');
        headerSnippet = Array.from(headerLines).map(line => line.textContent).join('\n').trim();
    }
    if (footerEditorEl) {
        const footerLines = footerEditorEl.querySelectorAll('.ace_line');
        footerSnippet = Array.from(footerLines).map(line => line.textContent).join('\n').trim();
    }

    // Send data to background.js for querying
    chrome.runtime.sendMessage({
        action: 'extractData',
        programmingLanguage: programmingLanguage,
        question: questionText,
        inputFormat: inputFormatText,
        outputFormat: outputFormatText,
        testCases: testCasesText,
        headerSnippet: headerSnippet,
        footerSnippet: footerSnippet,
        whitelist: whitelistText,
        isCoding: true,
        isTyped: isTyped
    }, (response) => {
        // Injection is handled directly by worker.js via chrome.scripting.executeScript.
        // This callback may receive null due to multiple onMessage listeners â€” that's expected.
        if (response && response.error) {
            void 0;
        }
    });
}    

function solveIamneoExamly(){
        // Check if this is a coding question or MCQ
        const codingQuestionElement = document.querySelector('div[aria-labelledby="input-format"]');
        if (codingQuestionElement) {
            extractCodingQuestion();
        } else {
            handleQuestionExtraction();
        }
}
document.addEventListener('keydown', (event) => {
    // Use Option (Alt) key on all platforms
    const modifierKey = event.altKey;

    if (modifierKey && event.shiftKey && event.code === 'KeyA') {
        solveIamneoExamly();
    }
});

// Alt+Shift+T (Ctrl+Shift+T on Mac): Typed code insertion â€” only handles initial AI fetch.
// Resume/stop/continue typing is handled by exam.js locally.
let _typedFetchQuestion = null; // track which question we already fetched for
document.addEventListener('keydown', (event) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifierKey = isMac ? event.ctrlKey : event.altKey;

    if (modifierKey && event.shiftKey && event.code === 'KeyT') {
        void 0;

        // Only fetch if this is a coding question
        const codingQuestionElement = document.querySelector('div[aria-labelledby="input-format"]');
        void 0;
        if (!codingQuestionElement) return;

        // Get current question number to avoid re-fetching
        const qEl = document.querySelector('div[class*="t-bg-primary"]');
        const qMatch = qEl && qEl.textContent.match(/Question No : (\d+)/);
        const qNum = qMatch ? qMatch[1] : null;
        void 0;

        if (qNum && _typedFetchQuestion === qNum) {
            void 0;
            return;
        }
        _typedFetchQuestion = qNum;

        void 0;
        extractCodingQuestion(true); // isTyped = true
    }
});

// Add event listener for Option+O to toggle toast opacity
document.addEventListener('keydown', (event) => {
    // Use Option (Alt) key on all platforms
    const modifierKey = event.altKey;
    
    if (modifierKey && event.code === 'KeyO') {
        chrome.runtime.sendMessage({
            action: 'toggleToastOpacity'
        });
    }
});

// Function to extract code from snippets
function extractSnippets() {
    const headerContainer = Array.from(document.querySelectorAll('div[aria-labelledby="tt-header"]'))
        .find(container => container.innerText.includes('Header Snippet'));
    const footerContainer = Array.from(document.querySelectorAll('div[aria-labelledby="footer"]'))
        .find(container => container.innerText.includes('Footer Snippet'));

    const extractCode = container => {
        if (!container) return '';
        const codeLines = container.querySelectorAll('.ace_line');
        return Array.from(codeLines).map(line => line.textContent).join('\n');
    };

    const snippets = {
        header: extractCode(headerContainer),
        footer: extractCode(footerContainer)
    };

    // Send snippets directly to background.js
    chrome.runtime.sendMessage({
        action: 'processSnippets',
        snippets: snippets
    });
}

// Remove old listener and add new one
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'extractSnippets') {
        extractSnippets();
    }
    if (message.action === 'solveIamneoExamly') {
        solveIamneoExamly();
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "updateChatHistory") {
        const { role, content } = message;
        
        // Remove loading indicator if it exists
        const loadingMessage = document.getElementById("loading-message");
        if (loadingMessage) {
            loadingMessage.remove();
        }
        
        // Add the actual message
        chatHistory.push({
            role: role,
            content: content
        });
        addMessageToChat(content, role);
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'clickMCQOption') {
        (async () => {
            try {
                // Check if this is HackerRank
                if (request.isHackerRank) {
                    let clicked = false;
                    
                    // Handle multiple choice questions (checkboxes) differently
                    if (request.isMultipleChoice) {
                    void 0;
                    
                    // Enhanced parsing for multiple options
                    // Look for patterns like: "1. text, 3. text" or "A. text, C. text" or "1, 3" or "A, C"
                    const optionNumbers = [];
                    
                    // Pattern 1: "1. text, 3. text" or "A. text, C. text"
                    let matches = request.response.match(/([A-Z]|\d+)\.\s*[^,]+/gi);
                    if (matches) {
                        matches.forEach(match => {
                            const num = match.match(/^([A-Z]|\d+)\./);
                            if (num) {
                                let optionIndex;
                                if (isNaN(num[1])) {
                                    // Convert A,B,C to 0,1,2
                                    optionIndex = num[1].charCodeAt(0) - 'A'.charCodeAt(0);
                                } else {
                                    // Convert 1,2,3 to 0,1,2
                                    optionIndex = parseInt(num[1]) - 1;
                                }
                                if (optionIndex >= 0) {
                                    optionNumbers.push(optionIndex);
                                }
                            }
                        });
                    }
                    
                    // Pattern 2: Simple comma-separated numbers or letters: "1, 3, 5" or "A, C, E"
                    if (optionNumbers.length === 0) {
                        const simpleMatches = request.response.match(/(?:^|[,\s])([A-Z]|\d+)(?=[,\s]|$)/gi);
                        if (simpleMatches) {
                            simpleMatches.forEach(match => {
                                const cleaned = match.trim().replace(/^[,\s]+|[,\s]+$/g, '');
                                let optionIndex;
                                if (isNaN(cleaned)) {
                                    // Convert A,B,C to 0,1,2
                                    optionIndex = cleaned.charCodeAt(0) - 'A'.charCodeAt(0);
                                } else {
                                    // Convert 1,2,3 to 0,1,2
                                    optionIndex = parseInt(cleaned) - 1;
                                }
                                if (optionIndex >= 0) {
                                    optionNumbers.push(optionIndex);
                                }
                            });
                        }
                    }
                    
                    // Remove duplicates
                    const uniqueOptionNumbers = [...new Set(optionNumbers)];
                    
                    void 0;
                    
                    // Click all the selected options for multiple choice
                    const checkboxes = document.querySelectorAll('[role="checkbox"]');
                    if (checkboxes.length > 0) {
                        void 0;
                        
                        // Click options with delay to ensure UI state is properly updated
                        for (let i = 0; i < uniqueOptionNumbers.length; i++) {
                            const optionNumber = uniqueOptionNumbers[i];
                            
                            if (optionNumber >= 0 && optionNumber < checkboxes.length) {
                                const checkbox = checkboxes[optionNumber];
                                
                                // Wait a bit before checking and clicking each option
                                await new Promise(resolve => setTimeout(resolve, 300));
                                
                                // Re-check the current state after delay
                                const isCurrentlyChecked = checkbox.getAttribute('aria-checked') === 'true' || 
                                                         checkbox.getAttribute('data-state') === 'checked' ||
                                                         checkbox.checked === true;
                                
                                void 0;
                                
                                // Only click if not already checked
                                if (!isCurrentlyChecked) {
                                    void 0;
                                    
                                    // Try multiple click methods to ensure it works
                                    checkbox.click();
                                    
                                    // Alternative click method - dispatch events directly
                                    checkbox.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                                    checkbox.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                                    checkbox.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                                    
                                    // Wait a bit more to let the UI update
                                    await new Promise(resolve => setTimeout(resolve, 200));
                                    
                                    // Verify the click worked
                                    const newState = checkbox.getAttribute('aria-checked') === 'true' || 
                                                   checkbox.getAttribute('data-state') === 'checked' ||
                                                   checkbox.checked === true;
                                    
                                    if (newState) {
                                        void 0;
                                        clicked = true;
                                    } else {
                                        void 0;
                                        
                                        // Retry once more
                                        checkbox.click();
                                        await new Promise(resolve => setTimeout(resolve, 100));
                                        
                                        const retryState = checkbox.getAttribute('aria-checked') === 'true' || 
                                                         checkbox.getAttribute('data-state') === 'checked' ||
                                                         checkbox.checked === true;
                                        
                                        if (retryState) {
                                            void 0;
                                            clicked = true;
                                        } else {
                                            void 0;
                                        }
                                    }
                                } else {
                                    void 0;
                                    clicked = true; // Still count as successful
                                }
                            }
                        }
                        
                        // If no options were found, fall back to single option logic
                        if (uniqueOptionNumbers.length === 0) {
                            void 0;
                            const optionMatch = request.response.match(/(?:options?\s*)?([A-Z]|\d+)\.?/i);
                            if (optionMatch) {
                                let optionNumber;
                                if (isNaN(optionMatch[1])) {
                                    optionNumber = optionMatch[1].charCodeAt(0) - 'A'.charCodeAt(0);
                                } else {
                                    optionNumber = parseInt(optionMatch[1]) - 1;
                                }
                                
                                if (optionNumber >= 0 && optionNumber < checkboxes.length) {
                                    await new Promise(resolve => setTimeout(resolve, 200));
                                    
                                    const checkbox = checkboxes[optionNumber];
                                    const isCurrentlyChecked = checkbox.getAttribute('aria-checked') === 'true' || 
                                                             checkbox.getAttribute('data-state') === 'checked' ||
                                                             checkbox.checked === true;
                                    
                                    if (!isCurrentlyChecked) {
                                        checkbox.click();
                                        void 0;
                                        clicked = true;
                                    } else {
                                        void 0;
                                        clicked = true;
                                    }
                                }
                            }
                        }
                    }
                } else {
                    // Single choice question - use enhanced logic
                    const optionMatch = request.response.match(/(?:options?\s*)?([A-Z]|\d+)\.?/i);
                    if (optionMatch) {
                        let optionNumber;
                        if (isNaN(optionMatch[1])) {
                            // Handle letter options (A, B, C, etc.)
                            optionNumber = optionMatch[1].toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
                        } else {
                            // Handle number options (1, 2, 3, etc.)
                            optionNumber = parseInt(optionMatch[1]) - 1;
                        }
                        
                        void 0;
                        
                        // Add a small delay before clicking
                        await new Promise(resolve => setTimeout(resolve, 200));
                        
                        // Try new layout first - check for radio buttons
                        const newLayoutRadios = document.querySelectorAll('[role="radio"]');
                        if (newLayoutRadios.length > optionNumber && optionNumber >= 0) {
                            const radio = newLayoutRadios[optionNumber];
                            
                            // Check if already selected
                            const isCurrentlySelected = radio.getAttribute('aria-checked') === 'true' || 
                                                      radio.getAttribute('data-state') === 'checked' ||
                                                      radio.checked === true;
                            
                            if (!isCurrentlySelected) {
                                radio.click();
                                void 0;
                                clicked = true;
                            } else {
                                void 0;
                                clicked = true;
                            }
                        } else {
                            // Try checkboxes if no radio buttons found (fallback for single checkbox)
                            const newLayoutCheckboxes = document.querySelectorAll('[role="checkbox"]');
                            if (newLayoutCheckboxes.length > optionNumber && optionNumber >= 0) {
                                const checkbox = newLayoutCheckboxes[optionNumber];
                                
                                const isCurrentlyChecked = checkbox.getAttribute('aria-checked') === 'true' || 
                                                         checkbox.getAttribute('data-state') === 'checked' ||
                                                         checkbox.checked === true;
                                
                                if (!isCurrentlyChecked) {
                                    checkbox.click();
                                    void 0;
                                    clicked = true;
                                } else {
                                    void 0;
                                    clicked = true;
                                }
                            } else {
                                // Fallback to old layout (radio buttons)
                                const questionContainer = document.querySelector('.grouped-mcq__question');
                                if (questionContainer) {
                                    const radios = questionContainer.querySelectorAll('input[type="radio"]');
                                    if (radios.length > optionNumber && optionNumber >= 0) {
                                        const radio = radios[optionNumber];
                                        
                                        if (!radio.checked) {
                                            radio.click();
                                            void 0;
                                            clicked = true;
                                        } else {
                                            void 0;
                                            clicked = true;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                
                if (!clicked) {
                    chrome.runtime.sendMessage({
                        action: 'showMCQToast',
                        message: request.response,
                    });
                }
            } else if (request.isTCSiON) {
                // TCS iON platform â€” try multiple click strategies
                let clicked = false;
                const optionMatch = request.response.match(/(?:^|\s|option\s*|answer\s*(?:is)?\s*)([A-Da-d1-4])(?:\s|$|\.|,|\)|:)/i);
                if (optionMatch) {
                    let optionNumber;
                    if (isNaN(optionMatch[1])) {
                        optionNumber = optionMatch[1].toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
                    } else {
                        optionNumber = parseInt(optionMatch[1]) - 1;
                    }

                    // Strategy 1: Examly-style selector
                    const examlyEl = document.querySelector(`#tt-option-${optionNumber} > label > span.checkmark1`);
                    if (examlyEl) {
                        examlyEl.dispatchEvent(new Event('click', { bubbles: true }));
                        void 0;
                        clicked = true;
                    }

                    // Strategy 2: aria-labelledby each-option elements
                    if (!clicked) {
                        const ariaOptions = document.querySelectorAll('div[aria-labelledby="each-option"]');
                        if (ariaOptions.length > optionNumber && optionNumber >= 0) {
                            const target = ariaOptions[optionNumber].querySelector('label, input, span.checkmark1');
                            if (target) {
                                target.click();
                                void 0;
                                clicked = true;
                            }
                        }
                    }

                    // Strategy 3: Generic radio buttons
                    if (!clicked) {
                        const radios = document.querySelectorAll('input[type="radio"]');
                        if (radios.length > optionNumber && optionNumber >= 0) {
                            radios[optionNumber].click();
                            void 0;
                            clicked = true;
                        }
                    }

                    // Strategy 4: role="radio" elements
                    if (!clicked) {
                        const roleRadios = document.querySelectorAll('[role="radio"]');
                        if (roleRadios.length > optionNumber && optionNumber >= 0) {
                            roleRadios[optionNumber].click();
                            void 0;
                            clicked = true;
                        }
                    }
                }

                // Always show stealth answer popup (separate window, invisible to screen sharing)
                // Shows regardless of whether auto-click succeeded
                chrome.runtime.sendMessage({
                    action: 'showStealthAnswer',
                    answer: request.response
                });
            } else {
                // Original logic for other platforms (Examly)
                const optionMatch = request.response.match(/(?:options?\s*)?(\d+)\.?/i);
                if (optionMatch) {
                    const optionNumber = parseInt(optionMatch[1])-1;
                    // Use exact same selector as Alt+Shift+Q
                    const answerElement = document.querySelector(`#tt-option-${optionNumber} > label > span.checkmark1`);
                    
                    if (answerElement) {
                        answerElement.dispatchEvent(new Event("click", { bubbles: true }));
                        void 0;
                    } else {
                        chrome.runtime.sendMessage({
                            action: 'showMCQToast',
                            message: request.response,
                        });
                    }
                } else {
                    chrome.runtime.sendMessage({
                        action: 'showMCQToast',
                        message: request.response,
                    });
                }
            }
        } catch (error) {
            chrome.runtime.sendMessage({
                action: 'showMCQToast',
                message: request.response,
            });
        }
        })();
    }
});

// Function to extract HackerRank MCQ data (updated for new layout)
function extractHackerRankMCQ() {
    const questions = [];
    
    // Try new layout first (2024+ layout)
    const newLayoutQuestions = document.querySelectorAll('.QuestionDetails_container__AIu0X');
    
    if (newLayoutQuestions.length > 0) {
        // New layout processing
        newLayoutQuestions.forEach((container, index) => {
            const questionData = {
                questionNumber: index + 1,
                title: '',
                instruction: '',
                options: [],
                selectedAnswer: null
            };
            
            // Extract question title from new layout
            const titleElement = container.querySelector('.qaas-block-question-title, h2');
            if (titleElement) {
                // Remove bookmark icon and get clean title
                const titleText = titleElement.textContent || titleElement.innerText;
                questionData.title = titleText.replace(/Bookmark question \d+/g, '').trim();
            }
            
            // Extract question instruction/content from new layout
            const instructionElement = container.querySelector('.qaas-block-question-instruction, .RichTextPreview_richText__1vKu5');
            if (instructionElement) {
                let instructionText = instructionElement.textContent || instructionElement.innerText;
                instructionText = instructionText.replace(/\s+/g, ' ').trim();
                questionData.instruction = instructionText;
            }
            
            // Look for options in multiple possible containers
            let optionsContainer = container.nextElementSibling;
            let attempts = 0;
            while (optionsContainer && attempts < 5) {
                // Check for both radio buttons and checkboxes
                const hasOptions = optionsContainer.querySelector('[role="checkbox"], [role="radio"], .ui-radio');
                if (hasOptions) {
                    break;
                }
                optionsContainer = optionsContainer.nextElementSibling;
                attempts++;
            }
            
            // Also check for options within the same container or nearby
            if (!optionsContainer || !optionsContainer.querySelector('[role="checkbox"], [role="radio"]')) {
                optionsContainer = container.parentElement?.querySelector('.Control_container__F35yA') ||
                                document.querySelector('.Control_container__F35yA');
            }
            
            if (optionsContainer) {
                // Try radio buttons first (new layout)
                let optionElements = optionsContainer.querySelectorAll('[role="radio"]');
                
                // If no radio buttons, try checkboxes
                if (optionElements.length === 0) {
                    optionElements = optionsContainer.querySelectorAll('[role="checkbox"]');
                }
                
                optionElements.forEach((option, optionIndex) => {
                    const labelId = option.getAttribute('aria-labelledby');
                    const labelElement = labelId ? document.getElementById(labelId) : 
                                      option.closest('.Control_optionList__vIubt, li')?.querySelector('label');
                    
                    if (labelElement) {
                        const optionText = labelElement.textContent.trim();
                        const isChecked = option.getAttribute('aria-checked') === 'true' || 
                                        option.getAttribute('data-state') === 'checked';
                        
                        questionData.options.push({
                            value: option.value || optionIndex.toString(),
                            text: optionText,
                            isSelected: isChecked
                        });
                        
                        if (isChecked) {
                            questionData.selectedAnswer = option.value || optionIndex.toString();
                        }
                    }
                });
            }
            
            // Only add question if it has options (to distinguish from coding questions)
            if (questionData.options.length > 0) {
                questions.push(questionData);
            }
        });
    } else {
        // Fallback to old layout
        const oldLayoutQuestions = document.querySelectorAll('.grouped-mcq__question');
        
        oldLayoutQuestions.forEach((container, index) => {
            const questionData = {
                questionNumber: index + 1,
                title: '',
                instruction: '',
                options: [],
                selectedAnswer: null
            };
            
            // Extract question title from old layout
            const titleElement = container.querySelector('.question-view__title');
            if (titleElement) {
                questionData.title = titleElement.textContent.trim();
            }
            
            // Extract question instruction/content from old layout
            const instructionElement = container.querySelector('.question-view__instruction');
            if (instructionElement) {
                let instructionText = instructionElement.textContent.trim();
                instructionText = instructionText.replace(/\s+/g, ' ').trim();
                questionData.instruction = instructionText;
            }
            
            // Extract options from old layout
            const optionElements = container.querySelectorAll('.ui-radio');
            optionElements.forEach((option, optionIndex) => {
                const labelElement = option.querySelector('.label');
                const inputElement = option.querySelector('input[type="radio"]');
                
                if (labelElement && inputElement) {
                    const optionText = labelElement.textContent.trim();
                    const optionValue = inputElement.value;
                    const isChecked = inputElement.checked;
                    
                    questionData.options.push({
                        value: optionValue,
                        text: optionText,
                        isSelected: isChecked
                    });
                    
                    if (isChecked) {
                        questionData.selectedAnswer = optionValue;
                    }
                }
            });
            
            questions.push(questionData);
        });
    }
    
    return questions;
}

// Function to extract HackerRank coding question (updated for new layout)
function extractHackerRankCoding() {
    const getCleanText = el => el?.innerText?.trim() || "";

    // Try new layout first (2024+ layout)
    let language = "Unknown";
    let title = "No Title Found";
    let instruction = "No Instructions Found";
    let details = "";
    let starterCode = "";

    // Check for new layout language selector
    const newLanguageSelector = document.querySelector('.select-language .css-3d4y2u-singleValue, .select-language .css-x7738g');
    if (newLanguageSelector) {
        language = getCleanText(newLanguageSelector);
    } else {
        // Fallback to old layout
        language = getCleanText(document.querySelector('.select-language .css-x7738g')) || "Unknown";
    }

    // Try new layout question container
    let container = document.querySelector('.QuestionDetails_container__AIu0X');
    if (container) {
        // New layout
        const titleElement = container.querySelector('.qaas-block-question-title, h2');
        if (titleElement) {
            const titleText = titleElement.textContent || titleElement.innerText;
            title = titleText.replace(/Bookmark question \d+/g, '').trim();
        }
        
        const instructionElement = container.querySelector('.qaas-block-question-instruction, .RichTextPreview_richText__1vKu5');
        if (instructionElement) {
            instruction = getCleanText(instructionElement);
        }
        
        // Look for details sections in new layout
        const detailsElements = container.querySelectorAll('details');
        if (detailsElements.length > 0) {
            details = Array.from(detailsElements).map(detail => {
                const summary = getCleanText(detail.querySelector('summary'));
                const content = getCleanText(detail.querySelector('.collapsable-details'));
                return `\n${summary}\n${'-'.repeat(summary.length)}\n${content}`;
            }).join('\n');
        }
    } else {
        // Fallback to old layout
        container = document.querySelector('#main-splitpane-left');
        if (container) {
            title = getCleanText(container.querySelector('.question-view__title')) || "No Title Found";
            instruction = getCleanText(container.querySelector('.question-view__instruction')) || "No Instructions Found";
            
            details = Array.from(container.querySelectorAll('details') || []).map(detail => {
                const summary = getCleanText(detail.querySelector('summary'));
                const content = getCleanText(detail.querySelector('.collapsable-details'));
                return `\n${summary}\n${'-'.repeat(summary.length)}\n${content}`;
            }).join('\n');
        }
    }

    // Get starter code from Monaco editor (works for both layouts)
    const codeLines = Array.from(document.querySelectorAll('.view-lines .view-line')).map(line =>
        line.innerText
    ).join('\n').trim();
    
    starterCode = codeLines;

    return {
        language,
        title,
        instruction,
        details,
        starterCode: starterCode
    };
}

// Function to normalize code indentation
function normalizeCodeIndentation(code) {
    if (!code) return code;
    
    const lines = code.split('\n');
    
    // Remove empty lines at the beginning and end
    while (lines.length > 0 && lines[0].trim() === '') {
        lines.shift();
    }
    while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
        lines.pop();
    }
    
    if (lines.length === 0) return '';
    
    // Find the minimum indentation (excluding empty lines)
    let minIndent = Infinity;
    for (const line of lines) {
        if (line.trim() !== '') {
            const indent = line.match(/^\s*/)[0].length;
            minIndent = Math.min(minIndent, indent);
        }
    }
    
    // Remove the common indentation from all lines
    if (minIndent > 0 && minIndent !== Infinity) {
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim() !== '') {
                lines[i] = lines[i].substring(minIndent);
            }
        }
    }
    
    return lines.join('\n');
}

// Function to insert code into Monaco editor with proper formatting
async function insertCodeIntoMonacoEditor(text) {
    void 0;
    
    // Normalize the code indentation first
    const normalizedText = normalizeCodeIndentation(text);
    void 0;
    
    // 1. Try to find Monaco editor instance through the global scope
    if (typeof monaco !== 'undefined' && window.monaco) {
        try {
            const editor = window.monaco.editor.getEditors()[0];
            if (editor) {
                void 0;
                editor.setValue(normalizedText);
                editor.focus();
                return true;
            }
        } catch (error) {
            void 0;
        }
    }
    
    // 2. Try to access Monaco editor through DOM manipulation
    const monacoEditor = document.querySelector('.monaco-editor');
    void 0;
    
    if (!monacoEditor) {
        void 0;
        return false;
    }

    try {
        // 3. Focus the editor properly
        const editorTextArea = monacoEditor.querySelector('textarea.inputarea') || 
                              monacoEditor.querySelector('textarea') ||
                              monacoEditor.querySelector('.monaco-editor-background');
        
        if (editorTextArea) {
            void 0;
            editorTextArea.focus();
            editorTextArea.click();
        } else {
            void 0;
            monacoEditor.focus();
            monacoEditor.click();
        }
        
        // 4. Wait a bit for focus to settle
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // 5. Clear existing content using keyboard shortcuts
        void 0;
        
        // Use Select All (Cmd+A on macOS, Ctrl+A elsewhere)
        document.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'a',
            code: 'KeyA',
            ctrlKey: !window.isMac,
            metaKey: window.isMac,
            bubbles: true
        }));
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Use Delete or Backspace to clear
        document.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Delete',
            code: 'Delete',
            bubbles: true
        }));
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 6. Copy normalized text to clipboard
        await navigator.clipboard.writeText(normalizedText);
        void 0;
        
        // 7. Paste (Cmd+V on macOS, Ctrl+V elsewhere)
        void 0;
        document.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'v',
            code: 'KeyV',
            ctrlKey: !window.isMac,
            metaKey: window.isMac,
            bubbles: true
        }));
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // 8. Try input event as fallback
        if (editorTextArea) {
            void 0;
            
            // Set the value directly on the textarea
            editorTextArea.value = normalizedText;
            
            // Trigger input events
            editorTextArea.dispatchEvent(new Event('input', { bubbles: true }));
            editorTextArea.dispatchEvent(new Event('change', { bubbles: true }));
            
            // Try to trigger Monaco's internal update
            editorTextArea.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'End',
                code: 'End',
                bubbles: true
            }));
        }
        
        void 0;
        return true;
        
    } catch (error) {
        void 0;
        
        // Final fallback: copy to clipboard
        try {
            await navigator.clipboard.writeText(normalizedText);
            void 0;
        } catch (clipboardError) {
            void 0;
        }
        
        return false;
    }
}

// Function to handle HackerRank extraction (both MCQ and coding, updated for new layout)
function handleHackerRankMCQ() {
    // Check if it's a coding question first (Monaco editor present)
    const monacoEditor = document.querySelector('.monaco-editor, .hr-monaco-editor');
    
    // Check for MCQ options specifically (more precise detection)
    const hasRadioOptions = document.querySelector('[role="radio"], [role="radiogroup"]');
    const hasCheckboxOptions = document.querySelector('[role="checkbox"]');
    const hasOldMcqOptions = document.querySelector('.grouped-mcq__question .ui-radio');
    const hasOptionsControl = document.querySelector('.Control_container__F35yA');
    
    // More precise MCQ detection
    const isMCQ = hasRadioOptions || hasCheckboxOptions || hasOldMcqOptions || 
                  (hasOptionsControl && !monacoEditor);
    
    if (monacoEditor && !isMCQ) {
        // This is definitely a coding question
        const codingData = extractHackerRankCoding();
        
        if (!codingData.instruction || codingData.instruction === "No Instructions Found") {
            chrome.runtime.sendMessage({
                action: 'showToast',
                message: 'No HackerRank coding question found.',
                isError: true
            });
            return;
        }

        // Format the question for AI
        const questionText = `
Language: ${codingData.language}

Title: ${codingData.title}

Instructions:
${codingData.instruction}

${codingData.details}

Starter Code:
-------------
${codingData.starterCode}
        `.trim();

        void 0;

        // Send the extracted data to background.js
        chrome.runtime.sendMessage({
            action: 'extractData',
            programmingLanguage: codingData.language,
            question: questionText,
            inputFormat: codingData.details,
            outputFormat: '',
            testCases: '',
            isHackerRank: true,
            isCoding: true        }, async (response) => {
            void 0;
            
            if (response && response.success && response.response) {
                try {
                    void 0;
                    
                    // Clean the response more thoroughly
                    let cleanedResponse = response.response.trim();
                    void 0;
                    
                    // Remove code block delimiters if present (more comprehensive)
                    cleanedResponse = cleanedResponse
                        .replace(/^```[a-zA-Z]*\s*\n/, '')     // Remove opening ``` with optional language
                        .replace(/\n\s*```\s*$/, '')          // Remove closing ``` with optional whitespace
                        .replace(/^```[a-zA-Z]*\s*/, '')      // Remove opening ``` without newline
                        .replace(/\s*```\s*$/, '');           // Remove closing ``` without newline
                    
                    // Remove any leading/trailing whitespace after code block removal
                    cleanedResponse = cleanedResponse.trim();
                    
                    void 0;
                    
                    // Insert code into Monaco editor with proper formatting
                    void 0;
                    const success = await insertCodeIntoMonacoEditor(cleanedResponse);
                    void 0;
                    
                    if (!success) {
                        // If insertion fails, copy to clipboard as fallback
                        void 0;
                        await navigator.clipboard.writeText(cleanedResponse);
                        chrome.runtime.sendMessage({
                            action: 'showToast',
                            message: 'Copied to clipboard - paste manually',
                            isError: false
                        });
                    } else {
                        void 0;
                        chrome.runtime.sendMessage({
                            action: 'showToast',
                            message: 'Code inserted successfully',
                            isError: false
                        });
                    }
                } catch (error) {
                    void 0;
                    chrome.runtime.sendMessage({
                        action: 'showToast',
                        message: 'Error processing response',
                        isError: true
                    });
                }
            } else {
                void 0;
            }
        });
        
    } else if (isMCQ) {
        // This is an MCQ question
        const extractedData = extractHackerRankMCQ();
        
        if (extractedData.length === 0) {
            chrome.runtime.sendMessage({
                action: 'showToast',
                message: 'No HackerRank MCQ questions found.',
                isError: true
            });
            return;
        }

        // Process the first question
        const firstQuestion = extractedData[0];
        
        if (!firstQuestion.instruction && !firstQuestion.title) {
            chrome.runtime.sendMessage({
                action: 'showToast',
                message: 'No question text found.',
                isError: true
            });
            return;
        }

        if (firstQuestion.options.length === 0) {
            chrome.runtime.sendMessage({
                action: 'showToast',
                message: 'No options found for MCQ question.',
                isError: true
            });
            return;
        }

        // Format the question and options for AI with explicit instructions
        const questionText = firstQuestion.title ? `${firstQuestion.title}\n${firstQuestion.instruction}` : firstQuestion.instruction;
        const optionsText = firstQuestion.options.map((option, index) => 
            `Option ${index + 1}: ${option.text}`
        ).join('\n');

        // Detect if this is a multiple choice question (checkboxes) or single choice (radio buttons)
        const hasCheckboxes = document.querySelector('[role="checkbox"]');
        const isMultipleChoice = hasCheckboxes && !document.querySelector('[role="radio"]');
        
        // Add explicit instruction for multiple choice questions
        let finalQuestionText = questionText;
        if (isMultipleChoice) {
            finalQuestionText = `[MULTIPLE CHOICE QUESTION - SELECT ALL CORRECT OPTIONS]\n\n${questionText}\n\nIMPORTANT: This question allows multiple correct answers. Please respond with ALL correct option numbers separated by commas (e.g., "Options 1, 3, 5" or "1, 3, 5").`;
        } else {
            finalQuestionText = `[SINGLE CHOICE QUESTION - SELECT ONE OPTION]\n\n${questionText}\n\nIMPORTANT: This question allows only ONE correct answer. Please respond with the single correct option number (e.g., "Option 2" or "2").`;
        }
        
        void 0;
        void 0;
        void 0;

        // Send the extracted data to background.js
        chrome.runtime.sendMessage({
            action: 'extractData',
            question: finalQuestionText,  // Use the enhanced question text
            code: null,
            options: optionsText,
            isHackerRank: true,
            isMCQ: true,
            isMultipleChoice: isMultipleChoice  // Add flag for multiple choice questions
        }, (response) => {
            void 0;
        });
    } else {
        chrome.runtime.sendMessage({
            action: 'showToast',
            message: 'No HackerRank question found on this page.',
            isError: true
        });
    }
}

// Add event listener for Ctrl+Shift+H (Mac) or Alt+Shift+H (Windows) for HackerRank MCQ extraction
document.addEventListener('keydown', (event) => {
    // Use Ctrl on Mac, Alt on Windows/other platforms
    const modifierKey = window.isMac ? event.ctrlKey : event.altKey;
    
    if (modifierKey && event.shiftKey && event.code === 'KeyH') {
        handleHackerRankMCQ();
    }
});


// ============================================================
// TCS NQT iON Portal Support
// Alt+Shift+Q â†’ MCQ/aptitude (auto-select or stealth answer)
// Alt+Shift+C â†’ Coding (human-written code to clipboard)
// ============================================================

// Extract MCQ question and options with multi-fallback selectors
function extractTCSiONMCQ() {
    let question = '';
    let options = [];
    let code = null;

    // ============================================================
    // QUESTION EXTRACTION â€” 6 strategies
    // ============================================================

    // S1: Examly/iamneo aria-labelledby
    const qEl = document.querySelector('div[aria-labelledby="question-data"]');
    if (qEl) question = htmlToText(qEl);

    // S2: Common question class selectors
    if (!question) {
        const genericSelectors = [
            '.question-area', '.question-text', '.question_container', '.question_text',
            '.ques-desc', '.ques-text', '.ques_desc', '.ques_text',
            '.question-content', '.qtext', '.question-body', '.question-statement',
            '[class*="question"][class*="text"]', '[class*="question"][class*="desc"]',
            '[class*="question"][class*="content"]', '[class*="question"][class*="body"]',
            '[id*="question"]', '[id*="ques"]'
        ];
        for (const sel of genericSelectors) {
            const el = document.querySelector(sel);
            if (el && el.innerText.trim().length > 10) {
                question = el.innerText.trim();
                break;
            }
        }
    }

    // S3: Walk up from first radio to find question container
    if (!question) {
        const firstRadio = document.querySelector('input[type="radio"], [role="radio"]');
        if (firstRadio) {
            let parent = firstRadio.closest(
                '[class*="question"], [class*="item"], [class*="block"], [class*="container"], [class*="panel"]'
            );
            if (parent) {
                const allText = parent.innerText.trim();
                const firstOptionText = firstRadio.closest('label, [class*="option"]');
                if (firstOptionText) {
                    const idx = allText.indexOf(firstOptionText.innerText.trim());
                    if (idx > 0) question = allText.substring(0, idx).trim();
                } else {
                    question = allText.split('\n')[0].trim();
                }
            }
        }
    }

    // S4: Left/main panel scan (split-layout portals like SKCET)
    if (!question) {
        const leftPanelSels = [
            '[class*="left"]', '[class*="main-content"]', '[class*="question-panel"]',
            '[class*="test-panel"]', 'main', 'article',
            '[class*="col-"]:first-child', '.panel:first-child'
        ];
        for (const sel of leftPanelSels) {
            const el = document.querySelector(sel);
            if (el) {
                const text = el.innerText.trim();
                if (text.length > 20 && text.length < 3000) {
                    // Strip common header noise ("Question No", "Answered", etc.)
                    const lines = text.split('\n')
                        .map(l => l.trim())
                        .filter(l => l.length > 0
                            && !/^question no/i.test(l)
                            && !/^answered/i.test(l)
                            && !/^bookmarked/i.test(l)
                            && !/^skipped/i.test(l)
                            && !/^not viewed/i.test(l)
                            && !/^saved/i.test(l)
                            && l.length < 500);
                    if (lines.length > 0) {
                        question = lines.join(' ').trim();
                        break;
                    }
                }
            }
        }
    }

    // S5: Biggest text paragraph near radio buttons
    if (!question) {
        const paras = document.querySelectorAll('p, div');
        let best = { el: null, len: 0 };
        paras.forEach(p => {
            const t = p.innerText.trim();
            if (t.length > 20 && t.length < 1000 && t.length > best.len) {
                // Only pick elements close to radio buttons
                const nearRadio = p.closest('form') || p.parentElement?.querySelector('input[type="radio"]');
                if (nearRadio || p.closest('[class*="test"], [class*="exam"], [class*="quiz"]')) {
                    best = { el: p, len: t.length };
                }
            }
        });
        if (best.el) question = best.el.innerText.trim();
    }

    // S6: Full page scan â€” last resort, grab first meaningful paragraph
    if (!question) {
        const allPs = document.querySelectorAll('p, h3, h4');
        for (const p of allPs) {
            const t = p.innerText.trim();
            if (t.length > 20 && t.length < 800) {
                question = t;
                break;
            }
        }
    }

    // ============================================================
    // OPTIONS EXTRACTION â€” 6 strategies
    // ============================================================

    // S1: Examly aria-labelledby each-option
    const ariaOptions = document.querySelectorAll('div[aria-labelledby="each-option"]');
    if (ariaOptions.length > 0) {
        ariaOptions.forEach((opt, idx) => {
            options.push(`Option ${idx + 1}: ${htmlToText(opt)}`);
        });
    }

    // S2: Labels linked to radio via for= attribute (split-panel portals like SKCET)
    if (options.length === 0) {
        const radios = document.querySelectorAll('input[type="radio"]');
        if (radios.length >= 2) {
            radios.forEach((radio, idx) => {
                // Try for= linked label first, then wrapping label, then sibling text
                let text = '';
                if (radio.id) {
                    const linked = document.querySelector(`label[for="${radio.id}"]`);
                    if (linked) text = linked.innerText.trim();
                }
                if (!text) {
                    const wrap = radio.closest('label');
                    if (wrap) text = wrap.innerText.replace(/\s+/g, ' ').trim();
                }
                if (!text) {
                    // Try next sibling text node or span
                    const sib = radio.nextElementSibling;
                    if (sib) text = sib.innerText.trim();
                }
                if (!text) text = radio.value || radio.getAttribute('data-value') || `${idx + 1}`;
                if (text) options.push(`Option ${idx + 1}: ${text}`);
            });
        }
    }

    // S3: Answer/option panel containers (right panel portals)
    if (options.length === 0) {
        const panelSels = [
            '[class*="answer"]', '[id*="answer"]',
            '[class*="option"]', '[id*="option"]',
            '[class*="choice"]', '[id*="choice"]',
            '[class*="right"]', '[class*="answers-panel"]'
        ];
        for (const sel of panelSels) {
            const panel = document.querySelector(sel);
            if (panel) {
                const radios = panel.querySelectorAll('input[type="radio"]');
                if (radios.length >= 2) {
                    radios.forEach((radio, idx) => {
                        const label = document.querySelector(`label[for="${radio.id}"]`)
                            || radio.closest('label')
                            || radio.parentElement;
                        const text = label ? label.innerText.replace(/\s+/g, ' ').trim() : (radio.value || `${idx + 1}`);
                        if (text) options.push(`Option ${idx + 1}: ${text}`);
                    });
                    break;
                }
            }
        }
    }

    // S4: li-based option lists
    if (options.length === 0) {
        const lists = document.querySelectorAll('ol, ul');
        for (const list of lists) {
            const items = list.querySelectorAll('li');
            if (items.length >= 2 && items.length <= 8) {
                const hasInput = list.querySelector('input[type="radio"], input[type="checkbox"], [role="radio"]');
                if (hasInput) {
                    items.forEach((li, idx) => {
                        const text = li.innerText.trim();
                        if (text) options.push(`Option ${idx + 1}: ${text}`);
                    });
                    break;
                }
            }
        }
    }

    // S5: role="radio" elements
    if (options.length === 0) {
        const roleRadios = document.querySelectorAll('[role="radio"]');
        if (roleRadios.length >= 2) {
            roleRadios.forEach((el, idx) => {
                const text = el.innerText.trim() || el.getAttribute('aria-label') || '';
                if (text) options.push(`Option ${idx + 1}: ${text}`);
            });
        }
    }

    // S6: All labels on page associated with radio inputs (broadest scan)
    if (options.length === 0) {
        const allLabels = Array.from(document.querySelectorAll('label'))
            .filter(label => {
                const hasRadio = label.querySelector('input[type="radio"]')
                    || (label.htmlFor && document.getElementById(label.htmlFor)?.type === 'radio');
                const text = label.innerText.trim();
                return hasRadio && text.length > 0 && text.length < 300;
            });
        if (allLabels.length >= 2) {
            allLabels.forEach((label, idx) => {
                options.push(`Option ${idx + 1}: ${label.innerText.trim()}`);
            });
        }
    }

    // --- Code snippet extraction ---
    const codeLines = document.querySelectorAll('.ace_layer.ace_text-layer .ace_line');
    if (codeLines.length > 0) {
        code = Array.from(codeLines).map(l => l.innerText.trim()).join('\n');
    }
    if (!code) {
        const preTags = document.querySelectorAll('pre code, pre.code, .code-block');
        if (preTags.length > 0) code = preTags[0].innerText.trim();
    }

    void 0;

    // Return even with partial data â€” let AI handle incomplete questions
    if (!question && options.length === 0) return null;
    return { question: question || '(Image-based question â€” see options)', code, options: options.join('\n') };
}

// Extract coding question with multi-fallback selectors
function extractTCSiONCoding() {
    let question = '';
    let language = '';
    let inputFormat = '';
    let outputFormat = '';
    let testCasesText = '';
    let headerSnippet = '';
    let footerSnippet = '';
    let whitelist = '';

    // --- Language ---
    const langEl = document.querySelector('span.inner-text');
    if (langEl) {
        language = langEl.innerText.trim();
    }
    if (!language) {
        const selectEls = document.querySelectorAll('select, [class*="language"] span, [class*="lang-select"]');
        for (const el of selectEls) {
            const t = el.innerText || el.value || '';
            if (/^(c|c\+\+|java|python|perl|javascript|go|ruby)/i.test(t.trim())) {
                language = t.trim();
                break;
            }
        }
    }

    // --- Question ---
    const qEl = document.querySelector('div[aria-labelledby="question-data"]');
    if (qEl) question = htmlToText(qEl);
    if (!question) {
        const fallbacks = ['.question-area', '.question-text', '.question_container', '.ques-desc',
            '[class*="question"][class*="text"]', '[class*="question"][class*="content"]',
            '[class*="problem"][class*="statement"]'];
        for (const sel of fallbacks) {
            const el = document.querySelector(sel);
            if (el && el.innerText.trim().length > 20) {
                question = el.innerText.trim();
                break;
            }
        }
    }

    // --- Input / Output format ---
    const ifEl = document.querySelector('div[aria-labelledby="input-format"]');
    if (ifEl) inputFormat = htmlToText(ifEl);
    const ofEl = document.querySelector('div[aria-labelledby="output-format"]');
    if (ofEl) outputFormat = htmlToText(ofEl);

    // --- Test cases (reuse existing 3-method approach) ---
    const testCases = [];
    let containers = document.querySelectorAll('div[aria-labelledby="each-tc-card"]');
    if (containers.length > 0) {
        containers.forEach(c => {
            const inp = c.querySelector('div[aria-labelledby="each-tc-input-container"] pre');
            const out = c.querySelector('div[aria-labelledby="each-tc-output-container"] pre');
            if (inp && out) testCases.push({ input: inp.textContent.trim(), output: out.textContent.trim() });
        });
    }
    if (testCases.length === 0) {
        containers = document.querySelectorAll('[aria-labelledby="each-tc-container"]');
        containers.forEach(c => {
            const inp = c.querySelector('[aria-labelledby="each-tc-input"]');
            const out = c.querySelector('[aria-labelledby="each-tc-output"]');
            if (inp && out) testCases.push({ input: inp.textContent.trim(), output: out.textContent.trim() });
        });
    }
    if (testCases.length === 0) {
        const allPres = document.querySelectorAll('pre');
        const inputs = [], outputs = [];
        allPres.forEach(pre => {
            const prev = pre.previousElementSibling;
            if (prev) {
                const lbl = prev.textContent.toLowerCase();
                if (lbl.includes('input') && !lbl.includes('output')) inputs.push(pre.textContent.trim());
                else if (lbl.includes('output')) outputs.push(pre.textContent.trim());
            }
        });
        for (let i = 0; i < Math.min(inputs.length, outputs.length); i++) {
            testCases.push({ input: inputs[i], output: outputs[i] });
        }
    }
    if (testCases.length > 0) {
        testCases.forEach((tc, idx) => {
            testCasesText += `Sample Test Case ${idx + 1}:\nInput:\n${tc.input}\nOutput:\n${tc.output}\n\n`;
        });
    }

    // --- Header / Footer snippets ---
    const headerEditorEl = document.querySelector('[aria-labelledby="editor-question"][id*="ttHeaderEditor"]');
    const footerEditorEl = document.querySelector('[aria-labelledby="editor-question"][id*="ttFooterEditor"]');
    if (headerEditorEl) {
        headerSnippet = Array.from(headerEditorEl.querySelectorAll('.ace_line')).map(l => l.textContent).join('\n').trim();
    }
    if (footerEditorEl) {
        footerSnippet = Array.from(footerEditorEl.querySelectorAll('.ace_line')).map(l => l.textContent).join('\n').trim();
    }

    // --- Whitelist ---
    const instrCards = document.querySelectorAll('div[aria-labelledby="instruction-card"]');
    instrCards.forEach(card => {
        const hdr = card.querySelector('[aria-labelledby="instruction-header"]');
        if (hdr && hdr.textContent.trim().toLowerCase().includes('whitelist')) {
            const sets = card.querySelectorAll('[aria-labelledby="list"]');
            sets.forEach(set => {
                const vals = Array.from(set.querySelectorAll('[aria-labelledby="list-value-card"]')).map(v => v.textContent.trim()).filter(Boolean);
                if (vals.length > 0) {
                    const setHdr = set.querySelector('[aria-labelledby="set-header"]');
                    whitelist += (setHdr ? setHdr.textContent.trim() + ' ' : '') + vals.join(', ') + '\n';
                }
            });
        }
    });
    whitelist = whitelist.trim();

    if (!question) return null;
    return { question, language, inputFormat, outputFormat, testCasesText, headerSnippet, footerSnippet, whitelist };
}

// Main TCS iON handler â€” routes MCQ vs coding
function handleTCSiON(mode) {
    if (mode === 'coding') {
        const data = extractTCSiONCoding();
        if (!data || !data.question) {
            chrome.runtime.sendMessage({ action: 'showToast', message: 'No coding question found.', isError: true });
            return;
        }
        void 0;
        chrome.runtime.sendMessage({
            action: 'extractData',
            programmingLanguage: data.language,
            question: data.question,
            inputFormat: data.inputFormat,
            outputFormat: data.outputFormat,
            testCases: data.testCasesText,
            headerSnippet: data.headerSnippet,
            footerSnippet: data.footerSnippet,
            whitelist: data.whitelist,
            isCoding: true,
            isTCSiON: true
        });
        return;
    }

    // MCQ mode â€” auto-detect MCQ vs coding
    const hasCodingEditor = document.querySelector(
        'div[aria-labelledby="input-format"], .ace_editor, .monaco-editor, .CodeMirror'
    );
    // Broad check â€” includes plain radio buttons (works for SKCET and other portals)
    const hasOptions = document.querySelector(
        'div[aria-labelledby="each-option"], input[type="radio"], [role="radio"], input[type="checkbox"]'
    );

    if (hasOptions) {
        const data = extractTCSiONMCQ();
        if (!data) {
            const radios = document.querySelectorAll('input[type=\"radio\"]').length;
            chrome.runtime.sendMessage({
                action: 'showToast',
                message: `No question detected. Found ${radios} radio buttons. Open F12 console for log.`,
                isError: true
            });
            void 0;
            return;
        }

        void 0;

        // â”€â”€ IMAGE-BASED QUESTION DETECTION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        // If the question area has <img> tags OR all options are single digit numbers
        // (e.g. "1","2","3","4" referring to figure positions), text AI can't answer it.
        // Escalate to vision/screenshot mode instead.
        const questionHasImages = !!document.querySelector(
            'div[aria-labelledby="question-data"] img, .question-area img, [class*="question"] img'
        );
        const optionValues = (data.options || '').split('\n')
            .map(line => line.replace(/^Option \d+:\s*/, '').trim());
        const allOptionsAreDigits = optionValues.length >= 2
            && optionValues.every(v => /^\d$/.test(v));  // e.g. "1", "2", "3", "4"

        if (questionHasImages || allOptionsAreDigits) {
            void 0;
            chrome.runtime.sendMessage({
                action: 'captureScreenForMCQ',
                questionText: data.question,
                optionsText: data.options
            });
            return;
        }
        // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

        chrome.runtime.sendMessage({
            action: 'extractData',
            question: data.question,
            code: data.code,
            options: data.options,
            isMCQ: true,
            isTCSiON: true
        });
    } else if (hasCodingEditor) {
        handleTCSiON('coding');
    } else {
        const radios = document.querySelectorAll('input[type="radio"]').length;
        chrome.runtime.sendMessage({
            action: 'showToast',
            message: `No question detected on this page. (${radios} radio inputs found)`,
            isError: true
        });
    }
}

// Alt+Shift+Q â†’ MCQ / aptitude questions
document.addEventListener('keydown', (event) => {
    if (event.altKey && event.shiftKey && event.code === 'KeyQ') {
        event.preventDefault();
        event.stopPropagation();
        handleTCSiON('mcq');
    }
});

// Alt+Shift+C â†’ Coding questions (standard mode)
document.addEventListener('keydown', (event) => {
    if (event.altKey && event.shiftKey && event.code === 'KeyC') {
        event.preventDefault();
        event.stopPropagation();
        handleTCSiON('coding');
    }
});

// Alt+Shift+X â†’ Expert Coding Mode (2-pass: edge case analysis â†’ final code)
// Use this for complex/hard problems that need to handle tricky edge cases
document.addEventListener('keydown', (event) => {
    if (event.altKey && event.shiftKey && event.code === 'KeyX') {
        event.preventDefault();
        event.stopPropagation();

        const data = extractTCSiONCoding();
        if (!data || !data.question) {
            chrome.runtime.sendMessage({
                action: 'showToast',
                message: 'No coding question found for Expert Mode.',
                isError: true
            });
            return;
        }

        void 0;

        chrome.runtime.sendMessage({
            action: 'extractData',
            programmingLanguage: data.language,
            question: data.question,
            inputFormat: data.inputFormat,
            outputFormat: data.outputFormat,
            testCases: data.testCasesText,
            headerSnippet: data.headerSnippet,
            footerSnippet: data.footerSnippet,
            whitelist: data.whitelist,
            isCoding: true,         // still treated as coding for response handling
            isCodingExpert: true,   // triggers 2-pass chain-of-thought in worker.js
            isTCSiON: true
        });
    }
});

