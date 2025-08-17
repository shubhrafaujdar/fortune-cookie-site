# 🥠 Fortune Cookie

A simple and fun web application that gives you a random fortune with the click of a cookie.

## ✨ Features

*   Click on the fortune cookie to reveal a new fortune.
*   Get a new fortune by clicking the "Crack Another Fortune" button.
*   Fun and engaging animations.
*   Includes a confetti effect for a touch of celebration.

## 🚀 How to Use

1.  Open the `index.html` file in your web browser.
2.  Click on the fortune cookie to see your fortune.
3.  Click the "Crack Another Fortune" button to get another one.

## 🔥 Backend Setup (Firebase)

This project uses Firebase to store and retrieve fortunes. To run it, you'll need to set up your own Firebase project.

1.  **Create a Firebase Project:**
    *   Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
    *   Add a new Web App to your project.

2.  **Get Firebase Config:**
    *   In your Firebase project settings, find your web app's configuration object. It will look something like this:
        ```javascript
        const firebaseConfig = {
          apiKey: "...",
          authDomain: "...",
          projectId: "...",
          storageBucket: "...",
          messagingSenderId: "...",
          appId: "...",
          measurementId: "..."
        };
        ```
    *   Copy this object and paste it into the `<script>` tag at the bottom of `index.html`, replacing the placeholder configuration.

3.  **Upload Fortunes to Firestore:**
    *   In your Firebase project, enable Firestore.
    *   **Get a Service Account Key:**
        *   In your Firebase project settings, go to the "Service accounts" tab.
        *   Click "Generate new private key" and save the JSON file.
        *   Rename the downloaded file to `serviceAccountKey.json` and place it in the root directory of this project.
    *   **Install Dependencies:**
        *   Open your terminal in the project root and run:
            ```
            npm install
            ```
    *   **Run the Upload Script:**
        *   In your terminal, run the following command to upload the fortunes to your Firestore database:
            ```
            npm run upload-fortunes
            ```
    *   You can verify that the data has been uploaded by checking the Firestore data viewer in the Firebase Console.

## 📁 Files

*   `index.html`: The main HTML file for the application.
*   `style.css`: The stylesheet for the application.
*   `script.js`: The JavaScript logic for the application.
*   `fortunes.json`: A JSON file containing the fortunes.
*   `README.md`: This file.
