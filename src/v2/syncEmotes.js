let startTime = null;
const animations = new Set();
const TIMEOUT_LIMIT = 5000; // Maximum wait time in milliseconds
const POLL_INTERVAL = 100; // Poll interval in milliseconds

function setupAnimation(img) {
    img.style.visibility = "hidden";

    const onLoad = () => {
        img.removeEventListener("load", onLoad);
        img.decode().then(() => {
            animations.add(img);
            img.style.visibility = "visible";
            synchronizeAnimations();
        });
    };

    img.addEventListener("load", onLoad);
}

let lastCall = 0;
const limit = 500; // ms

function synchronizeAnimations() {
    const now = Date.now();
    if (now - lastCall < limit) {
        return;
    }
    lastCall = now;
    animations.forEach((img) => {
        const src = img.src;
        img.src = ""; // Force reload
        img.src = src;
    });
}

function startObservingChatContainer() {
    const chatContainer = document.getElementById("chat_container");
    if (chatContainer) {
        const emoteObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === "childList") {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === 1 && node.classList.contains("chat_line")) {
                            node.querySelectorAll(".emote").forEach((img) => {
                                setupAnimation(img);
                            });
                        }
                    }
                }
            }
        });

        emoteObserver.observe(chatContainer, {
            childList: true,
            subtree: true,
        });
    } else {
        console.error('Element with id "chat_container" not found.');
    }
}

function waitForChatContainer(
    timeout = TIMEOUT_LIMIT,
    interval = POLL_INTERVAL
) {
    const start = Date.now();

    const poll = () => {
        const chatContainer = document.getElementById("chat_container");
        if (chatContainer) {
            startObservingChatContainer();
        } else if (Date.now() - start < timeout) {
            setTimeout(poll, interval);
        } else {
            console.error(
                'Element with id "chat_container" not found within the timeout period.'
            );
        }
    };

    poll();
}

window.addEventListener("load", () => {
    if (!Chat.info.disableSync) {
        waitForChatContainer();

        // Set startTime for animations
        startTime = performance.now();
        synchronizeAnimations();
    }
});
