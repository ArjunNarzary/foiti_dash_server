const { sendEmail } = require("../middlewares/sentEmail");
const JoinRequest = require("../models/JoinRequest");
const User = require("../models/User");

function randomString(length, chars) {
    var result = "";
    for (var i = length; i > 0; --i)
        result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

function generateUniqueUsername(rString) {
    return User.findOne({ username: rString })
        .then(function (account) {
            if (account) {
                rString = randomString(10, "0123456789abcdefghijklmnopqrstuvwxyz.");
                return generateUniqueUsername(rString); // <== return statement here
            }
            return rString;
        })
        .catch(function (err) {
            console.error(err);
            throw err;
        });
}

function generatePassword(){
    return randomString(8, "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ@!.");
}

exports.viewRequest = async (req, res) => {
    let errors = {};
    try{process.env.CLIENT_ORIGIN_URL
        const joinRequest = await JoinRequest.find({}).sort({ createdAt: -1 });
        if(!joinRequest){
            errors.general = "No join request found";
            return res.status(404).json({
                success: false,
                message: errors,
                joinRequest,
            });
        }

        return res.status(200).json({
            success: true,
            joinRequest
        })
    }catch (error){
        console.log(error)
        errors.general = error.message;
        return res.status(500).json({
            success: false,
            message: errors,
        })
    }
}

exports.requestAction = async (req, res) => {
    let errors = {};
    try{
        const { id, actionType } = req.body;
        if(actionType !== "approved" && actionType !== "rejected"){
            errors.general = "Invalid action type";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }

        const joinRequest = await JoinRequest.findById(id);
        if(!joinRequest){
            errors.general = "No join request found";
            return res.status(404).json({
                success: false,
                message: errors,
            });
        }

        if(joinRequest.status != "pending"){
            errors.general = "Join request is already processed";
            return res.status(400).json({
                success: false,
                message: errors,
            });
        }

        if(actionType === "approved"){

            let newUser = await User.findOne({ email: joinRequest.email });
            if(newUser){
                errors.general = "Email already exists";
                return res.status(400).json({
                    success: false,
                    message: errors,
                });
            }

            //Create new User
            let rString = randomString(10, "0123456789abcdefghijklmnopqrstuvwxyz");
            const username = await generateUniqueUsername(rString);
            const password = generatePassword();

            newUser = await User.create({
                email: joinRequest.email,
                username,
                password,
                upload_status: true,
                account_status: "silent",
                last_account_status: "silent"
            });

            //SEND EMAIL
            const message = `Welcome abord, traveller! Your login temporary password is ${password}`;
            const html = `<div style="background-color:#E45527; display:flex; padding: 25px 0">
                            <div style="margin:0 auto">
                                <p style="text-align:center; font-size: 22px; font-weight:bold; color:#fff">welcome aboard,<br>traveller!<p>
                                <a href="http://foiti.com" style="text-decoration:none; color: #fff">
                                    <div style="padding:5px 8px; font-weight:500; font-size: 12px; background-color: none; color: #fff !important; margin:0 auto; border: 1.5px solid #fff !important; border-radius: 2px; text-align:center">Get Started</div>  
                                </a>
                            </div>
                        </div>

                        <div style="padding:1.5rem 1rem; margin:1.5rem;">
                        <p style="color: #000;">Hi there,</p>
                        <p style="color: #000;">Thanks for your interest in joining the “invite only” community. We are very excited to have you onboard.</p>
                        <p style="color: #000;">Your account is ready and can be accessed using your email address and temporary password. However, we advise you to please change the password after you login.</p>
                        <p style="color: #000;">Your temporary login password is: <strong>${password}</strong></p>
                        <p style="color: #000;">Cheers,<br>The Foiti Team</p>
                        </div>`;

            //SEND EMAIL
            try {
                await sendEmail({
                    from: "Foiti <no-reply@foiti.com>",
                    email: joinRequest.email,
                    subject: "Welcome aboard, traveller!",
                    message,
                    html,
                });

                newUser.email_verified = true;
                await newUser.save();
                joinRequest.status = actionType;
                await joinRequest.save();

                return res.status(201).json({
                    success: true,
                    message: "User has been accepted successfully and email notification has been sent to the user.",
                });
            } catch (error) {
                console.log(error.message);
                errors.general = "Something went wrong while sending email";
                return res.status(500).json({
                    success: false,
                    message: errors,
                });
            }
            
        }else{
            joinRequest.status = actionType;
            await joinRequest.save();
            return res.status(201).json({
                success: true,
                message: "User has been rejected successfully.",
            });
        }

    }catch(error){
        console.log(error);
        errors.general = error.message;
        return res.status(500).json({
            success: false,
            message: errors,
        })
    }
}