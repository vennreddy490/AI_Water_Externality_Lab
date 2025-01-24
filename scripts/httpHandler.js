// Variable to store the timestamp of the last request
let previousTimeStamp = 0;

// Variable to store the URL of the current conversation
let conversationURL;

// Utility function to create a delay
const delay = (delayTime) => new Promise((resolve, reject) => setTimeout(() => resolve(), delayTime));

// Listener for messages sent from content scripts
chrome.runtime.onMessage.addListener(
    async (request, sender, sendResponse) => {
        // Wait for 1 second before proceeding
        await delay(1000);

        // Connect to the tab that sent the message
        var port = chrome.tabs.connect(sender.tab.id);

        // Listener to track when a conversation request completes
        chrome.webRequest.onCompleted.addListener(
            async (e) => {
                // Check if the URL has changed and avoid duplicate triggers
                if (conversationURL != e.url) {
                    if (e.statusCode < 400 && Math.abs(previousTimeStamp - e.timeStamp) > 1000) {
                        console.log(e);
                        // Notify content script of an existing conversation
                        await port.postMessage({ existingConvo: true });
                    }

                    // Update the stored conversation URL and timestamp
                    conversationURL = e.url;
                    previousTimeStamp = e.timeStamp;
                }
            }, 
            { urls: ["https://chatgpt.com/backend-api/conversation/*-*-*"] } // Target specific API endpoints
        );

        // Listener to detect the initialization of a new conversation
        chrome.webRequest.onCompleted.addListener(
            async (e) => {
                if (e.statusCode < 400 && Math.abs(previousTimeStamp - e.timeStamp) > 1000) {
                    console.log(e);
                    // Notify content script of a new conversation
                    await port.postMessage({ newConvo: true });
                }

                // Update the timestamp of the last request
                previousTimeStamp = e.timeStamp;
            }, 
            { urls: ["https://chatgpt.com/backend-api/conversation/init"] } // Specific API endpoint for new conversations
        );
        
        // Listener to detect when headers are sent for a prompt
        chrome.webRequest.onSendHeaders.addListener(
            async (e) => {
                // Notify content script that a prompt has been sent
                await port.postMessage({ sentPrompt: true });
            }, 
            { urls: ["https://chatgpt.com/backend-api/*/r"] } // Target API endpoint for sending prompts
        );
        
        // Listener to detect when a prompt response is completed
        chrome.webRequest.onCompleted.addListener(
            async (e) => {
                if (e.statusCode < 400) {
                    // Notify content script that the prompt response is complete
                    await port.postMessage({ promptComplete: true });

                    // Update the timestamp of the last request
                    previousTimeStamp = e.timeStamp;
                }
            }, 
            { urls: ["https://chatgpt.com/backend-api/*/r"] } // Target API endpoint for prompt responses
        );
    }
);
