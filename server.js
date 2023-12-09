const express = require("express");
const mongoose = require("mongoose");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = '<insert secret key from txt file>';


app.use(cors({ origin: 'https://www.myzoubuddy.app' }));
app.use(express.json());

const mongoDBAtlasUri = "mongodb+srv://MyzouBuddy:<insertpasswordintextfile>@mongodbcapatl.jdsn3em.mongodb.net/mongodbcap";

mongoose.connect(mongoDBAtlasUri)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch((error) => console.error('Error connecting to MongoDB Atlas:', error));

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    isVerified: { type: Boolean, default: false },
    verificationToken: String,
    classes: { type: [String], default: [] }, 
});


const Userdata = mongoose.model('Userdata', userSchema, 'userdata');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'mystudybudyapp@gmail.com',
        pass: 'imfm ogwm mjic tcmk'
    }
});

app.get('/', (req, res) => {
    res.send('Welcome to the server!');
});

app.post("/register", async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log("Received registration request for username:", username);

        const domain = username.split('@')[1];

        if (!['umsystem.edu', 'mail.missouri.edu', 'health.missouri.edu', 'mail.mizzou.edu', 'missouri.edu', 'mail.umsl.edu', 'mailmissouri.mail.onmicrosoft.com'].includes(domain)) {
            return res.status(400).json({ error: "Registration is only allowed for specific university email domains" });
        }

        const existingUser = await Userdata.findOne({ username });
        if (existingUser) {
            console.log("User already exists:", existingUser);
            return res.status(400).json({ error: "Username already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const verificationToken = jwt.sign({ username }, JWT_SECRET);
        const directLink = `https://api.myzoubuddy.app/verify/${verificationToken}`;

        console.log("Verification token created:", verificationToken);
        console.log("Verification token:", verificationToken);
        const mailOptions = {
            from: 'Mystudybudyapp@gmail.com',
            to: username,
            subject: 'Email Verification',
            text: `To verify your email, please click on the following link: ${directLink}\n\n` 
        };

        
        transporter.sendMail(mailOptions, async (error, info) => {
            if (error) {
                console.error("Email verification error:", error);
                return res.status(500).json({ error: "Error sending verification email, invalid email" });
            }
            console.log('Verification email sent:', info.response);

            
            const newUser = new Userdata({ username, password: hashedPassword, verificationToken, classes: [] });
            await newUser.save();
            res.status(201).json({ message: "User registered successfully. Check your email for verification instructions." });
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


app.get("/verify/:token", async (req, res) => {
    console.log("Received token:", req.params.token);
    const { token } = req.params;
    console.log("Token for verification:", token);

    try {
        console.log("Attempting to decode token");
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log("Decoded token:", decoded);

        const user = await Userdata.findOneAndUpdate(
            { username: decoded.username, verificationToken: token }, 
            { $set: { isVerified: true } },
            { new: true }
        );

        if (!user) {
            console.log("No user found for verification token:", token);
            return res.status(400).json({ error: "Invalid verification token" });
        }

        console.log("User's email verified successfully:", user.username);
        return res.redirect('https://www.myzoubuddy.app/login.html');
        
    } catch (error) {
        console.error("Verification error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});


app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await Userdata.findOne({ username });
        console.log("User found:", user);
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log("Password valid:", isPasswordValid);
        if (isPasswordValid) {
            console.log("User is verified:", user.isVerified);
            if (user.isVerified) {
                const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
                return res.status(200).json({ message: "Login successful", token });
            } else {
                return res.status(401).json({ error: "Email not verified. Please check your email for verification instructions." });
            }
        } else {
            return res.status(401).json({ error: "Invalid credentials" });
        }
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post("/addclass", authenticateToken, async (req, res) => {
    const { className } = req.body;

    try {
        const user = req.user; 
        user.classes.push(className);
        await user.save();

        res.status(200).json({ message: "Class added successfully" });
    } catch (error) {
        console.error("Error adding class:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get("/getclasses", authenticateToken, (req, res) => {
    const user = req.user; 
    res.status(200).json({ classes: user.classes });
});

app.post("/removeclass", authenticateToken, async (req, res) => {
    const { className } = req.body;

    try {
        const user = req.user; 
        const indexToRemove = user.classes.indexOf(className);

        if (indexToRemove !== -1) {
            user.classes.splice(indexToRemove, 1);
            await user.save();a
            res.status(200).json({ message: "Class removed successfully" });
        } else {
            res.status(400).json({ error: "Class not found in user's classes" });
        }
    } catch (error) {
        console.error("Error removing class:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

function authenticateToken(req, res, next) {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
        if (err) return res.sendStatus(403);

        try {
            const user = await Userdata.findOne({ username: decoded.username });
            if (!user) return res.sendStatus(403); 

            req.user = user;
            next();
        } catch (error) {
            console.error("Error fetching user:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    });
}

app.get("/findMatch", authenticateToken, async (req, res) => {
    try {
        const currentUser = req.user;
        const users = await Userdata.find({ 
            classes: { $in: currentUser.classes },
            username: { $ne: currentUser.username }
        });
        
        if (users.length > 0) {
            const matchedUser = users[0];
            const matchingClasses = matchedUser.classes.filter(cls => 
                currentUser.classes.includes(cls));
            
            res.json({ match: matchedUser.username, matchingClasses });
        } else {
            res.json({ match: null, matchingClasses: [] });
        }
    } catch (error) {
        console.error("Error finding match:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
