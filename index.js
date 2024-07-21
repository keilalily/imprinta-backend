const express = require('express');
const cors = require('cors');
const User = require('./config');
const app= express();

app.use(express.json());
app.use(cors());

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

// app.get("/", async (req, res) => {
//     const snapshot = await User.get();
//     const list = snapshot.docs((doc) => ({ id: doc.id, ...doc.data() }));
//     res.send(list);
// });


// app.post("/create", async (req, res) => {
//     const data = req.body;
//     await User.add(data);   

// });

// app.post("/update", async (req, res) => {
//     const id = req.bod.idy;
//     const data = req.body;
//     await User.doc(id).update(req,body);

// });

app.listen(3000, () => { console.log("Server is running on port 3000") }
);