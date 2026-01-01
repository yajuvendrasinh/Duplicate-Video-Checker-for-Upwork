# Upwork Bid Checker

**A productivity tool for Business Development teams who use Upwork.**

## 🚀 Vision
This tool was built to solve a specific problem faced by BD teams: **Accidental Duplicate Bids**. 

When multiple team members are scouting for jobs on Upwork, it's easy to lose track of who has applied to what. This leads to:
- Wasted time reviewing jobs that are already taken.
- Embarrassing duplicate applications from the same agency.
- Inefficient workflow and communication.

**Upwork Bid Checker** eliminates this by automatically tracking every job your team views and bids on.

## ✨ Key Features
- **🟢 In-Page Job Status Button**: Every Upwork job page now features a persistent status button in the top-left corner.
  - **Green ("Select Job Post")**: The job is available to be claimed.
  - **Red ("Taken by X")**: The job is already in the database, showing who claimed it. Clicking is disabled to prevent duplicates.
- **🛡️ Secure Deletion**: Users can delete their own bids from the dashboard. To prevent accidental data loss, a confirmation modal requires typing the word "delete" to proceed.
- **🆔 Google Identity Tracking**: The extension automatically captures the signed-in Google profile ID and email of the user who claims a job, ensuring transparent ownership within the team.
- **🔔 Real-time Toast Notifications**: Instant success or error feedback at the top of the browser for all saving and deleting actions.
- **Recent Bids Viewer**: A clean, card-style dashboard to view recent bids with "Load 10 More" pagination and owner-locked delete icons.
- **Color-Coded Badges**: Each team member gets a unique color badge for easy identification.

## 🛠️ How It Works
1. **Auto-Check on Page Load**: When you open an Upwork job page, the extension instantly checks the Firestore database for that specific Job ID.
2. **Dynamic UI Injection**: It injects a status button directly into the page DOM, updating it based on whether the job is claimed or available.
3. **Identity Capture**: When saving a job, the extension communicates with a background **Service Worker** to securely fetch the user's Google account info.
4. **Duplicate Prevention**: By using the Upwork Job ID (e.g., `~0123456789`) as the unique Firestore document ID, the system makes it technically impossible to have duplicate entries.

## 📂 Project Structure
- `extension/`: Chrome Extension source code.
  - `popup.html/js`: Manual bid saving and user name setup.
  - `viewer.html/js`: "Recent Bids" dashboard with secure delete workflow.
  - `content.js`: In-page UI injection and job status detection.
  - `service_worker.js`: Background process handling Google account identity bridge.
  - `config.js`: Centralized Firebase configuration.
  - `manifest.json`: Extension permissions (identity, host permissions, etc.).

## � Version History

### **v3.5 - Layout Improvements (Current)**
- **Modern Card Layout**: Replaced the table view with a responsive, grid-based card layout for better readability.
- **UI Polish**: Enhanced visual hierarchy, spacing, and typography across the dashboard.
- **Refined Badges**: Improved user color badges for quicker team member identification.

### **v3.0 - Security & Identity**
- **Detailed Identity Tracking**: Captures and displays the Google User ID of the person who claimed the job.
- **Secure Deletion**: Added a confirmation modal demanding the user type "delete" to remove a bid, preventing accidental data loss.
- **Permission Controls**: Restricted deletion rights to the original owner of the bid.

### **v2.0 - Firebase Migration**
- **Real-Time Database**: Migrated the backend to Google Firebase Firestore for instant data syncing.
- **Cloud Stability**: Replaced the legacy GAS backend for better reliability and uptime.
- **Service Worker**: Implemented background service workers for robust API handling.

### **v1.0 - Initial Release**
- **Core Detection**: Basic job status injection on Upwork job pages.
- **Claim System**: Simple "Claim" and "Taken" status toggles.

## �👨‍💻 Developed By
[Yajuvendrasinh Gida](https://github.com/yajuvendrasinh)
