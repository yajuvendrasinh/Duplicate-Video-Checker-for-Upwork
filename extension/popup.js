/**
 * Upwork Bid Checker - Popup Logic
 * 
 * PURPOSE:
 * This script handles the extension's manual popup interface.
 * It allows users to:
 * 1. Set their name (saved locally for convenience).
 * 2. Manually claim an Upwork job if they are on a job page.
 * 3. Open the "Recent Bids" dashboard.
 * 
 * KEY FEATURES:
 * - Persistence: Remembers your name so you only type it once.
 * - Validation: Ensures the user is actually on an Upwork job page before saving.
 * - Identity: Silently captures Google account info for tracking.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // --- UI ELEMENTS ---
    const addedByInput = document.getElementById('addedBy');
    const saveBtn = document.getElementById('saveBtn');
    const statusDiv = document.getElementById('status');
    const pageTitleSpan = document.getElementById('pageTitle');
    const pageUrlSpan = document.getElementById('pageUrl');

    // --- 1. SETTINGS LOAD ---
    // Load the user's manual name from local Chrome Sync storage.
    chrome.storage.sync.get(['addedBy'], (result) => {
        if (result.addedBy) {
            addedByInput.value = result.addedBy;
        }
    });

    // --- 2. TAB VALIDATION ---
    // Get info about the current active browser tab.
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab) {
        pageTitleSpan.textContent = tab.title || 'Unknown Title';
        pageUrlSpan.textContent = tab.url || 'Unknown URL';

        // Check if the current URL is actually an Upwork job page.
        // We look for 'upwork.com' and the '~' character which denotes a Job ID.
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

    // --- 3. SAVE ACTION ---
    saveBtn.addEventListener('click', async () => {
        const name = addedByInput.value.trim();

        // Validation: Manual name is required field.
        if (!name) {
            showStatus('Please enter your name first.', 'error');
            addedByInput.focus();
            return;
        }

        // Persist the user's name for future sessions.
        chrome.storage.sync.set({ addedBy: name });

        // --- 3a. JOB ID EXTRACTION ---
        // Extract the unique Job ID (~01923...) from the current tab's URL.
        const jobIdMatch = tab.url.match(/(~[0-9]+)/);
        if (!jobIdMatch) {
            showStatus('Error: Could not extract Job ID (~...)', 'error');
            return;
        }
        const jobId = jobIdMatch[1];

        // --- 3b. CONFIGURATION ---
        const project = CONFIG.FIREBASE_PROJECT_ID;
        const key = CONFIG.FIREBASE_API_KEY;
        const collection = CONFIG.COLLECTION_NAME;

        // URL for creating a document where the document ID IS the Upwork Job ID.
        // This automatically prevents duplicate entries for the same job.
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/${collection}?documentId=${jobId}&key=${key}`;

        // --- 3c. IDENTITY TRACKING ---
        // Content scripts and popups can't use chrome.identity directly.
        // We send a message to the service worker to fetch the Google ID for us.
        let googleUserId = '';
        let googleEmail = '';
        try {
            const userInfo = await new Promise((resolve) => {
                chrome.runtime.sendMessage({ action: 'getUserInfo' }, resolve);
            });
            googleUserId = userInfo?.googleUserId || '';
            googleEmail = userInfo?.googleEmail || '';
        } catch (e) {
            console.log('Could not get user info:', e);
        }

        // Data structure matching our Firestore schema.
        const payload = {
            fields: {
                url: { stringValue: tab.url },
                title: { stringValue: tab.title },
                addedBy: { stringValue: name },
                jobId: { stringValue: jobId },
                timestamp: { stringValue: new Date().toISOString() },
                googleUserId: { stringValue: googleUserId },
                googleEmail: { stringValue: googleEmail }
            }
        };

        showStatus('Saving...', 'loading');
        saveBtn.disabled = true;

        try {
            // Send the POST request to the Firestore REST API.
            const response = await fetch(firestoreUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                // SUCCESS: Entry saved.
                showStatus('Saved ✅', 'success');
                // Auto-close after 1 second to stay out of the user's way.
                setTimeout(() => {
                    window.close();
                }, 1000);
            } else {
                // HANDLE CONFLICT: 409 means Job ID already exists in DB.
                if (response.status === 409 || (data.error && data.error.status === 'ALREADY_EXISTS')) {
                    showStatus('Already exists ❌', 'error');
                } else {
                    console.error("Firestore Error", data);
                    showStatus(`Error: ${data.error ? data.error.message : 'Unknown'}`, 'error');
                    saveBtn.disabled = false;
                }
            }

        } catch (error) {
            console.error('Fetch error:', error);
            showStatus('Network Error ❌', 'error');
            saveBtn.disabled = false;
        }
    });

    /**
     * Helper to update status text and colors in the popup UI.
     */
    function showStatus(msg, type) {
        statusDiv.textContent = msg;
        statusDiv.className = 'status ' + type;
    }

    // --- 4. NAVIGATION ---
    // Button to open the list of all saved bids in a new tab.
    const viewBtn = document.getElementById('viewBtn');
    if (viewBtn) {
        viewBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: 'viewer.html' });
        });
    }
});
