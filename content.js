import React from 'react'
import ReactDOM from 'react-dom'

// $('body').append(`<h1> Hello World </h1>`)

//  
// iconURL = chrome.runtime.getURL("./bottle.png");

// // Append image to DOM
// $('body').prepend(`<img class="bottle-img" src="${iconURL}" alt="bottle image">`)

// $(`<img class="bottle-img" src="${iconURL}" alt="bottle image">`).insertAfter(`body > div.relative.flex.h-full.w-full.overflow-hidden.transition-colors.z-0 > div.relative.flex.h-full.max-w-full.flex-1.flex-col.overflow-hidden`)

// Retrieve url for image
iconURL = chrome.runtime.getURL("./bottle.png");

// Render image 
function waterBottle() { 
    return ( 
        <div> 
            <img class="bottle-img" src="${iconURL}" alt="bottle image"/>
        </div>
        
    )
    
}
function injectBottle() { 
    const target = document.getElementByClassName(`body > div.relative.flex.h-full.w-full.overflow-hidden.transition-colors.z-0 > div.relative.flex.h-full.max-w-full.flex-1.flex-col.overflow-hidden`)

    const divToAppend = document.createElement(`div`)
    
    target.appendChild(divToAppend)

    ReactDOM.render(<waterBottle/>, divToAppend) 
}

injectBottle() 
