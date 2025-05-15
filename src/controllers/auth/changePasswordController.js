const User = require('../../models/user/User');
const bcrypt = require('bcryptjs');
const {logError} = require("../../utils/logError");


const changePasswordController ={
    changePassword: async (req, res) => {
        try{
            const {_id} = req.params;
            const {phone_number,email,password,confirm_password,otp_code}=req.body;

            if (!_id){
                return res.status(400).json({ message: "Id is required" });
            }
            // if(!phone_number || !email){
            //     return res.status(400).json({ message: "Phone number and Email are required" });
            // }
            // if (!phone_number){
            //     return res.status(400).json({ message: "Phone number is required" });
            // }
            if (!email){
                return res.status(400).json({ message: "Email is required" });
            }
            if (!password || !confirm_password){
                return res.status(400).json({ message: "Both password and confirm password are required." });
            }
            if (!password){
                return res.status(400).json({ message: "Password is required" });
            }
            if (!confirm_password){
                return res.status(400).json({ message: "Password is required" });
            }

            if(password !== confirm_password){
                return res.status(400).json({ message: "Passwords do not match." });
            }

            if(!otp_code){
                return res.status(400).json({ message: "Otp code is required" });
            }


            const user = await User.findOne({
                $or: [
                    { email: email || null },
                    { phone_number: phone_number || null }
                ],
                _id: _id
            });

            if(!user){
                return res.status(400).json({
                    success: false,
                    message: "User not found."
                });
            }



            const new_password = await bcrypt.hash(password, 10);

            // create a new hash password
            user.password = new_password;

            const data = await user.save();

            return res.status(200).json({
                success: true,
                data: data,
                message: "Password updated successfully."
            })

        }catch (err) {
            await logError("authPassword", err,res)
        }
    }
}

module.exports = changePasswordController