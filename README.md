# Duplicate Video Checker for Upwork

A Chrome extension that helps teams track and avoid duplicate Upwork job bids by storing URLs in a shared Google Sheet.

## 🎯 Features

- **One-Click Save**: Quickly save Upwork job URLs with a single click
- **Duplicate Detection**: Instantly know if a job has already been bid on by your team
- **Team Collaboration**: Shared Google Sheet backend for team-wide visibility
- **Job Metadata**: Automatically captures Job ID and Title
- **User Tracking**: Records who saved each URL and when

## 📁 Project Structure

```
├── extension/           # Chrome extension files
│   ├── manifest.json    # Extension configuration
│   ├── popup.html       # Extension popup UI
│   ├── popup.css        # Popup styling
│   ├── popup.js         # Popup logic
│   ├── config.js        # Configuration (URLs & tokens)
│   └── service_worker.js # Background service worker
├── gas/                 # Google Apps Script
│   └── Code.gs          # Backend script for Google Sheets
└── setup_instructions.md # Detailed setup guide
```

## 🚀 Quick Start

### Prerequisites
- Google Account
- Chrome Browser

### Installation

1. **Set up Google Sheet**
   - Create a new Google Sheet
   - Add headers: `URL`, `AddedAt`, `AddedBy`, `Job ID`, `Title`
   - Copy the Spreadsheet ID from the URL

2. **Deploy Google Apps Script**
   - Open the Sheet → Extensions → Apps Script
   - Paste the code from `gas/Code.gs`
   - Update `SPREADSHEET_ID` and `SECRET_TOKEN`
   - Deploy as Web App

3. **Configure Extension**
   - Update `extension/config.js` with your Web App URL and Secret Token

4. **Install Extension**
   - Go to `chrome://extensions`
   - Enable Developer Mode
   - Click "Load unpacked" and select the `extension` folder

📖 See [setup_instructions.md](setup_instructions.md) for detailed step-by-step instructions.

## 🔧 Usage

1. Navigate to any Upwork job page
2. Click the extension icon
3. Enter your name (first time only)
4. Click **Save URL**
   - ✅ "Saved" - URL was added to the sheet
   - ❌ "Already exists" - URL was previously saved

## 🔒 Security

- Uses a shared secret token for authentication
- All data stored in your own Google Sheet
- No external servers or third-party storage

## 👤 Author

**Yajuvendra**

## 📄 License

This project is open source and available for personal and commercial use.

---

⭐ If this extension helps your team, consider giving it a star!
