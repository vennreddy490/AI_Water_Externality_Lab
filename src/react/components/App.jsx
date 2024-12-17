import {useState} from 'react';

const App = () => {
  const [scriptResp, setScriptResp] = useState(null);

  const getRandomUser = async () => {
    // Get users
    const resp = await fetch('https://jsonplaceholder.typicode.com/users');
    const users = await resp.json();
    // Get email
    const randomEmail = users[Math.floor(Math.random() * users.length)].email;
    // Get active tab
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    const activeTab = tabs[0];
    // Get the response
    const tabResp = await chrome.tabs.sendMessage(activeTab.id, randomEmail);
    setScriptResp(tabResp);
  };

  return (
    <main>
      <h1>Add User Contact to Page</h1>
      <button onClick={getRandomUser}>Get Random User</button>
      <h2>Content script says: {scriptResp}</h2>
    </main>
  );
};
export default App;