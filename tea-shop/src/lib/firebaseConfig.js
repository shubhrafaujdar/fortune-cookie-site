// Firebase project used for Google sign-in (the same project the website used
// before). A Firebase web config is meant to be public; it only identifies the
// project. Access is controlled in the Firebase console:
//   Authentication → Sign-in method → Google: Enabled
//   Authentication → Settings → Authorized domains: dailyfortunecookies.com,
//   www.dailyfortunecookies.com (localhost is allowed by default)
export const firebaseConfig = {
  apiKey: 'AIzaSyCjsSEUARsqhrbsppm_E1uXf708Xw62aFM',
  authDomain: 'fortune-cookie-e873d.firebaseapp.com',
  projectId: 'fortune-cookie-e873d',
  storageBucket: 'fortune-cookie-e873d.firebasestorage.app',
  messagingSenderId: '289008586719',
  appId: '1:289008586719:web:d75e5c6b7ba72b27fe7e6a',
}
