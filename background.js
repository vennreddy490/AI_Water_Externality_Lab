// chrome.runtime.onInstalled.addListener(() => { 
//     chrome.action.setBadgeText({ 
//         "text": "OFF",
//     });
// })

// const chat = "https://chatgpt.com/"; 
// const webstore = "https://developer.chrome.com/docs/webstore";

// chrome.action.onClicked.addListener(async (tab) => { 
//     if (tab.url.startsWith(chat) || tab.url.startsWith(webstore)) { 
//         const prevState = await chrome.action.getBadgeText({tabId: tab.id});
//         const nextState = prevState === 'ON' ? 'OFF' : 'ON'

//         await chrome.action.setBadgeText({ 
//             tabId: tab.id,
//             text: nextState,
//         });
//     } 
// })