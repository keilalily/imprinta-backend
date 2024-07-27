// const firebase= require('firebase');
// const admin = require('firebase-admin');
// const serviceAccount = require('C:\\Users\\Mary\\Downloads\\vpmm-9d033-firebase-adminsdk-gdthe-de20e1c4b6.json');

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: 'https://vpmm-9d033-default-rtdb.firebaseio.com/'
// });

// const firebaseConfig = {
//     apiKey: "AIzaSyBejFI4CGdEAqnOC6z7FAYgamCFZEmHtE8",
//     authDomain: "vpmm-9d033.firebaseapp.com",
//     projectId: "vpmm-9d033",
//     storageBucket: "vpmm-9d033.appspot.com",
//     messagingSenderId: "1003758134447",
//     appId: "1:1003758134447:web:520356eb40daab83ede05a",
//     measurementId: "G-S6KZHFJQSH"
//   };
  
// firebase.initializeApp(firebaseConfig);
// const db = firebase.firestore();
// const User = db.collection('users');
// module.exports = User;
//--------------------------------------------------
// const admin = require('firebase-admin');
// const serviceAccount = require('C:\\Users\\Mary\\Downloads\\vpmm-9d033-firebase-adminsdk-gdthe-de20e1c4b6.json');

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: 'https://vpmm-9d033-default-rtdb.firebaseio.com/'
// });

// const db = admin.database();

// module.exports = { admin, db };

const admin = require('firebase-admin');
const serviceAccount = require('D:/download/vpmm-9d033-firebase-adminsdk-gdthe-de20e1c4b6.json'); // Ensure you have a service account key file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://vpmm-9d033-default-rtdb.firebaseio.com/'
});

const db = admin.database();

module.exports = db;
