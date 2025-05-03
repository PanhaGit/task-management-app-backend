require('dotenv').config();
const jwt = require('jsonwebtoken');

if (!process.env.ACCESS_TOKEN_KEY || !process.env.REFRESH_TOKEN_KEY) {
    throw new Error('Missing ACCESS_TOKEN_KEY or REFRESH_TOKEN_KEY in environment variables');
}

const middleware = {
    validateToken: (requiredPermissions = []) => {
        return (req, res, next) => {
            const authorization = req.headers.authorization;
            let token_from_client = null;
            if (authorization && authorization.startsWith('Bearer ')) {
                token_from_client = authorization.split(' ')[1];
            }
            if (!token_from_client) {
                return res.status(401).json({
                    message: 'Unauthorized',
                });
            }
            try {
                jwt.verify(token_from_client, process.env.ACCESS_TOKEN_KEY, (error, result) => {
                    if (error) {
                        return res.status(401).json({
                            message: 'Unauthorized',
                            error: error.message,
                        });
                    }
                    if (!result.data?.profile?.id) {
                        return res.status(401).json({
                            message: 'Invalid token payload',
                        });
                    }
                    req.current_id = result.data.profile.id;
                    req.profile = {
                        id: result.data.profile.id,
                        email: result.data.profile.email,
                        role_id: result.data.profile.role_id
                    };
                    req.permissions = result.data.permissions || [];
                    if (requiredPermissions.length > 0 && !requiredPermissions.some(perm => req.permissions.includes(perm))) {
                        return res.status(403).json({
                            message: 'Insufficient permissions',
                        });
                    }
                    next();
                });
            } catch (error) {
                return res.status(401).json({
                    message: 'Unauthorized',
                    error: error.message,
                });
            }
        };
    },

    getAccessToken: (userData) => {
        return jwt.sign(
            {
                data: userData,
                exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
            },
            process.env.ACCESS_TOKEN_KEY
        );
    },

    getRefreshToken: (userData) => {
        return jwt.sign(
            {
                data: { id: userData.profile.id },
                exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
            },
            process.env.REFRESH_TOKEN_KEY
        );
    },

    validateRefreshToken: (token) => {
        try {
            return jwt.verify(token, process.env.REFRESH_TOKEN_KEY);
        } catch (error) {
            throw new Error(`Invalid refresh token: ${error.message}`);
        }
    },
};

module.exports = middleware;