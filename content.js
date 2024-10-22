$('body').append(`<h1> Hello World </h1>`)

// Retrieve url for image 
iconURL = chrome.runtime.getURL("./bottle.png");

// Append image to DOM
$('body').append(`<img src="${iconURL}" alt="bottle image">`)

