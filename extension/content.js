/**
 * Upwork Bid Checker - Content Script
 * 
 * PURPOSE:
 * This script runs automatically on every Upwork job page.
 * It checks if the job has already been saved by a teammate and shows a notification.
 * 
 * HOW IT WORKS:
 * 1. Extracts the Job ID from the URL.
 * 2. Fetches the corresponding document from Firestore.
 * 3. If found, displays a toast notification with the name of who saved it.
 */

(async function () {
    // Check if this is an Upwork job page with a Job ID
    const url = window.location.href;
    const jobIdMatch = url.match(/(~[0-9]+)/);

    if (!jobIdMatch) {
        return; // Not a job page, exit
    }

    const jobId = jobIdMatch[1];

    // NOTE: These values should match config.js
    const FIREBASE_API_KEY = 'AIzaSyCq66m2tn7tDUD6BEFEqMpVA2ph8DOZyQE';
    const FIREBASE_PROJECT_ID = 'upwork-bid-checker-caf0f';
    const COLLECTION_NAME = 'bids';

    // Firestore REST API URL to get a specific document by ID
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${COLLECTION_NAME}/${jobId}?key=${FIREBASE_API_KEY}`;

    try {
        const response = await fetch(firestoreUrl);

        if (response.ok) {
            // Document exists! Job is already taken.
            const data = await response.json();
            const addedBy = data.fields?.addedBy?.stringValue || 'Someone';

            showToast(`⚠️ Already taken by ${addedBy}`);
        }
        // If 404, the job is not in the database (available)

    } catch (error) {
        console.error('Bid Checker: Error checking job status', error);
    }

    /**
     * Creates and displays a toast notification at the top center
     */
    function showToast(message) {
        // Create toast element
        const toast = document.createElement('div');
        toast.id = 'upwork-bid-checker-toast';
        toast.innerHTML = message;

        // Style the toast - positioned at top center
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%) translateY(-20px)',
            backgroundColor: '#e53e3e', // Red for warning
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

        // Trigger animation - slide down from top
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        }, 100);

        // Remove after 4 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-20px)';

            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 4000);
    }
})();
