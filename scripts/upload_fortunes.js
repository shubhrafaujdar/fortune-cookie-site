const admin = require('firebase-admin');
const fs = require('fs');

// Initialize Firebase Admin SDK
// IMPORTANT: Replace this with the path to your service account key file
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const fortunes = JSON.parse(fs.readFileSync('../fortunes.json', 'utf8'));

async function uploadFortunes() {
  console.log('Starting to upload fortunes...');
  const fortunesCollection = db.collection('fortunes');

  for (const fortune of fortunes) {
    try {
      await fortunesCollection.add({ text: fortune });
      console.log(`Successfully uploaded: "${fortune}"`);
    } catch (error) {
      console.error(`Error uploading fortune: "${fortune}"`, error);
    }
  }

  console.log('Finished uploading fortunes.');
}

uploadFortunes();
