const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connectToDatabase = require('../models/db');
const router = express.Router();
const dotenv = require('dotenv');
const pino = require('pino');

const logger = pino();
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

router.post('/register', async (req, res) => {
    console.log("REGISTER route hit with body:", req.body);
    try{
        const db = await connectToDatabase();
        console.log("Connected to DB:", !!db);
        const collection = db.collection('users');

        

        
        const salt = await bcryptjs.genSalt(10);
        const hash = await bcryptjs.hash(req.body.password, salt);
        console.log("Password hashed successfully");

        const email = req.body.email;

        const newUser = await collection.insertOne({
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            password: hash,
            createdAt: new Date(),
        });
    
        const payload = {
            user: {
                id: newUser.insertedId,
            },
        };
    
        const authtoken = jwt.sign(payload, JWT_SECRET);
        console.log("JWT created");

        logger.info("User registered successfully");
        res.json({ authtoken, email });

        
    }
    catch (e) {
        console.log("REGISTER ERROR:", e)
        return res.status(500).json('Internal server error');
    }
    

});

module.exports = router;