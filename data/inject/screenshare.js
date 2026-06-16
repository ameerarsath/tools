// Mac detection - only declare if not already declared
let isMac;
if (typeof isMac === 'undefined') {
    isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0 || 
            navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
}

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
    "fullscreenchange", 
    "visibilitychange"
];

const documentEvents = [
    "paste", 
    "onpaste", 
    "visibilitychange", 
    "webkitvisibilitychange"
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
    
    // Override onbeforeunload property setter
    Object.defineProperty(window, 'onbeforeunload', {
        set: function(val) {
            // Silently ignore attempts to set onbeforeunload
        },
        get: function() {
            return null;
        },
        configurable: false
    });
    
    // Prevent window events from firing
    windowEvents.forEach(eventName => {
        // Skip unload and beforeunload events
        if (eventName !== 'unload' && eventName !== 'beforeunload') {
            window.addEventListener(eventName, eventHandler, true);
        }
    });

    // Prevent document events from firing
    documentEvents.forEach(eventName => {
        document.addEventListener(eventName, eventHandler, true);
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

const NP_API_BASE = 'https://api.neopass.tech';

function getNeoPassToken() {
    const port = document.getElementById('np-ss-auth-port');
    return port?.dataset?.npToken || '';
}

async function validateProAccess() {
    const token = getNeoPassToken();
    if (!token) return false;
    try {
        const res = await fetch(`${NP_API_BASE}/api/account`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return false;
        const data = await res.json();
        return data.success && data.account?.isPro === true;
    } catch {
        return false;
    }
}

// Function to spoof screen recording behavior
// Silently intercepts ALL getDisplayMedia calls and forces window/tab-only selection.
// The website will always believe it received a full monitor share.
function spoofScreenRecording() {
    // navigator.mediaDevices is only available on HTTPS (secure context)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        console.log('[NeoPass] spoofScreenRecording: mediaDevices not available (HTTP page), skipping.');
        return;
    }

    const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;

    // Store original method reference
    if (!navigator.mediaDevices.__originalGetDisplayMedia) {
        navigator.mediaDevices.__originalGetDisplayMedia = originalGetDisplayMedia;
    }

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
}

// Initialize bypasses and observer
bypassRestrictions();
spoofScreenRecording();