const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0 || navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;

// Lists of events to intercept
const windowEvents = [
    "blur", 
    "focus", 
    "beforeunload", 
    "pagehide", 
    "unload", 
    "popstate", 
    "resize", 
    "pagehide", 
    'lostpointercapture', 
    "fullscreenchange"
];

const documentEvents = [
    "paste", 
    "onpaste"
];

// Store original property descriptors for restoration
const originalVisibilityState = Object.getOwnPropertyDescriptor(document, 'visibilityState');
const originalWebkitVisibilityState = Object.getOwnPropertyDescriptor(document, "webkitVisibilityState");
const originalHidden = Object.getOwnPropertyDescriptor(document, "hidden");

// Event handler to prevent default behavior
const eventHandler = (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
};

// Main function to bypass browser restrictions
function bypassRestrictions() {
    // Aggressively block beforeunload popup
    const blockBeforeUnload = (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
        delete e['returnValue'];
    };
    
    // Add our handler with highest priority (capture phase)
    window.addEventListener('beforeunload', blockBeforeUnload, true);
    
    // Override addEventListener to block beforeunload handlers
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (type === 'beforeunload') {
            return; // Completely ignore beforeunload listeners
        }
        return originalAddEventListener.call(this, type, listener, options);
    };
    Object.defineProperty(EventTarget.prototype.addEventListener, 'toString', {
      value: () => 'function addEventListener() { [native code] }',
      writable: false, configurable: false
    });
    
    // Override onbeforeunload property setter
    Object.defineProperty(window, 'onbeforeunload', {
        set: function(val) {
            // Silently ignore attempts to set onbeforeunload
        },
        get: function() {
            return null;
        },
        configurable: true
    });
    
    // Prevent window events from firing
    windowEvents.forEach(eventName => {
        // Skip unload and beforeunload events
        if (eventName !== 'unload' && eventName !== 'beforeunload') {
            window.addEventListener(eventName, eventHandler, true);
        }
    });

    // Safe property override — handles iframes and pages where property is already non-configurable
    function safeProp(obj, prop, descriptor) {
        try {
            const existing = Object.getOwnPropertyDescriptor(obj, prop);
            // Only redefine if not yet set OR if it's configurable
            if (!existing || existing.configurable) {
                Object.defineProperty(obj, prop, descriptor);
                return;
            }
        } catch (e) { /* ignore */ }

        // Fallback: try on Document.prototype instead of the instance
        try {
            const proto = Object.getOwnPropertyDescriptor(Document.prototype, prop);
            if (!proto || proto.configurable) {
                Object.defineProperty(Document.prototype, prop, descriptor);
            }
        } catch (e) { /* silently ignore — can't override in this context */ }
    }

    // Override visibility state properties (prevent tab-switch detection)
    safeProp(document, 'visibilityState',       { get: () => 'visible', configurable: true });
    safeProp(document, 'webkitVisibilityState', { get: () => 'visible', configurable: true });
    safeProp(document, 'hidden',                { get: () => false,     configurable: true });
}

// Function to spoof screen recording behavior
// Silently intercepts ALL getDisplayMedia calls and forces window/tab-only selection.
// The website will always believe it received a full monitor share.
function spoofScreenRecording() {
    // navigator.mediaDevices is only available on HTTPS (secure context)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        return;
    }

    const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;

    navigator.mediaDevices.getDisplayMedia = async function(constraints) {
        // Build spoofed constraints that force window/tab only (no entire screen)
        let spoofedConstraints;

        if (isMac) {
            spoofedConstraints = {
                video: {
                    displaySurface: "browser",
                    logicalSurface: true,
                    cursor: "always"
                },
                audio: false,
                selfBrowserSurface: "include",
                surfaceSwitching: "include",
                systemAudio: "exclude"
            };
        } else {
            spoofedConstraints = {
                selfBrowserSurface: "include",
                monitorTypeSurfaces: "exclude",
                video: { displaySurface: "window" }
            };
        }

        // Call the real getDisplayMedia with our spoofed constraints
        const stream = await originalGetDisplayMedia.call(navigator.mediaDevices, spoofedConstraints);

        // Spoof the video track so the website thinks it got a monitor share
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
            const originalGetSettings = videoTrack.getSettings.bind(videoTrack);
            videoTrack.getSettings = function() {
                const settings = originalGetSettings();
                settings.displaySurface = 'monitor';
                return settings;
            };
            Object.defineProperty(videoTrack.getSettings, 'toString', {
              value: () => 'function getSettings() { [native code] }',
              writable: false, configurable: false
            });

            // Also spoof the label to look like a screen share
            try {
                Object.defineProperty(videoTrack, 'label', {
                    get: () => 'screen:0:0',
                    configurable: true
                });
            } catch (e) {
                // Some browsers may not allow redefining label, that's ok
            }
        }

        return stream;
    };
    Object.defineProperty(navigator.mediaDevices.getDisplayMedia, 'toString', {
      value: () => 'function getDisplayMedia() { [native code] }',
      writable: false, configurable: false
    });
}

// Override hasFocus in MAIN world
Document.prototype.hasFocus = function() { return true; };
Object.defineProperty(Document.prototype.hasFocus, 'toString', {
  value: () => 'function hasFocus() { [native code] }',
  writable: false, configurable: false
});

// Initialize bypasses and observer
bypassRestrictions();
spoofScreenRecording();