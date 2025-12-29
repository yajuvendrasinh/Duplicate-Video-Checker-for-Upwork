/**
 * Upwork Bid Checker - Popup Logic
 * 
 * VISION:
 * This extension is designed to streamline the process of tracking Upwork job bids for a team.
 * Instead of manually copying URLs to a spreadsheet and risking duplicates, this tool:
 * 1. Automatically detects if the user is on an Upwork job page.
 * 2. Extracts the unique Job ID (e.g., ~0123456789) from the URL.
 * 3. Checks a central database (Firebase Firestore) to see if this job has already been bid on.
 * 4. If new, saves the job details (URL, Title, Added By, Timestamp) to the database.
 * 
 * KEY FEATURES:
 * - Duplicate Prevention: Uses the Job ID as the unique document ID in Firestore. 
 *   This ensures 100% uniqueness without complex query logic.
 * - Real-time Feedback: Tells the user immediately if a job is "Saved", "Already exists", or if there's an error.
 * - Team Collaboration: "Added By" field lets the team know who claimed a lead.
 */

document.addEventListener('DOMContentLoaded', async () => {
    console.log("Popup script loaded - Upwork Bid Checker");

    // UI Elements
    const addedByInput = document.getElementById('addedBy');
    const saveBtn = document.getElementById('saveBtn');
    const statusDiv = document.getElementById('status');
    const pageTitleSpan = document.getElementById('pageTitle');
    const pageUrlSpan = document.getElementById('pageUrl');

    // 1. Load saved name from Chrome Storage
    // We remember the user's name so they don't have to type it every time.
    chrome.storage.sync.get(['addedBy'], (result) => {
        if (result.addedBy) {
            addedByInput.value = result.addedBy;
        }
    });

    // 2. Get current active tab info
    // We need the URL and Title of the page the user is currently looking at.
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab) {
        pageTitleSpan.textContent = tab.title || 'Unknown Title';
        pageUrlSpan.textContent = tab.url || 'Unknown URL';

        // VALIDATION: Check if this is actually an Upwork Job Page.
        // We look for 'upwork.com' and the '~' character which denotes a Job ID.
        const isUpwork = tab.url && tab.url.includes('upwork.com') && tab.url.includes('~');

        if (!isUpwork) {
            showStatus('This is not an Upwork Job Page ❌', 'error');
            saveBtn.disabled = true;
            saveBtn.textContent = "Not Upwork Job";
            saveBtn.style.backgroundColor = "#999"; // Grey out button
        }

    } else {
        showStatus('Error: Could not get tab info', 'error');
        saveBtn.disabled = true;
    }

    // 3. Handle Save Button Click
    saveBtn.addEventListener('click', async () => {
        const name = addedByInput.value.trim();

        // Validation: Name is required
        if (!name) {
            showStatus('Please enter your name first.', 'error');
            addedByInput.focus();
            return;
        }

        // Save name for next time (User Convenience)
        chrome.storage.sync.set({ addedBy: name });

        // Extract Job ID
        // Regex looks for a tilde followed by numbers (e.g., ~01923...)
        const jobIdMatch = tab.url.match(/(~[0-9]+)/);
        if (!jobIdMatch) {
            showStatus('Error: Could not extract Job ID (~...)', 'error');
            return;
        }
        const jobId = jobIdMatch[1];

        // Firebase Configuration
        const project = CONFIG.FIREBASE_PROJECT_ID;
        const key = CONFIG.FIREBASE_API_KEY;
        const collection = CONFIG.COLLECTION_NAME;

        // Firestore REST API URL
        // We use the REST API to avoid bundling the heavy Firebase SDK.
        // We set ?documentId=jobId to force the document ID to be the Job ID.
        // This is the core of our "Duplicate Prevention" strategy.
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/${collection}?documentId=${jobId}&key=${key}`;

        // Data Payload
        const payload = {
            fields: {
                url: { stringValue: tab.url },
                title: { stringValue: tab.title },
                addedBy: { stringValue: name },
                jobId: { stringValue: jobId },
                timestamp: { stringValue: new Date().toISOString() }
            }
        };

        showStatus('Saving...', 'loading');
        saveBtn.disabled = true;

        try {
            // Send POST request to Firestore
            const response = await fetch(firestoreUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                // Success!
                showStatus('Saved ✅', 'success');
                // Auto-close popup after 1 second for smooth UX
                setTimeout(() => {
                    window.close();
                }, 1000);
            } else {
                // Handle Errors
                // 409 Conflict means the document ID (Job ID) already exists.
                if (response.status === 409 || (data.error && data.error.status === 'ALREADY_EXISTS')) {
                    showStatus('Already exists ❌', 'error');
                } else {
                    console.error("Firestore Error", data);
                    showStatus(`Error: ${data.error ? data.error.message : 'Unknown'}`, 'error');
                    saveBtn.disabled = false; // Re-enable button to try again
                }
            }

        } catch (error) {
            console.error('Fetch error:', error);
            showStatus('Network Error ❌', 'error');
            saveBtn.disabled = false;
        }
    });

    // Helper function to update status UI
    function showStatus(msg, type) {
        statusDiv.textContent = msg;
        statusDiv.className = 'status ' + type;
    }

    // 4. Handle View Bids Button
    // Opens the viewer.html page to see the list of saved bids.
    const viewBtn = document.getElementById('viewBtn');
    if (viewBtn) {
        viewBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: 'viewer.html' });
        });
    }
});
