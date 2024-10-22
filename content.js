$('body').append(`<h1> Hello World </h1>`)
// const iconURL = document.createElement('img')

iconURL = chrome.runtime.getURL("./bottle.png");
console.log(iconURL)
$('body').append(`<img src="${iconURL}" alt="bottle image">`)

