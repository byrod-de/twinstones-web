//Status.json has the structure:
//{
//  "online": true,
//  "timestamp": "2023-07-20T15:30:40.000Z",
//  "servers": 123
//}
// Fetch the status.json file and update the bot status and server count. If the timestamp is older than 10 minutes, consider the bot offline.

fetch('status.json')
    .then(async res => {
        if (!res.ok) {
            // HTTP-Fehler abfangen
            throw new Error(`HTTP error! status: ${res.status} ${res.statusText}`);
        }
        return res.json();
    })
    .then(data => {
        const timestamp = new Date(data.timestamp);
        const now = new Date();
        const diffMinutes = (now - timestamp) / 1000 / 60;

        const isOnline = data.online && diffMinutes <= 10;

        document.getElementById('bot-status').textContent = isOnline ? 'Online' : 'Offline';
        document.getElementById('server-count').textContent = `Servers: ${data.servers}`;
        if (!isOnline) {
            document.getElementById('bot-status').className = 'badge bg-danger';
        }
    })
    .catch(err => {
        console.error('Failed to fetch status.json:', err);
        document.getElementById('bot-status').textContent = 'Offline';
        document.getElementById('server-count').textContent = 'Servers: ?';
        document.getElementById('bot-status').className = 'badge bg-danger';
    });

/* To be activated when rollStats.json is available and has more data!
fetch('rollStats.json')
    .then(async res => {
        if (!res.ok) {
            // HTTP-Fehler abfangen
            throw new Error(`HTTP error! status: ${res.status} ${res.statusText}`);
        }
        return res.json();
    })
    .then(data => {
        document.getElementById('total-rolls').textContent = data.totalRolls;
        document.getElementById('critical-rolls').textContent = data.totalCrits;
        document.getElementById('hope-gained').textContent = data.totalHope;
        document.getElementById('fear-gained').textContent = data.totalFear;
        document.getElementById('stress-cleared').textContent = data.totalStress;
    })
    .catch(err => {
        console.error('Failed to fetch rollStats.json:', err);
        document.getElementById('total-rolls').textContent = '?';
        document.getElementById('critical-rolls').textContent = '?';
        document.getElementById('hope-gained').textContent = '?';
        document.getElementById('fear-gained').textContent = '?';
        document.getElementById('stress-cleared').textContent = '?';
    });
*/

fetch('https://api.github.com/repos/byrod-de/twinstones/commits')
    .then(res => res.json())
    .then(data => {
        const list = document.getElementById('changelog-list');
        list.innerHTML = '';
        data.slice(0, 10).forEach(c => { // letzte 10 commits
            const li = document.createElement('li');
            li.className = 'list-group-item bg-light text-dark';
            //format date as inline code
            li.innerHTML = `<code>${c.commit.author.date}</code>: ${c.commit.message}`;
            list.appendChild(li);
        });
    })
    .catch(() => {
        document.getElementById('changelog-list').innerHTML = '<li class="list-group-item">Failed to load commits.</li>';
    });

fetch("TERMS.md")
  .then(r => {
    if (!r.ok) throw new Error(`HTTP error! ${r.status}`);
    return r.text();
  })
  .then(t => {
    t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
    document.getElementById('terms-content').innerHTML = marked.parse(t);
  })
  .catch(err => console.error(err));


  fetch('/PRIVACY.md')
  .then(r => { console.log(r); return r.text(); })
    .then(t => {
      document.getElementById('privacy-content').innerHTML = marked.parse(t);
    });

fetch('/DISCLAIMER.md')
    .then(r => { console.log(r); return r.text(); })
    .then(t => {
      document.getElementById('disclaimer-content').innerHTML = marked.parse(t);
    });

const installLink = "https://discord.com/oauth2/authorize?client_id=1375907403173986485";

// Navbar link
document.querySelectorAll('a.nav-link.install').forEach(a => a.href = installLink);

// Button link
const btn = document.getElementById('install-btn');
if (btn) btn.href = installLink;

const toggle = document.getElementById('darkModeToggle');
toggle.addEventListener('change', () => {
    document.body.classList.toggle('dark-mode', toggle.checked);
});

// Optional: auto toggle based on system preference
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add('dark-mode');
}

//screehots are fertched from an array
const screenshots = [
    'images/screenshots/screenshot_001.png',
    'images/screenshots/screenshot_002.png',
    'images/screenshots/screenshot_003.png',
    'images/screenshots/screenshot_004.png'
];

const inner = document.getElementById('carousel-inner');
screenshots.forEach((src, i) => {
    const div = document.createElement('div');
    div.className = 'carousel-item' + (i === 0 ? ' active' : '');
    //max width 400px and center image
    div.innerHTML = `<img src="${src}" class="d-block w-100" alt="Screenshot ${i + 1}" style="max-width: 300px; object-fit: cover; margin: 0 auto;">`;
    inner.appendChild(div);
});