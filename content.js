$('body').append(`<h1> Hello World </h1>`)

// Retrieve url for image 
iconURL = chrome.runtime.getURL("./bottle.png");

// Append image to DOM
$('body').prepend(`<img class="bottle-img" src="${iconURL}" alt="bottle image">`)
$('.bottle-img').css('mix-blend-mode', 'multiply')
