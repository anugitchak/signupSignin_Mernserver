const express = require('express');

const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model("User");
const jwt = require('jsonwebtoken');
// 
require('dotenv').config();
// 
const bcrypt = require('bcrypt');
const nodemailer = require("nodemailer");


//nodemailer email verification
async function mailer(receivermail,code) {
    let transporter = nodemailer.createTransport({
       host: "smtp.gmail.com",
       port: 587,
       requireTLS:true,
       secure: false, // true for 465, false for other ports
       auth: {
         user: 'karateanu12@gmail.com', // generated ethereal user
         pass: 'whorijhkmczjmhoy', // generated ethereal password
       },
     });
   
     // send mail with defined transport object
     let info = await transporter.sendMail({
       from: 'karateanu12@gmail.com', // sender address
       to: `${receivermail}`, // list of receivers
       subject: "Signup verification", // Subject line
       text: `Your verification code is ${code}`,
       html: `<b>Your verification code is ${code}</b>`, // html body
     });
   
     console.log("Message sent: %s", info.messageId);
     
     console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
     
   }
   
   //end of nodemailer email verification

router.post('/signup', async (req, res) => {
    // console.log('sent by client - ', req.body);
    const { name, email, password, dob, address } = req.body;


    const user = new User({
        name,
        email,
        password,
        dob,
        address
    })

    try {
        await user.save();
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
        res.send({ message: "User Registered Successfully", token });
    }
    catch (err) {
        console.log(err);
    }

})


router.post('/verify', (req, res) => {
    console.log('sent by client - ', req.body);
    const { name, email, password, dob, address } = req.body;
    if (!name || !email || !password || !dob || !address) {
        return res.status(422).json({ error: "Please add all the fields" });
    }


    User.findOne({ email: email })
        .then(async (savedUser) => {
            if (savedUser) {
                return res.json({ error: "Invalid Credentials" });
            }
            try {

                let VerificationCode = Math.floor(100000 + Math.random() * 900000);
                let user = [
                    {
                        name,
                        email,
                        password,
                        dob,
                        address,
                        VerificationCode
                    }
                ]
                await mailer(email, VerificationCode);
                res.send({ message: "Verification Code Sent to your Email", udata: user });
            }
            catch (err) {
                console.log(err);
            }
        })


})




router.post('/signin', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(422).json({ error: "Please add email or password" });
    }
    const savedUser = await User.findOne({ email: email })

    if (!savedUser) {
        return res.status(422).json({ error: "Invalid Credentials" });
    }

    try {
        bcrypt.compare(password, savedUser.password, (err, result) => {
            if (result) {
                console.log("Password matched");
                const token = jwt.sign({ _id: savedUser._id }, process.env.JWT_SECRET);
                res.send({ token });
            }
            else {
                console.log('Password does not match');
                return res.status(422).json({ error: "Invalid Credentials" });
            }
        })
    }
    catch (err) {
        console.log(err);
    }
})

module.exports = router;