document.addEventListener('DOMContentLoaded', async () => {
    console.log("Popup script loaded v3 - UI Updates");
    const addedByInput = document.getElementById('addedBy');
    const saveBtn = document.getElementById('saveBtn');
    const statusDiv = document.getElementById('status');
    const pageTitleSpan = document.getElementById('pageTitle');
    const pageUrlSpan = document.getElementById('pageUrl');

    // 1. Load saved name
    chrome.storage.sync.get(['addedBy'], (result) => {
        if (result.addedBy) {
            addedByInput.value = result.addedBy;
        }
    });

    // 2. Get current tab info
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab) {
        pageTitleSpan.textContent = tab.title || 'Unknown Title';
        pageUrlSpan.textContent = tab.url || 'Unknown URL';

        // CHECK IF UPWORK URL
        const isUpwork = tab.url && tab.url.includes('upwork.com') && tab.url.includes('~');

        if (!isUpwork) {
            showStatus('This is not an Upwork Job Page ❌', 'error');
            saveBtn.disabled = true;
            saveBtn.textContent = "Not Upwork Job";
            saveBtn.style.backgroundColor = "#999";
        }

    } else {
        showStatus('Error: Could not get tab info', 'error');
        saveBtn.disabled = true;
    }

    // 3. Handle Save
    saveBtn.addEventListener('click', async () => {
        const name = addedByInput.value.trim();
        if (!name) {
            showStatus('Please enter your name first.', 'error');
            addedByInput.focus();
            return;
        }

        // Save name for next time
        chrome.storage.sync.set({ addedBy: name });

        const webAppUrl = CONFIG.WEB_APP_URL;
        const secret = CONFIG.SECRET_TOKEN;

        const payload = {
            url: tab.url,
            title: tab.title,
            addedBy: name,
            secret: secret
        };

        if (!webAppUrl || webAppUrl.length < 20) {
            showStatus('Error: CONFIG.WEB_APP_URL not set!', 'error');
            return;
        }

        showStatus('Checking...', 'loading');
        saveBtn.disabled = true;

        try {
            const response = await fetch(webAppUrl, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.ok) {
                showStatus('Saved ✅', 'success');
                // Close after 1 second
                setTimeout(() => {
                    window.close();
                }, 1000);
            } else {
                if (data.code === 'DUPLICATE') {
                    showStatus('Already exists ❌', 'error');
                } else {
                    showStatus(`Error: ${data.error || 'Unknown'}`, 'error');
                }
                // Re-enable button on error so they can try again if needed? 
                // Actually for duplicate, no point. For error, maybe.
                // But user said "if it is not in the sheet it should say saving and close".
                // So for errors we stay open.
            }

        } catch (error) {
            console.error('Fetch error:', error);
            showStatus('Network/Auth Error ❌', 'error');
            saveBtn.disabled = false;
        }
    });

    function showStatus(msg, type) {
        statusDiv.textContent = msg;
        statusDiv.className = 'status ' + type;
    }
});
