/**
 * Upwork Bid Checker - Content Script
 * 
 * PURPOSE:
 * This script runs automatically on every Upwork job page.
 * It adds a button to the page that shows:
 * - "Taken by X" (red, disabled) if the job is already claimed
 * - "Select Job Post" (green, clickable) if the job is available
 * 
 * HOW IT WORKS:
 * 1. Extracts the Job ID from the URL.
 * 2. Fetches the corresponding document from Firestore to check status.
 * 3. Injects a button into the page DOM in the top-left corner.
 * 4. If job is available, clicking the button saves it to Firestore.
 */

(async function () {
    // --- 1. JOB ID EXTRACTION ---
    // Extract the unique Upwork Job ID (e.g., ~0123456789) from the browser URL.
    const url = window.location.href;
    const jobIdMatch = url.match(/(~[0-9]+)/);

    // If we're not on a specific job page, exit the script early.
    if (!jobIdMatch) {
        return;
    }

    const jobId = jobIdMatch[1]; // Store the Job ID for Firestore lookups

    // --- 2. CONFIGURATION ---
    // Firebase credentials. These must be kept in sync with config.js.
    const FIREBASE_API_KEY = 'AIzaSyCq66m2tn7tDUD6BEFEqMpVA2ph8DOZyQE';
    const FIREBASE_PROJECT_ID = 'upwork-bid-checker-caf0f';
    const COLLECTION_NAME = 'bids';

    // Firestore REST API URL used to get a specific document using the Job ID as the document name.
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${COLLECTION_NAME}/${jobId}?key=${FIREBASE_API_KEY}`;

    // --- 3. UI INJECTION (BUTTON) ---
    // Create a fixed-position container for our custom button in the top-left corner.
    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'upwork-bid-checker-btn-container';
    Object.assign(buttonContainer.style, {
        position: 'fixed',
        top: '80px', // Positioned below Upwork's header
        left: '20px',
        zIndex: '999999', // Ensure it stays on top of page content
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    });

    // Create the button itself.
    const button = document.createElement('button');
    button.id = 'upwork-bid-checker-btn';
    button.textContent = 'Checking...'; // Initial state while fetching status

    // Applying modern, clean styles to the button.
    Object.assign(button.style, {
        padding: '12px 24px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        transition: 'all 0.3s ease',
        backgroundColor: '#718096',
        color: 'white'
    });

    buttonContainer.appendChild(button);
    document.body.appendChild(buttonContainer);

    // --- 4. INITIAL STATUS CHECK ---
    try {
        // Fetch the job status from Firestore REST API.
        const response = await fetch(firestoreUrl);

        if (response.ok) {
            // SUCCESS (200 OK): Document exists. This means the job is already claimed.
            const data = await response.json();
            const addedBy = data.fields?.addedBy?.stringValue || 'Someone';

            // Change button to "Taken by X" (Red, disabled).
            setButtonTaken(addedBy);
        } else if (response.status === 404) {
            // NOT FOUND: This means the job is available to be claimed.
            setButtonAvailable();
        } else {
            // Unexpected status code.
            button.textContent = 'Error';
            button.style.backgroundColor = '#718096';
        }

    } catch (error) {
        console.error('Bid Checker: Error checking job status', error);
        button.textContent = 'Error';
        button.style.backgroundColor = '#718096';
    }

    /**
     * Updates the UI to show the job is already claimed by someone.
     * @param {string} userName - Name of the person who claimed the job.
     */
    function setButtonTaken(userName) {
        button.textContent = `Taken by ${userName}`;
        button.disabled = true;
        button.style.cursor = 'not-allowed';
        button.style.backgroundColor = '#e53e3e'; // Red indicating it's claimed
        button.style.color = 'white';
        button.style.opacity = '0.9';
    }

    /**
     * Updates the UI to show the job is available to be claimed.
     * Attaches the event listener to handle the claiming process.
     */
    function setButtonAvailable() {
        button.textContent = 'Select Job Post';
        button.disabled = false;
        button.style.cursor = 'pointer';
        button.style.backgroundColor = '#38a169'; // Green indicating availability
        button.style.color = 'white';

        // --- HOVER EFFECTS ---
        button.addEventListener('mouseenter', () => {
            if (!button.disabled) {
                button.style.backgroundColor = '#2f855a'; // Darker green
                button.style.transform = 'scale(1.02)'; // Subtle pop effect
            }
        });
        button.addEventListener('mouseleave', () => {
            if (!button.disabled) {
                button.style.backgroundColor = '#38a169';
                button.style.transform = 'scale(1)';
            }
        });

        // --- CLICK EVENT: CLAIMING THE JOB ---
        button.addEventListener('click', async () => {
            // 1. Get the user's manual name from local storage (set via extension popup).
            chrome.storage.sync.get(['addedBy'], async (result) => {
                const userName = result.addedBy || 'Unknown';

                // Show loading state while saving.
                button.disabled = true;
                button.textContent = 'Saving...';
                button.style.backgroundColor = '#718096';
                button.style.cursor = 'wait';

                try {
                    // 2. IDENTITY TRACKING (GOOGLE ID)
                    // Request the user's Google info from the service worker.
                    // Content scripts cannot directly access chrome.identity.
                    let googleUserId = '';
                    let googleEmail = '';
                    try {
                        const userInfo = await new Promise((resolve) => {
                            chrome.runtime.sendMessage({ action: 'getUserInfo' }, resolve);
                        });
                        googleUserId = userInfo?.googleUserId || '';
                        googleEmail = userInfo?.googleEmail || '';
                    } catch (e) {
                        console.log('Could not get user info from service worker:', e);
                    }

                    // 3. FIRESTORE POST REQUEST
                    // URL designed to create a document using the Job ID (~...) as the document name.
                    const createUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${COLLECTION_NAME}?documentId=${jobId}&key=${FIREBASE_API_KEY}`;

                    const payload = {
                        fields: {
                            url: { stringValue: window.location.href },
                            title: { stringValue: document.title },
                            addedBy: { stringValue: userName },
                            jobId: { stringValue: jobId },
                            timestamp: { stringValue: new Date().toISOString() },
                            googleUserId: { stringValue: googleUserId },
                            googleEmail: { stringValue: googleEmail }
                        }
                    };

                    const saveResponse = await fetch(createUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });

                    if (saveResponse.ok) {
                        // SUCCESS: Job claimed successfully.
                        setButtonTaken(userName);
                        showToast('✅ URL Saved Successfully!', 'success');
                    } else if (saveResponse.status === 409) {
                        // CONFLICT: Another user claimed the job just before this click (Race Condition).
                        const data = await fetch(firestoreUrl).then(r => r.json());
                        const takenBy = data.fields?.addedBy?.stringValue || 'Someone';
                        setButtonTaken(takenBy);
                        showToast(`⚠️ Already taken by ${takenBy}`, 'warning');
                    } else {
                        // OTHER ERROR: e.g., Network issues or permissions.
                        const errorData = await saveResponse.json();
                        console.error('Firestore Error:', errorData);
                        button.textContent = 'Error - Retry';
                        button.disabled = false;
                        button.style.backgroundColor = '#e53e3e';
                        button.style.cursor = 'pointer';
                        showToast('❌ Failed to save. Please try again.', 'error');
                    }
                } catch (error) {
                    console.error('Save Error:', error);
                    button.textContent = 'Error - Retry';
                    button.disabled = false;
                    button.style.backgroundColor = '#e53e3e';
                    button.style.cursor = 'pointer';
                    showToast('❌ Network error. Please try again.', 'error');
                }
            });
        });
    }

    /**
     * Creates and displays a toast notification at the top center.
     * Used for real-time status updates after button clicks.
     * @param {string} message - Text to display in the toast.
     * @param {string} type - color type (success, warning, error).
     */
    function showToast(message, type) {
        const toast = document.createElement('div');
        toast.id = 'upwork-bid-checker-toast';
        toast.innerHTML = message;

        // Choose color based on type.
        let bgColor = '#718096';
        if (type === 'success') bgColor = '#38a169'; // Green
        else if (type === 'warning') bgColor = '#dd6b20'; // Orange
        else if (type === 'error') bgColor = '#e53e3e'; // Red

        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%) translateY(-20px)',
            backgroundColor: bgColor,
            color: 'white',
            padding: '14px 28px',
            borderRadius: '8px',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            fontSize: '15px',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: '999999',
            opacity: '0',
            transition: 'opacity 0.3s ease, transform 0.3s ease'
        });

        document.body.appendChild(toast);

        // Animation: slide down into view.
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        }, 100);

        // Remove after 3 seconds.
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-20px)';

            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }
})();
