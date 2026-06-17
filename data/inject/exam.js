// Use shared isMac variable if it exists, otherwise declare it
if (typeof window.isMac === 'undefined') {
    window.isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0 || 
                   navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
}

// Auto-answering mechanism
(function () {
  let editor;
  let codeLines = [];

  // Find the answer Ace editor on the page (only the editable answer editor)
  function findAnswerEditor() {
    // First try to find the specific answer editor by aria-labelledby
    const answerEl = document.querySelector('[aria-labelledby="editor-answer"]');
    if (answerEl) {
      try {
        return ace.edit(answerEl);
      } catch(e) {}
    }
    // Fallback: find first non-readonly ACE editor
    const editors = document.querySelectorAll('.ace_editor');
    for (const el of editors) {
      try {
        const ed = ace.edit(el);
        if (!ed.getReadOnly()) return ed;
      } catch(e) {}
    }
    return null;
  }
  let charIndex = 0;
  let lineIndex = 0;
  let currentCode = ""; // Store the current question's complete code
  let isTyping = false; // Flag to track if currently typing
  let typingInitialized = false; // Flag to track if Cmd+Shift+T was pressed first
  let lastQuestionNumber = null; // Track the last question number to detect changes

  // Function to detect question changes and reset typing state
  function checkForQuestionChange() {
    const questionElement = document.querySelector("#content-left > content-left > div > div.t-h-full > testtaking-question > div > div.t-flex.t-items-center.t-justify-between.t-whitespace-nowrap.t-px-10.t-py-8.lg\\:t-py-8.lg\\:t-px-20.t-bg-primary\\/\\[0\\.1\\].t-border-b.t-border-solid.t-border-b-neutral-2.t-min-h-\\[30px\\].lg\\:t-min-h-\\[35px\\].ng-star-inserted > div:nth-child(1) > div > div");
    
    if (questionElement) {
      const questionText = questionElement.textContent;
      const match = questionText.match(/Question No : (\d+) \/ \d+/);
      const currentQuestionNumber = match ? match[1] : null;
      
      // If question changed, reset typing state
      if (currentQuestionNumber && currentQuestionNumber !== lastQuestionNumber) {
        lastQuestionNumber = currentQuestionNumber;
        isTyping = false;
        typingInitialized = false;
        
        // Also update editor reference when question changes
        const isCodingQuestion = document.querySelector("#programme-compile");
        if (isCodingQuestion) {
          const found = findAnswerEditor();
          if (found) editor = found;
        }
      }
    }
  }

  // Check for question changes periodically
  setInterval(checkForQuestionChange, 500);
  
  // Function to type the next character
  // Type one line at a time (not char-by-char) to avoid O(n²) setValue lag
  function typeNextCharacter() {
    if (lineIndex < codeLines.length) {
      const currentLine = codeLines[lineIndex];
      const currentContent = editor.getValue();
      const newContent = currentContent + (lineIndex > 0 ? '\n' : '') + currentLine;
      editor.setValue(newContent);
      editor.clearSelection();
      editor.navigateFileEnd();
      lineIndex++;
      // Auto-advance with a human-like delay
      if (isTyping) {
        setTimeout(typeNextCharacter, 60 + Math.random() * 90);
      }
    } else {
      isTyping = false;
      typingInitialized = false;
    }
  }

  // Event listener for keyboard shortcuts
  document.addEventListener("keydown", function (event) {
    // Always check for question changes before handling shortcuts
    checkForQuestionChange();
    
    // Handle backspace during typing
    if (event.key === "Backspace" && isTyping) {
      event.preventDefault(); // Optional: prevent default backspace behavior to just stop typing
      void 0;
      // Stop typing action
      isTyping = false;
      typingInitialized = false;
      return;
    }

  // Ctrl + Shift + T on macOS, Alt + Shift + T on others
  const primaryModifierT = (window.isMac ? event.ctrlKey : event.altKey);
  if (primaryModifierT && event.shiftKey && event.code === "KeyT") {
      event.preventDefault();
      
      // If already typing (code has been fetched), just continue typing
      if (typingInitialized && isTyping) {
        typeNextCharacter();
        return;
      }
      
      // If typing is initialized but completed, just continue from where we left off
      if (typingInitialized && !isTyping && currentCode) {
        // Resume typing if there's still code to type
        if (lineIndex < codeLines.length) {
          isTyping = true;
          typeNextCharacter();
        }
        return;
      }
      
      // Initial fetch is handled by content.js â†’ worker.js â†’ chrome.scripting.executeScript
      // which calls window._ist(code) directly.
      return;
    }

    // Handle typing with just plain 'T' key after initialization (alternative method)
    const activeTag = document.activeElement?.tagName;
    if (event.key.toLowerCase() === "t" && typingInitialized && !event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey && activeTag !== 'INPUT' && activeTag !== 'TEXTAREA' && activeTag !== 'SELECT') {
      if (isTyping) {
        event.preventDefault();
        typeNextCharacter();
      }
      return;
    }
  });

  // Exposed for content.js to call via inline script injection (page context)
  window._ist = function(codeToType) {
    if (!codeToType) return;
    void 0;
    const found = findAnswerEditor();
    if (found) {
      try {
        editor = found;
        currentCode = codeToType;
        editor.setValue("");
        editor.clearSelection();
        codeLines = currentCode.split("\n");
        charIndex = 0;
        lineIndex = 0;
        isTyping = true;
        typingInitialized = true;
        typeNextCharacter();
        void 0;
      } catch (error) {
        void 0;
      }
    } else {
      void 0;
    }
  };
})();
