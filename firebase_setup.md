# Firebase Setup Instructions

Since we switched to Firebase for speed, you need to ensure your database is ready.

## 1. Enable Firestore Database
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Open your project: **upwork-bid-checker-caf0f**.
3. In the left menu, click **Build > Firestore Database**.
4. Click **Create Database**.
5. Choose a location (e.g., `nam5 (us-central)` or whatever is close).
6. Start in **Test mode** (or Production, we will change rules anyway).
7. Click **Enable**.

## 2. Set Security Rules
To allow the extension to write data without a login screen, we need to open the rules.
*Note: In a real production app, we would use Firebase Auth. For this internal tool, we'll allow public read/write but you can restrict it if needed.*

1. Go to the **Rules** tab in Firestore.
2. Replace the code with this:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /bids/{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```
3. Click **Publish**.

## 3. Reload Extension
1. Go to `chrome://extensions`.
2. **Reload** the "Upwork Bid Checker".
3. Try saving a URL!

## 4. View Data
- Go to the **Data** tab in Firestore.
- You will see a collection named `bids`.
- All your saved jobs will appear there instantly.
