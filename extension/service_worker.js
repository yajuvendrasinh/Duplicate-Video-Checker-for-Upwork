/**
 * Upwork Bid Checker - Service Worker
 * 
 * PURPOSE:
 * The Service Worker acts as a background bridge. 
 * Since Content Scripts and Popups have limited access to sensitive Chrome APIs 
 * (like chrome.identity), they send messages here to perform those tasks.
 * 
 * KEY ROLES:
 * 1. Listening for identity requests from other parts of the extension.
 * 2. Fetching the signed-in Google profile info.
 */

// Log when the extension is updated or installed.
chrome.runtime.onInstalled.addListener(() => {
    console.log('Upwork Bid Checker Extension installed/updated.');
});

/**
 * Message Listener:
 * Listens for 'getUserInfo' action.
 * Returns the Google User ID and Email to the requester.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getUserInfo') {
        // Fetch the user's Google profile info from the Chrome browser.
        // accountStatus: 'ANY' ensures we get info even if sync is not fully on.
        chrome.identity.getProfileUserInfo({ accountStatus: 'ANY' }, (userInfo) => {
            sendResponse({
                googleUserId: userInfo?.id || '',
                googleEmail: userInfo?.email || ''
            });
        });

        // Return true to indicate that response will be sent asynchronously (since getProfileUserInfo is a callback).
        return true;
    }
});
