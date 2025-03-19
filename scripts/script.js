/* Configuration for the counter display */
const MESSAGE_ROLE_SELECTOR = "[data-message-author-role]"; 

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
let conversation;
let body;

// Global counter for the number of queries made and other query info
let queryCount = 3;
let totalQueryLength = 0;
let totalResponseLength = 0;
let responseCount = 0;

// Utility to create delays
const PAUSE_SCRIPT = (delayTime) => new Promise((resolve) => setTimeout(resolve, delayTime));

// Function to create the query counter div if it doesn't exist
function createQueryCounter() {
  if (!document.getElementById("myExtensionCounter")) {
    const counterDiv = document.createElement("div");
    counterDiv.id = "myExtensionCounter";

    // Adjusted styles:
    counterDiv.style.position = "fixed";
    counterDiv.style.top = "340px"; // Starts a bit lower than before
    counterDiv.style.right = "20px";
    counterDiv.style.height = "400px"; // Leaves 100px at bottom
    counterDiv.style.width = "250px"; // Optional: set a width if needed
    counterDiv.style.zIndex = "999999";
    counterDiv.style.background = "#ADD8E6"; // Light light blue background
    counterDiv.style.color = "black";
    counterDiv.style.padding = "10px";
    counterDiv.style.border = "2px solid black";
    counterDiv.style.borderRadius = "10px"; // Curved borders
    counterDiv.style.fontSize = "14px";
    counterDiv.style.cursor = "default";

    // Create a close button
    const closeButton = document.createElement("button");
    closeButton.innerText = "X";
    closeButton.style.position = "absolute";
    closeButton.style.top = "5px";
    closeButton.style.right = "10px";
    closeButton.style.background = "red";
    closeButton.style.color = "white";
    closeButton.style.border = "none";
    closeButton.style.cursor = "pointer";
    closeButton.style.padding = "5px 10px";
    closeButton.style.fontSize = "14px";
    closeButton.style.borderRadius = "5px";

    // Add click event to close the counter
    closeButton.addEventListener("click", () => {
      counterDiv.remove();
    });

    counterDiv.appendChild(closeButton);


    // Create a header that says "Display Info"
    const header = document.createElement("h2");
    header.innerText = "Display Info";
    header.style.textAlign = "center";
    header.style.margin = "0 0 10px 0"; // margin bottom for spacing
    counterDiv.appendChild(header);
    counterDiv.appendChild(document.createElement("br"));

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
    lastQueryLength.innerText = "Last Query Length: 0";
    lastQueryLength.id = "lastQueryLengthDisplay"; // for dynamic updates
    counterDiv.appendChild(lastQueryLength);
    counterDiv.appendChild(document.createElement("br"));

    // Create text for "Last Response Length: ___"
    const lastResponseLength = document.createElement("p");
    lastResponseLength.innerText = "Last Response Length: 0";
    lastResponseLength.id = "lastResponseLengthDisplay"; // for dynamic updates
    counterDiv.appendChild(lastResponseLength);
    counterDiv.appendChild(document.createElement("br"));

    // Create text for "Total Query Length: ___"
    const totalQueryLength = document.createElement("p");
    totalQueryLength.innerText = "Total Query Length: 0";
    counterDiv.appendChild(totalQueryLength);
    counterDiv.appendChild(document.createElement("br"));

    // Create text for "Average Response Length: ___"
    const avgResponseLength = document.createElement("p");
    avgResponseLength.innerText = "Average Response Length: 0";
    counterDiv.appendChild(avgResponseLength);

    document.body.appendChild(counterDiv);
  }
}

//this is the button which opens the dashboard

function createWaterButton() {
  const button = document.createElement("button");
  button.innerText = "Query Counter";

  button.style.position = "fixed"; // Fix the position on the screen
  button.style.top = "10px"; // Adjust as needed to place it at the top
  button.style.right = "250px"; // Align to the right
  button.style.padding = "10px 15px";
  button.style.fontSize = "14px";
  button.style.cursor = "pointer";
  button.style.border = "1px solid #ccc";
  button.style.borderRadius = "5px";
  button.style.backgroundColor = "#008CBA";
  button.style.color = "white";
  button.style.zIndex = "10000"; 

  button.addEventListener("click", () => {
      createQueryCounter();
  });

  // Append the button to the body (or any other element you prefer)
  document.body.appendChild(button);
}


// Event listener for the window load event
window.addEventListener('load', async (e) => {
  //createQueryCounter();

  createWaterButton();
  // Notify the background script that the page has loaded
  await chrome.runtime.sendMessage({});
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
      await PAUSE_SCRIPT(300);
      conversation = document.querySelectorAll(MESSAGE_ROLE_SELECTOR);
      let prompt = conversation[conversation.length - 2].innerText;
      let newMessage = conversation[conversation.length - 1].innerText;

      // log the conversation details
      logFile += '\n\nUser Query: \n' + prompt + '\n\nChatGPT Response: \n' + newMessage;
      console.log(logFile);

      // Calculate word counts using the countWords function
      const promptWordCount = countWords(prompt);
      const newMessageWordCount = countWords(newMessage);

      // Update the dashboard elements with the word counts
      const lastQueryLengthDisplay = document.getElementById("lastQueryLengthDisplay");
      if (lastQueryLengthDisplay) {
        lastQueryLengthDisplay.innerText = "Last Query Length (words): " + promptWordCount;
      }

      const lastResponseLengthDisplay = document.getElementById("lastResponseLengthDisplay");
      if (lastResponseLengthDisplay) {
        lastResponseLengthDisplay.innerText = "Last Response Length (words): " + newMessageWordCount;
      }

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
  username = document.querySelector(`[data-testid='profile-button']`);
  if (username == null) {
    while (username == null) {
      await PAUSE_SCRIPT(500);
      username = document.querySelector(`[data-testid='profile-button']`);
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


// Helper function to count words in a given string.
function countWords(text) {
  if (!text) return 0;
  // Trims any extra spaces and split by one or more whitespace characters.
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}
