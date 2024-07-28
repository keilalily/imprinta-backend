const admin = require('firebase-admin');
const serviceAccount = require('C:\\Users\\Mary\\Downloads\\vpmm-9d033-firebase-adminsdk-gdthe-de20e1c4b6.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://vpmm-9d033-default-rtdb.firebaseio.com/'
});

const db = admin.database();

module.exports = db;

// const admin = require('firebase-admin');
// const serviceAccount = require('D:/download/vpmm-9d033-firebase-adminsdk-gdthe-de20e1c4b6.json');

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: 'https://vpmm-9d033-default-rtdb.firebaseio.com/'
// });

// const db = admin.database();

// module.exports = db;
