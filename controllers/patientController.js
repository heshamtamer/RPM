const asyncHandler = require("express-async-handler");
const { pool } = require("../config/dbConnection"); // PostgreSQL connection

// @desc Get all patients
// @route GET /api/patients
// @access private
const getPatients = asyncHandler(async (req, res) => {
    try {
        const query = 'SELECT * FROM patients WHERE user_id = $1';
        const values = [req.user.id];
        const result = await pool.query(query, values);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ message: "Error fetching patients" });
    }
});

// @desc Get patient by ID
// @route GET /api/patients/:id
// @access private
const getPatient = asyncHandler(async (req, res) => {
    try {
        const query = 'SELECT * FROM patients WHERE id = $1';
        const values = [req.params.id];
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            res.status(404);
            throw new Error("Patient not found");
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: "Error fetching patient" });
    }
});

// @desc Create new patient
// @route POST /api/patients
// @access private
const creatPatient = asyncHandler(async (req, res) => {
    const { name, email, phone } = req.body;

    if (!name || !email || !phone) {
        res.status(400);
        throw new Error("All fields are mandatory!");
    }

    try {
        const query = `
            INSERT INTO patients (name, email, phone, user_id, created_at, updated_at)
            VALUES ($1, $2, $3, $4, NOW(), NOW())
            RETURNING *;
        `;
        const values = [name, email, phone, req.user.id];
        const result = await pool.query(query, values);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: "Error creating patient" });
    }
});

// @desc Update patient
// @route PUT /api/patients/:id
// @access private
const updatePatient = asyncHandler(async (req, res) => {
    const { name, email, phone } = req.body;

    try {
        // Check if the patient exists and belongs to the user
        const patientQuery = 'SELECT * FROM patients WHERE id = $1';
        const patientResult = await pool.query(patientQuery, [req.params.id]);

        if (patientResult.rows.length === 0) {
            res.status(404);
            throw new Error("Patient not found");
        }

        if (patientResult.rows[0].user_id !== req.user.id) {
            res.status(403);
            throw new Error("User does not have permission to update this patient");
        }

        // Update the patient
        const updateQuery = `
            UPDATE patients
            SET name = $1, email = $2, phone = $3, updated_at = NOW()
            WHERE id = $4
            RETURNING *;
        `;
        const values = [name, email, phone, req.params.id];
        const result = await pool.query(updateQuery, values);

        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: "Error updating patient" });
    }
});

// @desc Delete patient
// @route DELETE /api/patients/:id
// @access private
const deletePatient = asyncHandler(async (req, res) => {
    try {
        // Check if the patient exists and belongs to the user
        const patientQuery = 'SELECT * FROM patients WHERE id = $1';
        const patientResult = await pool.query(patientQuery, [req.params.id]);

        if (patientResult.rows.length === 0) {
            res.status(404);
            throw new Error("Patient not found");
        }

        if (patientResult.rows[0].user_id !== req.user.id) {
            res.status(403);
            throw new Error("User does not have permission to delete this patient");
        }

        // Delete the patient
        const deleteQuery = 'DELETE FROM patients WHERE id = $1 RETURNING *';
        const result = await pool.query(deleteQuery, [req.params.id]);

        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: "Error deleting patient" });
    }
});

// @desc Add device to a patient
// @route POST /api/patients/:patient_id/device
// @access private
const addDeviceToPatient = asyncHandler(async (req, res) => {
    const { device_id } = req.body;

    if (!device_id) {
        return res.status(400).json({ message: "Device ID is required" });
    }

    try {
        // Check if the patient exists
        const patientQuery = 'SELECT * FROM patients WHERE id = $1';
        const patientResult = await pool.query(patientQuery, [req.params.patient_id]);

        if (patientResult.rows.length === 0) {
            res.status(404).json({ message: "Patient not found" });
            return;
        }

        // Add device to patient
        const insertDeviceQuery = `
            INSERT INTO devices (device_id, patient_id)
            VALUES ($1, $2)
            RETURNING *;
        `;
        const result = await pool.query(insertDeviceQuery, [device_id, req.params.patient_id]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: "Error adding device to patient" });
    }
});

// @desc Remove device from a patient
// @route DELETE /api/patients/:patient_id/device
// @access private
const removeDeviceFromPatient = asyncHandler(async (req, res) => {
    const { device_id } = req.body;

    if (!device_id) {
        return res.status(400).json({ message: "Device ID is required" });
    }

    try {
        const deleteDeviceQuery = `
            DELETE FROM devices
            WHERE device_id = $1 AND patient_id = $2
            RETURNING *;
        `;
        const result = await pool.query(deleteDeviceQuery, [device_id, req.params.patient_id]);

        if (result.rows.length === 0) {
            res.status(404).json({ message: "Device not found for this patient" });
            return;
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: "Error removing device from patient" });
    }
});

module.exports = {
    getPatients,
    getPatient,
    creatPatient,
    updatePatient,
    deletePatient,
    addDeviceToPatient,
    removeDeviceFromPatient
};
