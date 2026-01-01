/**
 * Upwork Bid Checker - Configuration
 * 
 * PURPOSE:
 * Stores sensitive or environment-specific variables.
 * This keeps the main logic files clean and allows for easier updates.
 * 
 * VARIABLES:
 * - FIREBASE_API_KEY: The API key for accessing Firestore.
 * - FIREBASE_PROJECT_ID: The unique ID of the Firebase project.
 * - COLLECTION_NAME: The name of the Firestore collection where bids are stored.
 */

const CONFIG = {
  FIREBASE_API_KEY: 'AIzaSyCq66m2tn7tDUD6BEFEqMpVA2ph8DOZyQE',
  FIREBASE_PROJECT_ID: 'upwork-bid-checker-caf0f',
  COLLECTION_NAME: 'bids'
};
