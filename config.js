const firebase= require('firebase');

const firebaseConfig = {
    apiKey: "AIzaSyBejFI4CGdEAqnOC6z7FAYgamCFZEmHtE8",
    authDomain: "vpmm-9d033.firebaseapp.com",
    projectId: "vpmm-9d033",
    storageBucket: "vpmm-9d033.appspot.com",
    messagingSenderId: "1003758134447",
    appId: "1:1003758134447:web:520356eb40daab83ede05a",
    measurementId: "G-S6KZHFJQSH"
  };
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const User = db.collection('users');
module.exports = User;