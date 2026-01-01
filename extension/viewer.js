/**
 * Upwork Bid Checker - Viewer Logic
 * 
 * PURPOSE:
 * This script powers the "Recent Bids" dashboard (viewer.html).
 * It fetches the list of all saved bids from Firestore and displays them in a table.
 * 
 * KEY FEATURES:
 * - Pagination: Efficiently loads data in chunks (Loads 12, then 10 at a time).
 * - User Visualization: Color-codes user names to differentiate team members at a glance.
 * - Ownership & Security: Only showing Delete buttons for entries the current user owns.
 * - Confirmation Workflow: Requires typing "delete" to prevent accidental data loss.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    // Main table and loading indicators
    const tableBody = document.querySelector('#bidsTable tbody');
    const loadingDiv = document.getElementById('loading');
    const refreshBtn = document.getElementById('refreshBtn');
    const loadMoreBtn = document.getElementById('loadMoreBtn');

    // --- DELETE MODAL ELEMENTS ---
    // Elements related to the bid deletion confirmation modal
    const deleteModal = document.getElementById('deleteModal');
    const modalJobTitle = document.getElementById('modalJobTitle');
    const deleteConfirmInput = document.getElementById('deleteConfirmInput');
    const modalCancelBtn = document.getElementById('modalCancelBtn');
    const modalDeleteBtn = document.getElementById('modalDeleteBtn');

    // --- APPLICATION STATE ---
    // Variables to manage the application's current state
    let allBids = [];               // Full list of bids fetched from Firestore.
    let currentLimit = 12;          // Number of rows currently visible in the table.
    let currentUserGoogleId = '';   // Used to check if the user own an entry.
    let bidToDelete = null;         // Stores the object pending deletion while modal is open.

    // --- EVENT LISTENERS ---

    // Manual Refresh: Resets the display limit and re-fetches data.
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            currentLimit = 12; // Reset pagination.
            fetchData();
        });
    }

    // Pagination (Load More): Increases the display limit and re-renders the table.
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            currentLimit += 10; // Show 10 more rows.
            renderTable();      // Update the UI.
        });
    }

    // Modal Input Validation: Enables the delete button only when "delete" is typed.
    if (deleteConfirmInput) {
        deleteConfirmInput.addEventListener('input', (e) => {
            modalDeleteBtn.disabled = e.target.value.toLowerCase() !== 'delete';
        });
    }

    // Modal Actions (Cancel/Delete): Binds functions to modal buttons.
    if (modalCancelBtn) {
        modalCancelBtn.addEventListener('click', closeModal);
    }

    if (modalDeleteBtn) {
        modalDeleteBtn.addEventListener('click', performDelete);
    }

    // Close modal if user clicks the dark background overlay.
    if (deleteModal) {
        deleteModal.addEventListener('click', (e) => {
            if (e.target === deleteModal) {
                closeModal();
            }
        });
    }

    // --- INITIALIZATION ---
    // The application starts by identifying the current user, then fetching bid data.
    // This sequence ensures that user-specific actions (like delete permissions) are correctly applied.
    // STEP 1: Identify the current user.
    // STEP 2: Fetch the data once identity is known.
    getCurrentUserGoogleId().then(() => {
        fetchData();
    });

    /**
     * Identification Bridge:
     * Asks the extension Service Worker for the current user's Google ID.
     * This ID is crucial for determining which bids the user is allowed to delete.
     */
    async function getCurrentUserGoogleId() {
        try {
            const userInfo = await new Promise((resolve) => {
                chrome.runtime.sendMessage({ action: 'getUserInfo' }, resolve);
            });
            currentUserGoogleId = userInfo?.googleUserId || '';
            console.log('Dashboard: Active User ID identified.');
        } catch (e) {
            console.log('Dashboard: Identity lookup unavailable.', e);
        }
    }

    /**
     * Data Fetching:
     * Pulls the most recent 100 entries from the Firestore "bids" collection.
     * Displays loading state and handles potential errors during the fetch operation.
     */
    async function fetchData() {
        // Clear UI and show loading state.
        tableBody.innerHTML = '';
        loadingDiv.style.display = 'block';
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';

        const project = CONFIG.FIREBASE_PROJECT_ID;
        const key = CONFIG.FIREBASE_API_KEY;
        const collection = CONFIG.COLLECTION_NAME;

        // URL for fetching multiple documents via REST API.
        // pageSize=100 fetches up to 100 documents, which is a reasonable initial load.
        const url = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/${collection}?key=${key}&pageSize=100`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.documents) {
                // Formatting: Map Firestore's nested JSON structure into flat, usable JS objects.
                // Each document's fields are extracted, and the document ID is parsed from its name.
                allBids = data.documents.map(doc => {
                    const fields = doc.fields;
                    const docName = doc.name; // This contains the full path to the document.
                    return {
                        docId: docName.split('/').pop(), // Extract the ID portion (~...).
                        addedBy: fields.addedBy ? fields.addedBy.stringValue : 'Unknown',
                        jobId: fields.jobId ? fields.jobId.stringValue : 'Unknown',
                        title: fields.title ? fields.title.stringValue : 'No Title',
                        timestamp: fields.timestamp ? fields.timestamp.stringValue : '1970-01-01',
                        googleUserId: fields.googleUserId ? fields.googleUserId.stringValue : ''
                    };
                });

                // Sort: Newest entries at the top of the table for better user experience.
                allBids.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

                renderTable();
            } else {
                loadingDiv.textContent = 'Inbox is empty.';
            }
        } catch (error) {
            console.error('Fetch error:', error);
            loadingDiv.textContent = 'Error: Failed to connect to database.';
            loadingDiv.style.color = 'red';
        } finally {
            loadingDiv.style.display = 'none';
        }
    }

    /**
     * UI Rendering:
     * Converts the array of bid objects into HTML table rows.
     * Handles pagination, user-specific styling, and conditional display of delete buttons.
     */
    function renderTable() {
        tableBody.innerHTML = ''; // Clear existing rows to prevent duplicates on re-render.

        // Pagination: Only loop through the items allowed by currentLimit.
        const bidsToShow = allBids.slice(0, currentLimit);

        bidsToShow.forEach(bid => {
            const row = document.createElement('tr');

            // Format timestamp into human-readable local time.
            const dateObj = new Date(bid.timestamp);
            const dateStr = dateObj.toLocaleString();

            // Determine user color badge based on "addedBy" name.
            const userColor = getUserColor(bid.addedBy);

            // --- PERMISSION CHECK ---
            // Only show the Delete icon if:
            // 1. The user's Google ID matches the one saved with the bid.
            // 2. The bid was added TODAY (current calendar day).
            const isMe = currentUserGoogleId && bid.googleUserId === currentUserGoogleId;
            const isToday = new Date(bid.timestamp).toDateString() === new Date().toDateString();
            const canDelete = isMe && isToday;

            // Generate the HTML for the trash icon button if permitted.
            // Data attributes store necessary info for deletion (jobId, docId, title).
            const deleteCell = canDelete
                ? `<td class="delete-col">
                       <button class="delete-btn" data-job-id="${escapeHtml(bid.jobId)}" data-doc-id="${escapeHtml(bid.docId)}" data-title="${escapeHtml(bid.title)}" title="Delete this bid">
                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                               <polyline points="3 6 5 6 21 6"></polyline>
                               <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                               <line x1="10" y1="11" x2="10" y2="17"></line>
                               <line x1="14" y1="11" x2="14" y2="17"></line>
                           </svg>
                       </button>
                   </td>`
                : `<td class="delete-col"></td>`; // Empty cell if not permitted to delete.

            // Build the final row template using escaped HTML for safety.
            row.innerHTML = `
                ${deleteCell}
                <td><span class="badge" style="background-color: ${userColor.bg}; color: ${userColor.text}">${escapeHtml(bid.addedBy)}</span></td>
                <td>${escapeHtml(dateStr)}</td>
                <td class="job-id">${escapeHtml(bid.jobId)}</td>
                <td class="title-col"><a href="${getJobUrl(bid.jobId)}" target="_blank">${escapeHtml(bid.title)}</a></td>
            `;
            tableBody.appendChild(row);
        });

        // --- ATTACH DELETE HANDLERS ---
        // We re-query the newly created buttons and add listeners for the modal workflow.
        // This must be done after rows are added to the DOM.
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const button = e.currentTarget;
                const jobId = button.dataset.jobId;
                const docId = button.dataset.docId;
                const title = button.dataset.title;
                openDeleteModal(jobId, docId, title);
            });
        });

        // Toggle "Load More" logic: Disables the button if all bids are displayed.
        if (loadMoreBtn) {
            loadMoreBtn.style.display = 'inline-block'; // Ensure button is visible.

            if (currentLimit >= allBids.length) {
                loadMoreBtn.disabled = true;
                loadMoreBtn.textContent = 'No More Bids';
            } else {
                loadMoreBtn.disabled = false;
                loadMoreBtn.textContent = 'Load 10 More';
            }
        }
    }

    /**
     * Modal Workflow: Step 1 (Opening)
     * Stores the bid details for deletion, populates the modal, and makes it visible.
     */
    function openDeleteModal(jobId, docId, title) {
        bidToDelete = { jobId, docId, title }; // Store bid info globally for `performDelete`.
        modalJobTitle.textContent = title;     // Display job title in modal for context.
        deleteConfirmInput.value = '';         // Clear input field.
        modalDeleteBtn.disabled = true;        // Disable delete button initially.
        deleteModal.classList.add('active');   // Add class to show modal (CSS handles display).
        deleteConfirmInput.focus();            // Focus on input for immediate typing.
    }

    /**
     * Modal Workflow: Step 2 (Resetting/Closing)
     * Hides the modal and resets its state variables.
     */
    function closeModal() {
        deleteModal.classList.remove('active'); // Remove class to hide modal.
        bidToDelete = null;                     // Clear stored bid info.
        deleteConfirmInput.value = '';          // Clear input field.
        modalDeleteBtn.disabled = true;         // Disable delete button.
    }

    /**
     * Modal Workflow: Step 3 (Execution)
     * Performs a hard DELETE on the Firestore document using its unique ID.
     * Updates the UI upon successful deletion or shows an error.
     */
    async function performDelete() {
        if (!bidToDelete) return; // Prevent deletion if no bid is selected.

        const { docId, title } = bidToDelete;

        // UI Feedback: Show that deletion is in progress.
        modalDeleteBtn.disabled = true;
        modalDeleteBtn.textContent = 'Deleting...';

        const project = CONFIG.FIREBASE_PROJECT_ID;
        const key = CONFIG.FIREBASE_API_KEY;
        const collection = CONFIG.COLLECTION_NAME;

        // URL for absolute deletion of a single document by ID.
        const deleteUrl = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/${collection}/${docId}?key=${key}`;

        try {
            const response = await fetch(deleteUrl, { method: 'DELETE' });

            if (response.ok) {
                // SUCCESS: Remove entry from our local list and re-draw the table.
                allBids = allBids.filter(bid => bid.docId !== docId);
                renderTable();
                closeModal(); // Close the modal after successful deletion.
                console.log(`System: Confirmed deletion of ${title}`);
            } else {
                // Handle API errors during deletion.
                const errorData = await response.json();
                console.error('Delete error:', errorData);
                alert('Database Error: Deletion failed. Please try again.');
            }
        } catch (error) {
            // Handle network or other unexpected errors.
            console.error('Delete error:', error);
            alert('Connection Error: Could not delete. Please check your internet connection.');
        } finally {
            // Reset button state regardless of success or failure.
            modalDeleteBtn.textContent = 'Delete';
            modalDeleteBtn.disabled = false;
        }
    }

    /**
     * URL Generator: Links the jobId back to the actual Upwork page.
     * Constructs a direct URL to the Upwork job posting.
     */
    function getJobUrl(jobId) {
        // We use the Job ID directly. 
        // Note: Upwork URLs usually look like https://www.upwork.com/jobs/~012345...
        return `https://www.upwork.com/jobs/${jobId}`;
    }

    /**
     * Security Helper: Prevents malicious content from being injected into the DOM (XSS).
     * Escapes HTML special characters in text content before rendering.
     */
    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /**
     * Aesthetic Helper: Generates a consistent pastel color for a user's badge.
     * Special case: "Yajuvendra" gets custom blue. For others, a hash of their name
     * is used to pick a color from a predefined pastel palette, ensuring consistency.
     */
    function getUserColor(name) {
        if (!name) return { bg: '#f7fafc', text: '#4a5568' }; // Very light gray

        // Hardcoded logic for Yajuvendra (Lighter blue)
        if (name.toLowerCase() === 'yajuvendra') {
            return { bg: '#ebf8ff', text: '#2b6cb0' }; // Even lighter blue
        }

        // Generate a simple hash number from the name to consistently pick a color.
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }

        // Very light pastel colors palette for other users.
        const colors = [
            { bg: '#fff5f5', text: '#c53030' }, // Very light red
            { bg: '#fffaf0', text: '#c05621' }, // Very light orange
            { bg: '#fffff0', text: '#b7791f' }, // Very light yellow
            { bg: '#f0fff4', text: '#2f855a' }, // Very light green
            { bg: '#e6fffa', text: '#2c7a7b' }, // Very light teal
            { bg: '#faf5ff', text: '#6b46c1' }, // Very light purple
            { bg: '#fff5f7', text: '#b83280' }, // Very light pink
        ];

        const index = Math.abs(hash) % colors.length;
        return colors[index];
    }
});

