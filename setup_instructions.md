# Setup Instructions

## 1. Google Sheet Setup
1. Create a new Google Sheet.
2. Rename the first sheet to `Sheet1` (if it isn't already).
3. Add headers in the first row:
   - **A1**: URL
   - **B1**: AddedAt
   - **C1**: AddedBy
   - **D1**: Job ID
   - **E1**: Title
4. Copy the **Spreadsheet ID** from the URL (the long string between `/d/` and `/edit`).

## 2. Google Apps Script Setup
1. Open the Google Sheet.
2. Go to **Extensions > Apps Script**.
3. Delete any existing code in `Code.gs` and paste the content of `gas/Code.gs` (provided in the `gas` folder).
4. **IMPORTANT**: Update the `SPREADSHEET_ID` constant at the top of `Code.gs` with your ID from Step 1.
5. Update `SECRET_TOKEN` with a secure random string (e.g., "my-team-secret-123").

## 3. Deploy Web App
1. Click **Deploy > New deployment**.
2. Select type: **Web app**.
3. Description: "v1".
4. **Execute as**: "Me" (your account).
5. **Who has access**: "Anyone" (or "Anyone within [Your Domain]" if you are on Workspace).
   - *Note: "Anyone" is easiest for testing. If you use "Anyone within domain", ensure all extension users are logged into Chrome with their domain account.*
6. Click **Deploy**.
7. **Authorize** the script when prompted.
8. Copy the **Web App URL** (ends in `/exec`).

## 4. Configure Extension
1. Open `extension/config.js`.
2. Paste your **Web App URL** into `WEB_APP_URL`.
3. Paste your **Secret Token** into `SECRET_TOKEN` (must match the one in Apps Script).
4. Save the file.

## 5. Install Extension
1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked**.
4. Select the `extension` folder.

## 6. Testing
1. Open any webpage (e.g., google.com).
2. Click the extension icon.
3. Enter your name (first time only).
4. Click **Save URL**.
5. You should see "Saved ✅".
6. Check your Google Sheet; the row should be added.
7. Click **Save URL** again.
8. You should see "Already exists ❌".

## Admin Notes
- **Rotating Secret**: Change `SECRET_TOKEN` in `Code.gs`, redeploy (New deployment!), then update `config.js` in the extension and distribute the update to users.
- **Troubleshooting CORS**: If you see CORS errors, ensure `doPost` returns `ContentService.createTextOutput(...)` and that you are NOT sending custom headers (we moved auth to the body to avoid preflight issues).
- **Permissions**: If users see "Network/Auth Error", check if the Web App is deployed as "Execute as: Me" and "Who has access" is correct.
