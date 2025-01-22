const estConverter = new Intl.DateTimeFormat('en-US', {
    timeZone: "America/New_York",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric"
});

const messageRoleSelector = `[data-message-author-role]`;
const notEmptySelector = `*:not(.empty)`;

/* Config */
const IMAGE_URL = 'https://giphy.com/gifs/photoshop-after-effects-kristian-andrews-MagjwsUK2vunGimNXT';
const GIF_DELAY = 3.5; // In seconds
/* Config End */

const delay = (delayTime) =>
    new Promise((resolve) => setTimeout(() => resolve(), delayTime));

window.addEventListener('load', async () => {
    const body = document.querySelector('body');
    const div = document.createElement('div');
    const img = document.createElement('img');
    let time = new Date();

    let lightSwitch = true;

    let username = document.querySelector(`[data-testid='accounts-profile-button']`);

    if (username == null) {
        while (lightSwitch) {
            await delay(500);
            username = document.querySelector(`[data-testid='accounts-profile-button']`);
            if (username != null) {
                lightSwitch = false;
            }
        }
    }

    username = username.innerText;
    console.log(estConverter.format(time), '\nUsername: ' + username);

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

    const container = document.getElementById('gifDisplayContainer');

    body.addEventListener('click', async (e) => {
        const button = e.target.closest('button');

        if (button?.getAttribute('aria-label') == 'Send prompt') {
            const prompt = document.getElementById('prompt-textarea');
            const userQuery = prompt.value;

            time = new Date();

            container.style.display = 'inline';
            setTimeout(() => {
                container.style.display = 'none';
            }, GIF_DELAY * 1000);

            console.log(
                estConverter.format(time),
                '\nUser Query: ' + userQuery,
                '\nUsername: ' + username
            );
        }
    });
});
