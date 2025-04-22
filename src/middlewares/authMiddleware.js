require('dotenv').config();
const jwt = require('jsonwebtoken');

// Validate environment variables
if (!process.env.ACCESS_TOKEN_KEY || !process.env.REFRESH_TOKEN_KEY) {
    throw new Error('Missing ACCESS_TOKEN_KEY or REFRESH_TOKEN_KEY in environment variables');
}

const middleware = {
    validateToken: (requiredPermissions = []) => {
        return async (req, res, next) => {
            try {
                // Get token from header
                const authHeader = req.headers.authorization;
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    return res.status(401).json({
                        success: false,
                        message: 'Authentication token required',
                    });
                }

                const token = authHeader.split(' ')[1];

                // Verify token
                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);

                // Check token expiration
                if (decoded.exp && Date.now() >= decoded.exp * 1000) {
                    return res.status(401).json({
                        success: false,
                        message: 'Token expired',
                    });
                }

                // Attach user data to request
                req.current_id = decoded.data.profile.id;
                req.profile = decoded.data.profile;
                req.auth = decoded.data.profile;
                req.permissions = decoded.data.permissions || [];

                // Check permissions if required
                if (requiredPermissions.length > 0) {
                    const hasPermission = requiredPermissions.some((perm) =>
                        req.permissions.includes(perm)
                    );
                    if (!hasPermission) {
                        return res.status(403).json({
                            success: false,
                            message: 'Insufficient permissions',
                        });
                    }
                }

                next();
            } catch (error) {
                console.error('Authentication error:', error.message);

                let message = 'Invalid token';
                if (error.name === 'TokenExpiredError') {
                    message = 'Token expired';
                } else if (error.name === 'JsonWebTokenError') {
                    message = 'Invalid token';
                }

                res.status(401).json({
                    success: false,
                    message: message,
                });
            }
        };
    },

    getAccessToken: async (userData) => {
        return jwt.sign(
            {
                data: userData,
                exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
            },
            process.env.ACCESS_TOKEN_KEY
        );
    },

    getRefreshToken: async (userData) => {
        return jwt.sign(
            {
                data: { id: userData.profile.id },
                exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
            },
            process.env.REFRESH_TOKEN_KEY
        );
    },

    validateRefreshToken: async (token) => {
        try {
            return jwt.verify(token, process.env.REFRESH_TOKEN_KEY);
        } catch (error) {
            throw error;
        }
    },
};

module.exports = middleware;