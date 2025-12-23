const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');

async function authUser(req, res, next) {
    const { token } = req.cookies;

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized request",
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({
                message: "Invalid token",
            })
        }

        const user = await userModel.findOne({
            _id: decoded.id
        })

        req.user = user;

        next();
    } catch (err) {
        res.status(401).json({
            message: "Unauthorized: ", err,
        })
    }
}

// Optional auth - allows both authenticated and unauthenticated requests
async function optionalAuth(req, res, next) {
    const { token } = req.cookies;

    if (!token) {
        // No token, proceed without user
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded) {
            const user = await userModel.findOne({ _id: decoded.id });
            req.user = user;
        }
    } catch (err) {
        // Invalid token, proceed without user
        req.user = null;
    }

    next();
}

module.exports = {
    authUser,
    optionalAuth
}