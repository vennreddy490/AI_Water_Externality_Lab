/* Configuration for GIF display */
const GIF_DISPLAY_TIME = 3.5; // Time in seconds to display the GIF
const IMAGE_URL = 'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExN2x1YjV4b2R6dWVua2Y5OHFpZDFjNnFyc2xueXRvMDF6c3RtbTY5NCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/MagjwsUK2vunGimNXT/giphy.gif'; // URL for the GIF

/* Date and time formatter for logs */
const TIME_CONVERTER = new Intl.DateTimeFormat('en-US', {
    timeZone: "America/New_York",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric"
});

// Variables for tracking time, username, logs, and conversation data
let time;
let logFile;
let username;
let container;
let conversation;

let body;
let div;
let img;

// Utility to create delays
const PAUSE_SCRIPT = (delayTime) => new Promise((resolve, reject) => setTimeout(() => resolve(), delayTime));

// Event listener for the window load event
window.addEventListener('load', async (e) => {
    // Notify the background script that the page has loaded
    await chrome.runtime.sendMessage({});

    // Initialize the extension functionality
    await START_FUNC(window.document.URL);
});

// Listener for messages from the background script
chrome.runtime.onConnect.addListener(
    (port) => {
        port.onMessage.addListener(
            async (msg) => {
                if (msg.sentPrompt) {
                    // Log the timestamp and username when a prompt is sent
                    time = new Date();
                    container.style.display = 'inline';
                
                    setTimeout(() => {
                        container.style.display = 'none';
                    }, GIF_DISPLAY_TIME * 1000);

                    logFile += '\n\n\n' + TIME_CONVERTER.format(time) + '\n\nUsername: ' + username;
                } else if (msg.promptComplete) {
                    // Wait for a brief delay before logging the conversation
                    await PAUSE_SCRIPT(300);

                    conversation = document.querySelectorAll(MESSAGE_ROLE_SELECTOR);
                
                    let prompt = conversation[conversation.length - 2].innerText;
                    let newMessage = conversation[conversation.length - 1].innerText;
                
                    logFile += '\n\nUser Query: \n' + prompt + '\n\nChatGPT Response: \n' + newMessage; + '\n\n';
                
                    console.log(logFile);
                } else if (msg.newConvo || msg.existingConvo) {
                    // Reinitialize the extension for new or existing conversations
                    await START_FUNC(window.document.URL);
                }
            }
        );
    }
);

// Function to initialize the extension on the current page
const START_FUNC = async (pageURL) => {
    body = document.querySelector('body');
    div = document.createElement('div');
    img = document.createElement('img');

    conversation = null;

    logFile = ``;
    time = new Date();

    // Retrieve the username element and wait until it's available
    username = document.querySelector(`[data-testid='accounts-profile-button']`);
    if (username == null) {
        while (username == null) {
            await PAUSE_SCRIPT(500);
            username = document.querySelector(`[data-testid='accounts-profile-button']`);
        }
    }

    // Extract and log the username
    username = username.innerText;
    logFile += TIME_CONVERTER.format(time) + '\n\nUsername: ' + username + '\n\n';

    await PAUSE_SCRIPT(500);

    // Check for existing conversations and log their content
    if (pageURL.includes('/c/')) {
        while (conversation == null) {
            conversation = document.querySelectorAll(MESSAGE_ROLE_SELECTOR);
        }
    }

    if (conversation != null && conversation.length > 0) {
        logFile += '\n\nPrevious Conversation: ';
        for (let i = 0; i < conversation.length; i++) {
            let currentPerson = conversation[i].attributes.getNamedItem('data-message-author-role').value;

            if (currentPerson == 'assistant') {
                logFile += `\n\nChatGPT Response:\n`;
            } else {
                logFile += `\n\nUser Query:\n`;
            }

            logFile += conversation[i].innerText;
        }
        logFile += '\n';
    }

    // Create and set up the GIF display container
    img.src = IMAGE_URL;
    div.id = 'gifDisplayContainer';
    div.style.width = '100vw';
    div.style.position = 'absolute';
    div.style.top = '15%';

    img.style.width = '400px';
    img.style.margin = '0 auto';

    div.style.display = 'none';

    div.appendChild(img);
    body.appendChild(div);

    container = document.getElementById('gifDisplayContainer');
    console.log(logFile);
};
