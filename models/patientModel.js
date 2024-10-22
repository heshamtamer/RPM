const { pool } = require('../config/dbConnection');

// Function to add a new patient
const addPatient = async (req, res) => {
  const { user_id, name, email, phone, devices } = req.body;

  try {
    // Start a transaction
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Insert the new patient
      const patientQuery = `
        INSERT INTO patients (user_id, name, email, phone)
        VALUES ($1, $2, $3, $4)
        RETURNING id;
      `;
      const patientResult = await client.query(patientQuery, [user_id, name, email, phone]);
      const patientId = patientResult.rows[0].id;

      // Insert the devices associated with the patient
      const deviceQuery = `
        INSERT INTO devices (device_id, patient_id)
        VALUES ($1, $2);
      `;
      for (const device of devices) {
        await client.query(deviceQuery, [device.device_id, patientId]);
      }

      await client.query('COMMIT');
      res.status(201).json({ message: 'Patient and devices added successfully' });

    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error while adding patient:', err);
      res.status(500).json({ message: 'Server error' });
    } finally {
      client.release();
    }

  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ message: 'Server connection error' });
  }
};
