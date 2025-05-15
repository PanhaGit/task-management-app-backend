const User = require('../../models/user/User');
const ImagesUser = require('../../models/user/ImageUser');
const bcrypt = require('bcryptjs');
const { logError } = require('../../utils/logError');
const { uploadFile, removeFile } = require('../../utils/helper');
const generateOtpCode = require('../../utils/generate_otp_code');
const middleware = require('../../middlewares/authMiddleware');
const send_email_OTP = require('../../utils/send_email_OTP');
const otp_expires_at_10minute = require('../../utils/otp_expires_at_10minute');
const userAuthController = {
    signup: async (req, res) => {
        const { first_name, last_name, dob, phone_number, email, password } = req.body;

        try {
            // Validate required fields
            if (!email || !password) {
                return res.status(400).json({ message: 'Email and password are required' });
            }

            // Check if user exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(409).json({ message: 'User already exists' });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Handle image uploads
            let imageUserId = null;
            if (req.files) {
                const { image_profile, image_cover } = req.files;
                const images = {};

                if (image_profile) {
                    images.image_profile = image_profile.map(file => file.filename);
                }
                if (image_cover) {
                    images.image_cover = image_cover.map(file => file.filename);
                }

                if (Object.keys(images).length > 0) {
                    const newImageUser = new ImagesUser(images);
                    const savedImageUser = await newImageUser.save();
                    imageUserId = savedImageUser._id;
                }
            }

            // Generate OTP
            const otp_code = generateOtpCode();
            const otp_expires_at = otp_expires_at_10minute();

            // Create user
            const user = new User({
                first_name,
                last_name,
                dob,
                phone_number,
                email,
                password: hashedPassword,
                image_user_id: imageUserId,
                otp_code,
                otp_expires_at,
            });

            await user.save();

            // Send OTP email
            const user_name = `${first_name} ${last_name}`;
            await send_email_OTP(email, user_name, otp_code);

            // Generate tokens
            const userData = {
                profile: {
                    id: user._id,
                    email: user.email,
                    role_id: user.role_id
                },
                permissions: [],
            };

            const accessToken = middleware.getAccessToken(userData);
            const refreshToken = middleware.getRefreshToken(userData);

            // Return response without password
            const { password: _, ...userInfo } = user.toObject();

            res.status(201).json({
                message: 'User registered successfully. Please verify your email.',
                data: userInfo,
                access_token: accessToken,
                refresh_token: refreshToken,
            });

        } catch (err) {
            // Clean up uploaded files if error occurred
            if (req.files) {
                for (const fileType in req.files) {
                    for (const file of req.files[fileType]) {
                        await removeFile(file.filename).catch(console.error);
                    }
                }
            }

            await logError('userAuthController.signup', err.message);
            res.status(500).json({
                message: 'Server error during signup',
                error: process.env.NODE_ENV === 'development' ? err.message : undefined,
            });
        }
    },


    getAllUsers: async (req, res) => {
        try {
            const users = await User.find().select('-password');
            res.status(200).json({
                success: true,
                data: users,
            });
        } catch (err) {
            await logError('userAuthController.getAllUsers', err.message, res);
            return res.status(500).json({
                success: false,
                message: 'Server error while fetching users',
            });
        }
    },

    login: async (req, res) => {
        try {
            const { email, phone_number, password } = req.body;
            if (!email && !phone_number) {
                return res.status(400).json({ message: 'Email or phone number is required' });
            }

            const user = await User.findOne({
                $or: [{ email: email || null }, { phone_number: phone_number || null }],
            });
            if (!user) {
                return res.status(400).json({ message: 'Invalid login credentials' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid login credentials' });
            }

            // Generate tokens
            const userData = {
                profile: { id: user._id, email: user.email, role_id: user.role_id },
                permissions: [],
            };
            const accessToken =  middleware.getAccessToken(userData);
            const refreshToken =  middleware.getRefreshToken(userData);

            const { password: _, ...userInfo } = user._doc;
            res.status(200).json({
                message: 'Login successful',
                data: userInfo,
                access_token: accessToken,
                refresh_token: refreshToken,
            });
        } catch (err) {
            await logError('userAuthController.login', err.message, res);
            return res.status(500).json({
                success: false,
                message: 'Server error during login',
            });
        }
    },

    editAccount: async (req, res) => {
        try {
            const { _id } = req.params;
            const { first_name, last_name, dob, phone_number, email } = req.body;
            const files = req.files;

            // Validate required fields
            if (!_id) {
                return res.status(400).json({ message: 'User ID is required' });
            }

            // Prepare updates object with only provided fields
            const updates = {
                ...(first_name && { first_name }),
                ...(last_name && { last_name }),
                ...(dob && { dob }),
                ...(phone_number && { phone_number }),
                ...(email && { email }),
            };

            // Find existing user
            const existingUser = await User.findById(_id);
            if (!existingUser) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Handle image uploads and updates
            let imageUserId = existingUser.image_user_id;
            const image_profile = files?.image_profile?.[0]?.filename;
            const image_cover = files?.image_cover?.[0]?.filename;

            // Case 1: User has no existing image_user_id and is uploading new images
            if (!imageUserId && (image_profile || image_cover)) {
                const newImageUser = new ImagesUser({
                    image_profile: image_profile ? [image_profile] : [],
                    image_cover: image_cover ? [image_cover] : [],
                });
                await newImageUser.save();
                updates.image_user_id = newImageUser._id;
            }
            // Case 2: User has existing image_user_id and is updating images
            else if (imageUserId && (image_profile || image_cover)) {
                const existingImages = await ImagesUser.findById(imageUserId);

                // Delete old files before updating
                if (image_profile && existingImages.image_profile.length > 0) {
                    await removeFile(existingImages.image_profile[0]);
                }
                if (image_cover && existingImages.image_cover.length > 0) {
                    await removeFile(existingImages.image_cover[0]);
                }

                // Update with new images
                await ImagesUser.findByIdAndUpdate(imageUserId, {
                    ...(image_profile && { image_profile: [image_profile] }),
                    ...(image_cover && { image_cover: [image_cover] }),
                });
            }
            // Case 3: User wants to remove all images
            else if (req.body.remove_images === 'true' && imageUserId) {
                const existingImages = await ImagesUser.findById(imageUserId);

                // Delete all associated files
                for (const img of existingImages.image_profile) {
                    await removeFile(img);
                }
                for (const img of existingImages.image_cover) {
                    await removeFile(img);
                }

                // Remove the images_user document
                await ImagesUser.findByIdAndDelete(imageUserId);
                updates.image_user_id = null;
            }

            // Update user information
            const updatedUser = await User.findByIdAndUpdate(_id, updates, {
                new: true,
            })
                .select('-password')
                .populate('image_user_id');

            return res.status(200).json({
                success: true,
                message: 'User updated successfully',
                data: updatedUser,
            });
        } catch (err) {
            console.error('Edit account error:', err);

            // Clean up uploaded files if error occurred
            if (req.files) {
                for (const fileType in req.files) {
                    for (const file of req.files[fileType]) {
                        await removeFile(file.filename).catch((e) =>
                            console.error('Cleanup error:', e)
                        );
                    }
                }
            }

            await logError('userAuthController.editAccount', err.message, res);
            return res.status(500).json({
                success: false,
                message: 'Server error during account update',
                error: process.env.NODE_ENV === 'development' ? err.message : undefined,
            });
        }
    },

    deleteAccount: async (req, res) => {
        try {
            const { _id } = req.params;
            const { phone_number, email, password, confirm_password } = req.body;

            if (!password || !confirm_password) {
                return res.status(400).json({ message: 'Password and confirmation are required' });
            }

            if (password !== confirm_password) {
                return res.status(400).json({ message: 'Passwords do not match' });
            }

            const user = await User.findById(_id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid password' });
            }

            // Handle image cleanup
            if (user.image_user_id) {
                const images = await ImagesUser.findById(user.image_user_id);
                for (const img of images.image_profile) {
                    await removeFile(img);
                }
                for (const img of images.image_cover) {
                    await removeFile(img);
                }
                await ImagesUser.findByIdAndDelete(user.image_user_id);
            }

            await User.findByIdAndDelete(_id);

            return res.status(200).json({
                success: true,
                message: 'User account deleted successfully',
            });
        } catch (err) {
            await logError('userAuthController.deleteAccount', err.message, res);
            return res.status(500).json({
                success: false,
                message: 'Server error while deleting account',
            });
        }
    },
};

module.exports = userAuthController;