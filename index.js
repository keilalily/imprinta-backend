const express = require('express');
const cors = require('cors');
const User = require('./config');
const app= express();

app.use(express.json());
app.use(cors());

const functions = require('firebase-functions');
const { calculateTotalPrint } = require('./services/totalSalesService');

exports.updateTotalPrint = functions.firestore
    .document('dailyReportSales/{docId}')
    .onWrite(async (change, context) => {
        try {
            console.log('Triggering Cloud Function...');
            const result = await calculateTotalPrint();
            console.log('Total Print Amount:', result);
            return result;
        } catch (error) {
            console.error('Error in Cloud Function:', error);
        }
    });
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'https://<your-database-name>.firebaseio.com'
});

const db = admin.firestore();
const User = db.collection('users');

app.post("/create", async (req, res) => {
    const { email, username, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);

    const newUser = {
        email,
        username,
        password: hashedPassword
    };

    try {
        await User.add(newUser);
        res.status(201).send({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).send({ message: 'Error creating user', error });
    }
});

app.listen(3000, () => { console.log("Server is running on port 3000") }
);