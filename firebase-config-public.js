/* Public Firebase web config (same project as app.js). Safe to ship in the client.
 *
 * Firestore: checkout writes "payments" and test rows "checkoutTests". Dev example:
 *   match /payments/{id} { allow create: if true; allow read: if false; }
 *   match /checkoutTests/{id} { allow create: if true; allow read: if false; }
 * Tighten before production.
 */
window.__CARDIFY_FIREBASE_CONFIG__ = {
  apiKey: "AIzaSyBffpkUGb2z8J1o2xp8IsnFDDt1X0yxdPI",
  authDomain: "cardify-4ee15.firebaseapp.com",
  projectId: "cardify-4ee15",
  storageBucket: "cardify-4ee15.firebasestorage.app",
  messagingSenderId: "544742568264",
  appId: "1:544742568264:web:45d25efdee5bd4dbf7c37d",
  measurementId: "G-940GHMF49K"
};
