// Google Apps Script Code for Team URL Saver

// CONFIGURATION
const SPREADSHEET_ID = '1qkteKx02BCgZwpnCn9UX0VGg0OL6D-zNlEUJwV7pxVE'; // Replace with your actual Spreadsheet ID
const SHEET_NAME = 'Sheet1';
const SECRET_TOKEN = 'PROPOSAL-123'; // Must match the one in extension config.js
const CACHE_KEY = 'JOB_IDS';
const CACHE_DURATION = 21600; // 6 hours (max allowed)

function doPost(e) {
  try {
    // Parse data
    let data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (err) {
      return createResponse({ ok: false, error: "Invalid JSON" });
    }

    // AUTH CHECK
    if (data.secret !== SECRET_TOKEN) {
      return createResponse({ ok: false, error: "Unauthorized - Invalid Secret" });
    }

    const url = data.url;
    const addedBy = data.addedBy;
    const title = data.title || "";

    if (!url || !addedBy) {
      return createResponse({ ok: false, error: "Missing required fields: url, addedBy" });
    }

    // EXTRACT JOB ID
    const jobIdMatch = url.match(/(~[0-9]+)/);
    if (!jobIdMatch) {
      return createResponse({ ok: false, error: "Not a valid Upwork Job URL (missing ~ID)" });
    }
    const jobId = jobIdMatch[1];

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    // DUPLICATE CHECK
    // Robust Loop Check on Column D (Index 4)
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const values = sheet.getRange(2, 4, lastRow - 1, 1).getValues(); // Get all IDs in Col D
      
      for (let i = 0; i < values.length; i++) {
        // Normalize: Convert to string and trim
        const existingId = String(values[i][0]).trim();
        
        if (existingId === jobId) {
           return createResponse({ 
             ok: false, 
             code: "DUPLICATE", 
             error: "Job ID already exists at Row " + (i + 2),
             input_id: jobId
           });
        }
      }
    }

    // APPEND ROW
    const timestamp = new Date().toISOString();
    // Force Job ID as text by prepending '
    sheet.appendRow([url, timestamp, addedBy, "'" + jobId, title]);

    return createResponse({ ok: true, saved_id: jobId });

  } catch (error) {
    return createResponse({ ok: false, error: error.toString() });
  }
}

function createResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return createResponse({ ok: true, message: "GET request received. Use POST to save data." });
}
