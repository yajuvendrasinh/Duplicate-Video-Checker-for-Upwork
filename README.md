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
- **🔔 Automatic Duplicate Alert**: When you open an Upwork job page, the extension **automatically checks** in the background if that job is already taken. If so, a **popup notification** appears at the top of the screen saying "⚠️ Already taken by [Name]" for 4 seconds.
- **One-Click Saving**: Save the job to your team's database with a single click.
- **Team Visibility**: See exactly *who* saved the job and *when*.
- **Visual Feedback**: Clear "Saved ✅" or "Already exists ❌" status indicators.
- **Recent Bids Viewer**: A clean, card-style dashboard to view recent bids with "Load 10 More" pagination.
- **Color-Coded Badges**: Each team member gets a unique color badge for easy identification.

## 🛠️ How It Works
1. **Auto-Check on Page Load**: When you open an Upwork job page, the extension instantly checks if it's already in the database.
2. **Extraction**: It extracts the unique Job ID (e.g., `~0123456789`) from the URL.
3. **Verification**: It checks a centralized Firebase Firestore database for this ID.
4. **Action**:
   - If taken, a warning popup appears immediately (no click needed).
   - If new, you can save it via the extension popup.

## 📂 Project Structure
- `extension/`: Chrome Extension source code.
  - `popup.html/js`: The extension popup UI.
  - `viewer.html/js`: The "Recent Bids" dashboard.
  - `content.js`: Auto-check script that runs on Upwork pages.
  - `config.js`: Firebase configuration.
- `gas/`: (Legacy) Google Apps Script code.

## 👨‍💻 Developed By
[Yajuvendrasinh Gida](https://github.com/yajuvendrasinh)
