const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/dbConnection"); // PostgreSQL connection

// @desc Register a new user
// @route POST /api/users/register
// @access public
const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        res.status(400);
        throw new Error("All fields are mandatory!");
    }

    try {
        // Check if the user already exists
        const userCheckQuery = 'SELECT * FROM users WHERE email = $1';
        const userCheckResult = await pool.query(userCheckQuery, [email]);

        if (userCheckResult.rows.length > 0) {
            res.status(400);
            throw new Error("User already exists");
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("The hashed password is:", hashedPassword);

        // Insert the new user into the database
        const userInsertQuery = `
            INSERT INTO users (username, email, password, created_at, updated_at)
            VALUES ($1, $2, $3, NOW(), NOW())
            RETURNING id, email;
        `;
        const userInsertResult = await pool.query(userInsertQuery, [username, email, hashedPassword]);

        if (userInsertResult.rows.length > 0) {
            const user = userInsertResult.rows[0];
            res.status(201).json({
                id: user.id,
                email: user.email
            });
        } else {
            res.status(400);
            throw new Error("Invalid user data");
        }
    } catch (err) {
        res.status(500).json({ message: "Error registering user" });
    }
});

// @desc Login a user
// @route POST /api/users/login
// @access public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400);
        throw new Error("All fields are mandatory!");
    }

    try {
        // Find the user by email
        const userQuery = 'SELECT * FROM users WHERE email = $1';
        const userResult = await pool.query(userQuery, [email]);

        if (userResult.rows.length > 0) {
            const user = userResult.rows[0];

            // Compare password
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                // Generate access token (short-lived)
                const accessToken = jwt.sign(
                    {
                        user: {
                            username: user.username,
                            email: user.email,
                            id: user.id
                        }
                    },
                    process.env.ACCESS_TOKEN_SECRET,
                    { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION } // Access token lifespan
                );

                // Generate refresh token (long-lived)
                const refreshToken = jwt.sign(
                    { id: user.id },
                    process.env.REFRESH_TOKEN_SECRET,
                    { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION } // Refresh token lifespan
                );

                // Store refresh token in the database
                const refreshTokenQuery = 'UPDATE users SET refresh_token = $1 WHERE id = $2';
                await pool.query(refreshTokenQuery, [refreshToken, user.id]);

                // Return both tokens to the client
                res.status(200).json({ accessToken, refreshToken });
            } else {
                res.status(401);
                throw new Error("Invalid email or password");
            }
        } else {
            res.status(401);
            throw new Error("Invalid email or password");
        }
    } catch (err) {
        console.error("Error logging in user:", err);  // Log the exact error for debugging
        res.status(500).json({ message: "Error logging in user", error: err.message });
    }
});


// @desc Get current user info
// @route GET /api/users/current
// @access private
const currentUser = asyncHandler(async (req, res) => {
    res.json(req.user);
});


// @desc Refresh the access token
// @route POST /api/users/refresh-token
// @access public
const refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        res.status(401);
        throw new Error("Refresh token is required!");
    }

    try {
        // Check if the refresh token exists in the database
        const refreshTokenQuery = 'SELECT * FROM users WHERE refresh_token = $1';
        const refreshTokenResult = await pool.query(refreshTokenQuery, [refreshToken]);

        if (refreshTokenResult.rows.length === 0) {
            res.status(403);
            throw new Error("Invalid refresh token!");
        }

        const user = refreshTokenResult.rows[0];

        // Verify the refresh token
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
            if (err || user.id !== decoded.id) {
                res.status(403);
                throw new Error("Invalid refresh token!");
            }

            // Generate new access token
            const newAccessToken = jwt.sign(
                {
                    user: {
                        username: user.username,
                        email: user.email,
                        id: user.id
                    }
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION } // Access token lifespan
            );

            res.status(200).json({ accessToken: newAccessToken });
        });
    } catch (err) {
        res.status(500).json({ message: "Error refreshing token" });
    }
});


module.exports = {
    registerUser,
    loginUser,
    currentUser,
    refreshToken
};
