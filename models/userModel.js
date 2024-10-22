const { pool } = require('../config/dbConnection');  // PostgreSQL connection

// Function to create a new user
const createUser = async (username, email, password) => {
    try {
        const query = `
            INSERT INTO users (username, email, password)
            VALUES ($1, $2, $3)
            RETURNING id, username, email, created_at;
        `;
        const values = [username, email, password];  // Parameters to be inserted

        const result = await pool.query(query, values);
        return result.rows[0];  // Return the newly created user's details
    } catch (err) {
        console.error('Error creating user:', err);
        throw err;
    }
};

// Function to find a user by email
const findUserByEmail = async (email) => {
    try {
        const query = 'SELECT * FROM users WHERE email = $1;';
        const result = await pool.query(query, [email]);
        return result.rows[0];  // Return the user object if found
    } catch (err) {
        console.error('Error finding user by email:', err);
        throw err;
    }
};

// Function to get a user by ID
const findUserById = async (id) => {
    try {
        const query = 'SELECT * FROM users WHERE id = $1;';
        const result = await pool.query(query, [id]);
        return result.rows[0];  // Return the user object if found
    } catch (err) {
        console.error('Error finding user by ID:', err);
        throw err;
    }
};

// Function to update a user's information
const updateUser = async (id, username, email, password) => {
    try {
        const query = `
            UPDATE users
            SET username = $1, email = $2, password = $3, updated_at = NOW()
            WHERE id = $4
            RETURNING id, username, email, updated_at;
        `;
        const values = [username, email, password, id];

        const result = await pool.query(query, values);
        return result.rows[0];  // Return the updated user object
    } catch (err) {
        console.error('Error updating user:', err);
        throw err;
    }
};

// Function to delete a user
const deleteUser = async (id) => {
    try {
        const query = 'DELETE FROM users WHERE id = $1 RETURNING id;';
        const result = await pool.query(query, [id]);
        return result.rows[0];  // Return the id of the deleted user
    } catch (err) {
        console.error('Error deleting user:', err);
        throw err;
    }
};

// Function to save refresh token in the database for a user
const saveRefreshToken = async (userId, refreshToken) => {
    try {
        const query = `
            UPDATE users
            SET refresh_token = $1, updated_at = NOW()
            WHERE id = $2;
        `;
        const result = await pool.query(query, [refreshToken, userId]);
        return result.rowCount > 0;  // Return true if refresh token is successfully saved
    } catch (err) {
        console.error('Error saving refresh token:', err);
        throw err;
    }
};

// Function to get refresh token for a specific user
const getRefreshTokenByUserId = async (userId) => {
    try {
        const query = 'SELECT refresh_token FROM users WHERE id = $1;';
        const result = await pool.query(query, [userId]);
        return result.rows[0]?.refresh_token;  // Return the refresh token if found
    } catch (err) {
        console.error('Error getting refresh token by user ID:', err);
        throw err;
    }
};

// Function to remove refresh token (for logout or token rotation)
const removeRefreshToken = async (userId) => {
    try {
        const query = `
            UPDATE users
            SET refresh_token = NULL, updated_at = NOW()
            WHERE id = $1;
        `;
        const result = await pool.query(query, [userId]);
        return result.rowCount > 0;  // Return true if refresh token is successfully removed
    } catch (err) {
        console.error('Error removing refresh token:', err);
        throw err;
    }
};

module.exports = {
    createUser,
    findUserByEmail,
    findUserById,
    updateUser,
    deleteUser,
    saveRefreshToken,          // Add refresh token functions
    getRefreshTokenByUserId,
    removeRefreshToken
};
