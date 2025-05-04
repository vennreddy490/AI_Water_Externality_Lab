/** @module Script */

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

/**
 * Persistent counters used to track user interactions.
 * @typedef {Object} PersistentCounters
 * @property {number} queryCount
 * @property {number} lastQueryLength
 * @property {number} lastResponseLength
 * @property {number} averageQueryLength
 * @property {number} averageResponseLength
 * @property {number} totalQueryLength
 * @property {number} totalResponseLength
 */

/** @type {PersistentCounters} */
// Persistent Variables
const persistentCounters = {
  queryCount: 0,
  lastQueryLength: 0,
  lastResponseLength: 0,
  averageQueryLength: 0,
  averageResponseLength: 0,
  totalQueryLength: 0, 
  totalResponseLength: 0
};

// Variables for tracking time, username, logs, and conversation data
let time;
let logFile;
let username;
let conversation;
let body;

//TODO: I don't think this matters that it's above the pause script
/**
 * Generates or retrieves a persistent user ID using localStorage.
 * @returns {string} The persistent user ID.
 */
function getPersistentUserId() {
  let uid = localStorage.getItem("myExtensionUserId");
  if (!uid) {
    uid = crypto.randomUUID(); // modern browsers support this natively
    localStorage.setItem("myExtensionUserId", uid);
  }
  return uid;
}

// Global variable to hold the persistent user id
let persistentUserId;

/**
 * Utility function to pause execution for a given delay.
 * @param {number} delayTime - Delay in milliseconds.
 * @returns {Promise<void>}
 */
const PAUSE_SCRIPT = (delayTime) => new Promise((resolve) => setTimeout(resolve, delayTime));

/**
 * Function to store counters data in IndexedDB.
 * This function opens (or creates) a database called 'myDB' with an object store named 'stats'
 * and then adds a record with the current values in persistentCounters.
 */
function storeCountersData() {
  const request = indexedDB.open('myDB', 1);

  request.onupgradeneeded = function(event) {
    const db = event.target.result;
    // Create the 'stats' object store if it doesn't already exist.
    if (!db.objectStoreNames.contains('stats')) {
      // db.createObjectStore('stats', { keyPath: 'id ', autoIncrement: true });
      db.createObjectStore('stats', { keyPath: 'queryID', autoIncrement: true });
    }
  };

  request.onsuccess = function(event) {
    const db = event.target.result;
    // Start a transaction to add a record to the 'stats' store.
    //! IN PRODUCTION, WILL JUST BE "queries"
    const transaction = db.transaction('stats', 'readwrite');
    const store = transaction.objectStore('stats');


    const record = {
      persistentUserId: persistentUserId,
      query_length: persistentCounters.lastQueryLength,
      response_length: persistentCounters.lastResponseLength,
      time_created: Date.now()
      // queryCount: persistentCounters.queryCount,
      // averageQueryLength: persistentCounters.averageQueryLength,
      // averageResponseLength: persistentCounters.averageResponseLength,
    };
    console.log("The userID is: ")
    console.log(persistentUserId)


    const addRequest = store.add(record);

    addRequest.onsuccess = function() {
      console.log("Record stored in IndexedDB successfully");
    };

    addRequest.onerror = function(e) {
      console.error("Error storing record in IndexedDB:", e.target.errorCode);
    };
  };

  request.onerror = function(e) {
    console.error("Error opening IndexedDB database:", e.target.errorCode);
  };
}


/**
 * Function to create the query counter div if it doesn't exist
 */
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
    counterDiv.style.background = "#1C2541"; // Light light blue background
    counterDiv.style.color = "#C1D9F0";
    counterDiv.style.padding = "10px";
    counterDiv.style.borderRadius = "10px"; // Curved borders
    counterDiv.style.fontSize = "14px";
    counterDiv.style.cursor = "default";

    // Create a close button
    const closeButton = document.createElement("button");
    closeButton.innerText = "X";
    closeButton.style.position = "absolute";
    closeButton.style.top = "5px";
    closeButton.style.left = "10px";
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

    const progressRectangle = document.createElement("div");
    progressRectangle.style.position = "absolute";
    progressRectangle.style.bottom = "0px"; // Position at the bottom
    progressRectangle.style.right = "0px";
    progressRectangle.style.width = "15%";
    progressRectangle.style.height = "100%"; // Height of the progress bar
    progressRectangle.style.backgroundColor = "white"; // blue background

    counterDiv.appendChild(progressRectangle);

    // Create progress bar
    const progressBar = document.createElement("div");
    progressBar.id = "progressBar";
    progressBar.style.position = "absolute";
    progressBar.style.bottom = "0px"; // Position at the bottom
    progressBar.style.right = "0px";
    progressBar.style.width = "15%";
    progressBar.style.height = "0px"; // Height of the progress bar
    progressBar.style.backgroundColor = "blue"; // blue background
    
    counterDiv.appendChild(progressBar);

    

    // Create text for "Bottles Equivalent"
    const bottlesDisplay = document.createElement("p");
    bottlesDisplay.innerText = "Bottles: 0";
    bottlesDisplay.id = "bottlesDisplay"; // For dynamic updates
    bottlesDisplay.style.position = "absolute";
    bottlesDisplay.style.bottom = "0px";
    bottlesDisplay.style.left = "10px"
    bottlesDisplay.style.margin = "10px 0";
    counterDiv.appendChild(bottlesDisplay);

    // Create text for "Volume of Water"
    const volume = document.createElement("p");
    volume.innerText = "Volume: 0 fl oz";
    volume.id = "volumeDisplay"; // For dynamic updates
    volume.style.position = "absolute";
    volume.style.bottom = "0px";
    volume.style.right = "50px"
    volume.style.margin = "10px 0";
    counterDiv.appendChild(volume);



    // Create image element for the droplet image
    const imageElement = document.createElement("img");
    imageElement.id = "bottleImage";
    imageElement.style.position = "absolute";
    imageElement.style.top = "10px"; // Adjust image position as needed
    imageElement.style.left = "50%";
    imageElement.style.transform = "translateX(-50%)"; // Center the image

    // Set the initial image (droplet)
    imageElement.src = "images/imagesrc.png"; // Replace with your droplet image path
    imageElement.alt = "Water Droplet";

    counterDiv.appendChild(imageElement);


    // You can uncomment the function to add/change the header text

    /* const header = document.createElement("h2");
    header.innerText = "Display Info";
    header.style.textAlign = "center";
    header.style.margin = "0 0 10px 0"; // margin bottom for spacing
    counterDiv.appendChild(header);
    counterDiv.appendChild(document.createElement("br")); */

    // You can uncomment the function to: Create centered text for "Queries: __"
   
    /* const queriesDisplay = document.createElement("p");
    queriesDisplay.innerText = "Queries Made: " + persistentCounters.queryCount;
    queriesDisplay.style.textAlign = "center";
    queriesDisplay.style.margin = "10px 0";
    queriesDisplay.id = "queryCountDisplay"; // For dynamic updates
    counterDiv.appendChild(queriesDisplay);
    counterDiv.appendChild(document.createElement("br")); */

    // You can uncomment the fucntion to: Create text for "Last Query Length: ___"
    /* const lastQueryLengthDisplay = document.createElement("p");
    lastQueryLengthDisplay.innerText = "Last Query Length: " + persistentCounters.lastQueryLength;
    lastQueryLengthDisplay.id = "lastQueryLengthDisplay"; // for dynamic updates
    counterDiv.appendChild(lastQueryLengthDisplay);
    counterDiv.appendChild(document.createElement("br")); */

    // You can uncomment the function to: Create text for "Last Response Length: ___"
    /* const lastResponseLengthDisplay = document.createElement("p");
    lastResponseLengthDisplay.innerText = "Last Response Length: " + persistentCounters.lastResponseLength;
    lastResponseLengthDisplay.id = "lastResponseLengthDisplay"; // for dynamic updates
    counterDiv.appendChild(lastResponseLengthDisplay);
    counterDiv.appendChild(document.createElement("br")); */


    // You can uncomment the function to: Create text for "Average Query Length: ____"
    /* const averageQueryLengthDisplay = document.createElement("p");
    averageQueryLengthDisplay.innerText = "Average Query Length: " + persistentCounters.averageQueryLength;
    averageQueryLengthDisplay.id = "averageQueryLengthDisplay"; // for dynamic updates
    counterDiv.appendChild(averageQueryLengthDisplay);
    counterDiv.appendChild(document.createElement("br")); */


    // You can uncomment the function to: Create text for "Average Response Length: ___"
    /* const averageResponseLengthDisplay = document.createElement("p");
    averageResponseLengthDisplay.innerText = "Average Response Length: " + persistentCounters.averageResponseLength;
    averageResponseLengthDisplay.id = "averageResponseLengthDisplay"; // for dynamic updates
    counterDiv.appendChild(averageResponseLengthDisplay); */


    
    document.body.appendChild(counterDiv);
  }
}

/**
 * Function to create the button which opens the dashboard
 */
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
  button.style.backgroundColor = "#0D1B2A"; // Dark blue background
  button.style.color = "#C1D9F0";
  button.style.zIndex = "10000"; 

  button.addEventListener("click", () => {
      createQueryCounter();
  });

  // Append the button to the body (or any other element you prefer)
  document.body.appendChild(button);
}


/**
 * Event listener that runs once the window is fully loaded.
 * Initializes persistent user ID and starts extension logic.
 */
window.addEventListener('load', async (e) => {
  // Initialize the persistent user id
  persistentUserId = getPersistentUserId();
  console.log("Persistent User ID:", persistentUserId);

  createWaterButton();
  // Notify the background script that the page has loaded
  await chrome.runtime.sendMessage({});
  // Initialize the extension functionality
  await START_FUNC(window.document.URL);
});

/**
 * Listener for messages from the background script.
 * Handles prompt send, prompt complete, and conversation start messages.
 * @param {chrome.runtime.Port} port
 */
chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener(async (msg) => {
    if (msg.sentPrompt) {
      // When a prompt is sent, increment the query counter and update only its display element
      persistentCounters.queryCount++;
      const queryCountDisplay = document.getElementById("queryCountDisplay");
      if (queryCountDisplay) {
        queryCountDisplay.innerText = "Queries Made: " + persistentCounters.queryCount;
      }

      const progressBar = document.getElementById("progressBar");
      if (progressBar){
        const wordsPerBottle = 100; // 100 words per 16 fl oz bottle
        const maxBottles = 10; // You can set a visual goal (like 10 bottles = full bar)
        const maxWords = wordsPerBottle * maxBottles; // 1000 words in total = full bar

        const wordCount = persistentCounters.totalResponseLength || 0;
        const progress = Math.min(wordCount / maxWords, 1); // cap at 1 (100%)

        const height = progress * 100;
        progressBar.style.height = `${height}%`;
        progressBar.style.backgroundColor = "rgba(0, 123, 255, 0.8)"; // Nice water-like blue
        progressBar.style.transition = "height 0.3s ease";
      }

      const bottlesDisplay = document.getElementById("bottlesDisplay");
      if (bottlesDisplay) {
        const wordsPerBottle = 100; // 100 words per 16 fl oz bottle
        const bottleCount = Math.floor(persistentCounters.totalResponseLength / wordsPerBottle);
        bottlesDisplay.innerText = "Bottles: " + bottleCount;
      }
      
      const imageElement = document.getElementById("bottleImage");
      if (imageElement) {
        const wordsPerBottle = 100; // 100 words per 16 fl oz bottle
        const bottleCount = Math.floor(persistentCounters.totalResponseLength / wordsPerBottle);

        // Check if the image needs to be updated
        const newImageSrc = `images/image${bottleCount}.png`; // Replace with your bottle image path
        if (imageElement.src !== newImageSrc) {
          imageElement.src = newImageSrc;
        }
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
      persistentCounters.lastQueryLength = countWords(prompt);
      persistentCounters.lastResponseLength = countWords(newMessage);

      persistentCounters.totalQueryLength = persistentCounters.totalQueryLength + persistentCounters.lastQueryLength
      persistentCounters.totalResponseLength = persistentCounters.totalResponseLength + persistentCounters.lastResponseLength

      persistentCounters.averageQueryLength = persistentCounters.totalQueryLength / persistentCounters.queryCount
      persistentCounters.averageResponseLength = persistentCounters.totalResponseLength / persistentCounters.queryCount

      // Update the dashboard elements if they exist
      const lastQueryLengthDisplay = document.getElementById("lastQueryLengthDisplay");
      if (lastQueryLengthDisplay) {
        lastQueryLengthDisplay.innerText = "Last Query Length: " + persistentCounters.lastQueryLength;
      }

      const lastResponseLengthDisplay = document.getElementById("lastResponseLengthDisplay");
      if (lastResponseLengthDisplay) {
        lastResponseLengthDisplay.innerText = "Last Response Length: " + persistentCounters.lastResponseLength;
      }

      const averageQueryLengthDisplay = document.getElementById("averageQueryLengthDisplay");
      if (averageQueryLengthDisplay) {
        averageQueryLengthDisplay.innerText = "Average Query Length: " + persistentCounters.averageQueryLength;
      }

      const averageResponseLengthDisplay = document.getElementById("averageResponseLengthDisplay");
      if (averageResponseLengthDisplay) {
        averageResponseLengthDisplay.innerText = "Average Response Length: " + persistentCounters.averageResponseLength;
      }

      // // Testing data stroage
      // chrome.storage.local.set({ myData: persistentCounters }, () => {
      //   console.log('Data saved to chrome.storage');
      // });

      // chrome.storage.local.set({ "AVERAGE_QUERY_LENGTH": persistentCounters.averageQueryLength }).then(() => {
      //   console.log("Value is set");
      // });

      // localStorage.setItem('TESTING_VALUE_4_PLEASE', 'WOULD IT NOT BE AWESOME IF THIS WORKED')

      // Testing it over everything in local Storage
      localStorage.setItem('LAST_QUERY_LENGTH', persistentCounters.lastQueryLength)
      localStorage.setItem('LAST_RESPONSE_LENGTH', persistentCounters.lastResponseLength)
      localStorage.setItem('AVERAGE_QUERY_LENGTH', persistentCounters.averageQueryLength)
      localStorage.setItem('AVERAGE_RESPONSE_LENGTH', persistentCounters.averageResponseLength)

      // Testing if it saves to the indexDB
      storeCountersData();
    

    } else if (msg.newConvo || msg.existingConvo) {
      // Reinitialize the extension for new or existing conversations
      await START_FUNC(window.document.URL);
    }
  });
});


/**
 * Function to initialize the extension on the current page.
 * @param {string} pageURL - The URL of the current page.
 * @returns {Promise<void>}
 */
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

/**
 * Helper function to count words in a given string.
 * @param {string} text - The text to analyze.
 * @returns {number} The number of words in the input text.
 */
function countWords(text) {
  if (!text) return 0;
  // Trims any extra spaces and split by one or more whitespace characters.
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}
