// Fetch bot status and update the page, status.json is written by the bot
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
        document.getElementById('server-count').textContent = `${data.servers}`;
        if (!isOnline) {
            document.getElementById('bot-status').className = 'badge bg-danger';
        }
    })
    .catch(err => {
        console.error('Failed to fetch status.json:', err);
        document.getElementById('bot-status').textContent = 'Offline';
        document.getElementById('server-count').textContent = '?';
        document.getElementById('bot-status').className = 'badge bg-danger';
    });


// Fetch roll statistics and render chart, rollStats.json is written by the bot
// Do this only if an url parameter "stats" is present
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('stats')) {
    fetch('rollStats.json')
        .then(async res => {
            if (!res.ok) {
                // HTTP-Fehler abfangen
                throw new Error(`HTTP error! status: ${res.status} ${res.statusText}`);
            }
            return res.json();
        })
        .then(data => {
            const ctx = document.getElementById('rollChart').getContext('2d');
            //maximum height 300px
            document.getElementById('rollChart').style.maxHeight = '250px';
            const chart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['Critical Rolls', 'Hope Gained', 'Stress Cleared', 'Fear Gained'],
                    datasets: [{
                        label: 'Stats',
                        data: [data.totalCrits, data.totalHope, data.totalStress, data.totalFear],
                        backgroundColor: [
                            'rgba(75, 192, 192, 0.5)',
                            'rgba(255, 206, 86, 0.5)',
                            'rgba(54, 235, 120, 0.5)', //make this greenish
                            'rgba(153, 102, 255, 0.5)'
                        ],
                        borderColor: [
                            'rgba(75, 192, 192, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(54, 235, 120, 1)', //make this greenish
                            'rgba(153, 102, 255, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    }
                }
            });
        })
        .catch(err => {
            console.error('Failed to fetch rollStats.json:', err);
            document.getElementById('total-rolls').textContent = '?';
            document.getElementById('critical-rolls').textContent = '?';
            document.getElementById('hope-gained').textContent = '?';
            document.getElementById('fear-gained').textContent = '?';
            document.getElementById('stress-cleared').textContent = '?';
        });
}

// Fetch latest commits from GitHub and display in changelog
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


// Fetch terms and conditions markdown and display
fetch('/TERMS.md')
    .then(r => { return r.text(); })
    .then(t => {
        //remove links from the markdown
        t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
        document.getElementById('terms-content').innerHTML = marked.parse(t);
    });


// Fetch privacy policy markdown and display
fetch('/PRIVACY.md')
    .then(r => { return r.text(); })
    .then(t => {
        t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
        document.getElementById('privacy-content').innerHTML = marked.parse(t);
    });

// Fetch disclaimer markdown and display
fetch('/DISCLAIMER.md')
    .then(r => { return r.text(); })
    .then(t => {
        t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
        document.getElementById('disclaimer-content').innerHTML = marked.parse(t);
    });

// Set install links
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

// Set initial dark mode based on system preference
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add('dark-mode');
}

// Populate screenshot carousel, images are stored in /images/screenshots/, the names are provided in screenshots.json
fetch('images/screenshots.json')
    .then(res => res.json())
    .then(files => {


        const inner = document.getElementById('carousel-inner');
        files.forEach((file, i) => {
            const div = document.createElement('div');
            div.className = 'carousel-item' + (i === 0 ? ' active' : '');
            //max width 400px and center image
            div.innerHTML = `
            <div class="card border-secondary" style="width: 100%; max-width: 400px; margin: 0 auto;">
              <div class="card-body text-center">
                <h5 class="card-title">${file.title}</h5>
                <img src="images/screenshots/${file.filename}" class="card-img-top" alt="${file.description}">
                <p class="card-text">${file.description}</p>
              </div>
            </div>`;
            inner.appendChild(div);
        });
    });


// Populate features accordion from features.json
fetch('js/features.json')
    .then(res => res.json())
    .then(data => {
        const accordion = document.getElementById('commandsAccordion');
        data.forEach((feature, index) => {
            const item = document.createElement('div');
            item.className = 'accordion-item';
            item.innerHTML = `
                <h2 class="accordion-header" id="heading-${feature.command}">
                    <button class="accordion-button collapsed" type="button"
                        data-bs-toggle="collapse" data-bs-target="#collapse-${feature.command}"
                        aria-expanded="false" aria-controls="collapse-${feature.command}">
                        /${feature.command}
                    </button>
                </h2>
                <div id="collapse-${feature.command}" class="accordion-collapse collapse"
                    aria-labelledby="heading-${feature.command}" data-bs-parent="#commandsAccordion">
                    <div class="accordion-body">
                        ${feature.description}<br>
                        <strong>Options:</strong><br>
                        <ul>
                            ${feature.options.map(option => `<li><code>${option.name}</code> – ${option.description}</li>`).join('')}
                        </ul>
                        <strong>Examples:</strong> <br/><code>${feature.examples.join('</code><br /><code>')}</code>
                        <br/><br/>
                    </div>
                </div>
            `;
            accordion.appendChild(item);
        });
    })
    .catch(error => console.error('Error fetching features:', error));
