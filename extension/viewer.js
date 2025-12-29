/**
 * Upwork Bid Checker - Viewer Logic
 * 
 * PURPOSE:
 * This script powers the "Recent Bids" page (viewer.html).
 * It fetches the list of saved bids from Firestore and displays them in a user-friendly table.
 * 
 * KEY FEATURES:
 * - Pagination: Loads 12 items initially, then 10 more on demand ("Load 10 More").
 * - Color Coding: Assigns a unique color to each team member ("Added By") for quick visual identification.
 *   - "Yajuvendra" has a hardcoded Light Blue color.
 *   - Others get a consistent pastel color generated from their name.
 * - Sorting: Shows the newest bids first.
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const tableBody = document.querySelector('#bidsTable tbody');
    const loadingDiv = document.getElementById('loading');
    const refreshBtn = document.getElementById('refreshBtn');
    const loadMoreBtn = document.getElementById('loadMoreBtn');

    // State Variables
    let allBids = []; // Stores all fetched bids
    let currentLimit = 12; // Initial number of rows to show

    // Event Listener: Refresh Button
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            currentLimit = 12; // Reset limit on refresh
            fetchData();
        });
    }

    // Event Listener: Load More Button
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            currentLimit += 10; // Increase limit by 10
            renderTable(); // Re-render table with new limit
        });
    }

    // Initial Fetch
    fetchData();

    /**
     * Fetches data from Firestore REST API
     */
    async function fetchData() {
        tableBody.innerHTML = '';
        loadingDiv.style.display = 'block';
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';

        const project = CONFIG.FIREBASE_PROJECT_ID;
        const key = CONFIG.FIREBASE_API_KEY;
        const collection = CONFIG.COLLECTION_NAME;

        // Firestore REST API URL
        // We fetch up to 100 documents to keep the initial load fast but substantial.
        const url = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/${collection}?key=${key}&pageSize=100`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.documents) {
                // Parse Firestore JSON format
                // Firestore returns data in a nested format: { fields: { key: { stringValue: "value" } } }
                // We map this to a cleaner object structure.
                allBids = data.documents.map(doc => {
                    const fields = doc.fields;
                    return {
                        addedBy: fields.addedBy ? fields.addedBy.stringValue : 'Unknown',
                        jobId: fields.jobId ? fields.jobId.stringValue : 'Unknown',
                        title: fields.title ? fields.title.stringValue : 'No Title',
                        timestamp: fields.timestamp ? fields.timestamp.stringValue : '1970-01-01'
                    };
                });

                // Sort by timestamp descending (Newest first)
                allBids.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

                renderTable();
            } else {
                loadingDiv.textContent = 'No bids found.';
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            loadingDiv.textContent = 'Error loading data. Check console.';
            loadingDiv.style.color = 'red';
        } finally {
            loadingDiv.style.display = 'none';
        }
    }

    /**
     * Renders the table rows based on currentLimit
     */
    function renderTable() {
        tableBody.innerHTML = ''; // Clear existing rows

        // Slice the array to get only the items we want to show
        const bidsToShow = allBids.slice(0, currentLimit);

        bidsToShow.forEach(bid => {
            const row = document.createElement('tr');

            // Format Date to local string
            const dateObj = new Date(bid.timestamp);
            const dateStr = dateObj.toLocaleString();

            // Get Color for the "Added By" badge
            const userColor = getUserColor(bid.addedBy);

            row.innerHTML = `
        <td><span class="badge" style="background-color: ${userColor.bg}; color: ${userColor.text}">${escapeHtml(bid.addedBy)}</span></td>
        <td>${escapeHtml(dateStr)}</td>
        <td class="job-id">${escapeHtml(bid.jobId)}</td>
        <td class="title-col"><a href="${getJobUrl(bid.jobId)}" target="_blank">${escapeHtml(bid.title)}</a></td>
      `;
            tableBody.appendChild(row);
        });

        // Handle "Load More" Button Visibility
        if (loadMoreBtn) {
            loadMoreBtn.style.display = 'inline-block'; // Always visible container

            if (currentLimit >= allBids.length) {
                // No more data to load
                loadMoreBtn.disabled = true;
                loadMoreBtn.textContent = 'No More Bids';
            } else {
                // More data available
                loadMoreBtn.disabled = false;
                loadMoreBtn.textContent = 'Load 10 More';
            }
        }
    }

    /**
     * Helper to construct Upwork Job URL
     */
    function getJobUrl(jobId) {
        // We use the Job ID directly. 
        // Note: Upwork URLs usually look like https://www.upwork.com/jobs/~012345...
        return `https://www.upwork.com/jobs/${jobId}`;
    }

    /**
     * Helper to escape HTML to prevent XSS
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
     * Generates a consistent color for a user name.
     * Special case for "Yajuvendra".
     */
    function getUserColor(name) {
        if (!name) return { bg: '#e2e8f0', text: '#4a5568' }; // Default gray

        // Hardcoded logic for Yajuvendra (Requested Feature)
        if (name.toLowerCase() === 'yajuvendra') {
            return { bg: '#bee3f8', text: '#2c5282' }; // Light blue
        }

        // Generate consistent color from name hash for everyone else
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }

        // Pastel colors palette
        const colors = [
            { bg: '#fed7d7', text: '#9b2c2c' }, // Red
            { bg: '#feebc8', text: '#9c4221' }, // Orange
            { bg: '#faf089', text: '#744210' }, // Yellow
            { bg: '#c6f6d5', text: '#22543d' }, // Green
            { bg: '#b2f5ea', text: '#234e52' }, // Teal
            { bg: '#e9d8fd', text: '#553c9a' }, // Purple
            { bg: '#fed7e2', text: '#702459' }, // Pink
        ];

        const index = Math.abs(hash) % colors.length;
        return colors[index];
    }
});
