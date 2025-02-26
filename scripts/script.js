/* Configuration for GIF display */
const GIF_DISPLAY_TIME = 3.5; // Time in seconds to display the GIF
const IMAGE_URL = 'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExN2x1YjV4b2R6dWVua2Y5OHFpZDFjNnFyc2xueXRvMDF6c3RtbTY5NCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/MagjwsUK2vunGimNXT/giphy.gif'; // URL for the GIF
const MESSAGE_ROLE_SELECTOR = '[data-message-author-role]';

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
let logFile = ``;
let username;
let conversation;
let body;

// Global counter for the number of queries made
let queryCount = 0;

// Utility to create delays
const PAUSE_SCRIPT = (delayTime) => new Promise((resolve) => setTimeout(resolve, delayTime));

// Function to create the query counter div if it doesn't exist
function createQueryCounter() {
  if (!document.getElementById("myExtensionCounter")) {
    const counterDiv = document.createElement("div");
    counterDiv.id = "myExtensionCounter";

    // Adjusted styles:
    counterDiv.style.position = "fixed";
    counterDiv.style.top = "400px"; // Starts a bit lower than before
    counterDiv.style.right = "20px";
    counterDiv.style.height = "350px"; 
    counterDiv.style.width = "170px"; // Optional: set a width if needed
    counterDiv.style.zIndex = "999999";
    counterDiv.style.background = "#ADD8E6"; // Light light blue background
    counterDiv.style.color = "black";
    counterDiv.style.padding = "10px";
    counterDiv.style.border = "2px solid black";
    counterDiv.style.borderRadius = "10px"; // Curved borders
    counterDiv.style.fontSize = "14px";
    counterDiv.style.cursor = "default";

    // Create a header that says "Display Info"
    const header = document.createElement("h3");
    header.innerText = "WATER";
    header.style.textAlign = "center";
    header.style.margin = "0 0 10px 0"; // margin bottom for spacing
    counterDiv.appendChild(header);
    counterDiv.appendChild(document.createElement("br"));

    const waterLine = document.createElement("div");
    waterLine.id = "waterFlow";
    waterLine.style.height = "5px";
    waterLine.style.width = "100%";
    waterLine.style.background = "linear-gradient(to right, rgba(173, 216, 230, 0.8), rgba(0, 191, 255, 0.8))";
    waterLine.style.position = "relative";
    waterLine.style.marginBottom = "10px"; // Space between the water line and the "Queries" text
    counterDiv.appendChild(waterLine);

    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes flow {
        0% {
          transform: translateX(-50%);
        }
        100% {
          transform: translateX(50%);
        }
      }
      
      #waterFlow {
        animation: flow 2s linear infinite;
      }
    `;
    document.head.appendChild(style);

    // Create centered text for "Queries: __"
    const queriesDisplay = document.createElement("p");
    queriesDisplay.innerText = "Queries: 0";
    queriesDisplay.style.textAlign = "center";
    queriesDisplay.style.margin = "10px 0";
    queriesDisplay.id = "queryCountDisplay"; // For dynamic updates
    counterDiv.appendChild(queriesDisplay);
    counterDiv.appendChild(document.createElement("br"));



    // Create text for "Last Query Length: ___"
    const lastQueryLength = document.createElement("p");
    lastQueryLength.innerText = "Last Query Length: ";
    lastQueryLength.style.textAlign = "center";
    counterDiv.appendChild(lastQueryLength);
    counterDiv.appendChild(document.createElement("br"));

    // Create text for "Last Response Length: ___"
    const lastResponseLength = document.createElement("p");
    lastResponseLength.innerText = "Last Response Length ";
    lastResponseLength.style.textAlign = "center";
    counterDiv.appendChild(lastResponseLength);
    counterDiv.appendChild(document.createElement("br"));

    // Create text for "Total Query Length: ___"
    const totalQueryLength = document.createElement("p");
    totalQueryLength.innerText = "Total Query Length ";
    counterDiv.appendChild(totalQueryLength);
    counterDiv.appendChild(document.createElement("br"));

    // Create text for "Average Response Length: ___"
    const avgResponseLength = document.createElement("p");
    avgResponseLength.innerText = "Average Response Length: ";
    counterDiv.appendChild(avgResponseLength);

    document.body.appendChild(counterDiv);
  }
}

// Event listener for the window load event
window.addEventListener('load', async (e) => {
  createQueryCounter();
  // Notify the background script that the page has loaded
  if (chrome?.runtime?.sendMessage) {
    await chrome.runtime.sendMessage({});
  }
  
  //await chrome.runtime.sendMessage({});
  
  // Initialize the extension functionality
  await START_FUNC(window.document.URL);
});

// Listener for messages from the background script
chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener(async (msg) => {
    if (msg.sentPrompt) {
      // When a prompt is sent, increment the query counter and update only its display element
      queryCount++;
      const queryCountDisplay = document.getElementById("queryCountDisplay");
      if (queryCountDisplay) {
        queryCountDisplay.innerText = "Queries: " + queryCount;
      }
      
      // Log the timestamp and username
      time = new Date();
      logFile += '\n\n\n' + TIME_CONVERTER.format(time) + '\n\nUsername: ' + username;
    } else if (msg.promptComplete) {
      // Wait for a brief delay before logging the conversation
      await PAUSE_SCRIPT(8000);
      conversation = document.querySelectorAll(MESSAGE_ROLE_SELECTOR);
      let prompt = conversation[conversation.length - 2].innerText;
      let newMessage = conversation[conversation.length - 1].innerText;
      logFile += '\n\nUser Query: \n' + prompt + '\n\nChatGPT Response: \n' + newMessage;
      console.log(logFile);
    } else if (msg.newConvo || msg.existingConvo) {
      // Reinitialize the extension for new or existing conversations
      await START_FUNC(window.document.URL);
    }
  });
});

// Function to initialize the extension on the current page
const START_FUNC = async (pageURL) => {
  body = document.querySelector('body');
  conversation = null;
  logFile = ``;
  time = new Date();

  // Retrieve the username element and wait until it's available
  username = document.querySelector(`[data-testid='accounts-profile-button']`);
  let elapsedTime = 0;

  if (username == null) {
    while (username == null && elapsedTime < 5000) { // Timeout after 5 seconds
      await PAUSE_SCRIPT(500);
      elapsedTime += 500;
      username = document.querySelector(`[data-testid='accounts-profile-button']`);
    }

    if (username == null) {
      username = "Unknown User"; // Fallback if not found within the timeout
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
  console.log(logFile);
};