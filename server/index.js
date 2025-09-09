const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', (req, res, next) => {
  const filePath = path.join(__dirname, 'uploads', req.url);

  // Check if the file exists
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
  }

  next();
}, express.static(path.join(__dirname, 'uploads')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads')); // Save files in the 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Create the 'uploads' folder if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Create PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'medivault',
  password: process.env.DB_PASSWORD || 'manmohan',
  port: process.env.DB_PORT || 5432,
});

// Test DB connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('Database connected at:', res.rows[0].now);
  }
});
// Helper function to generate patient ID
const generatePatientId = (firstName) => {
  const timestamp = Date.now();
  return `${firstName.toLowerCase()}${timestamp}`;
};

// Authentication endpoints
app.post('/api/auth/patient/register', async (req, res) => {
  try {
        const { firstName, lastName, email, password } = req.body;
    console.log('Request body:', req.body);
    
    // Check if email already exists
    const existingUser = await pool.query('SELECT * FROM patients WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Generate patient ID
    const patientId = generatePatientId(firstName);
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Insert patient
    const query = `
      INSERT INTO patients (patient_id, first_name, last_name, email, password)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, patient_id, first_name, last_name, email, created_at
    `;
    
    const values = [patientId, firstName, lastName, email, hashedPassword];
    console.log('Query:', query);
    console.log('Values:', values);
    const result = await pool.query(query, values);
    
    res.status(201).json({
      message: 'Patient registered successfully',
      patient: result.rows[0]
    });
  } catch (error) {
    console.error('Error registering patient:', error);
    res.status(500).json({ error: 'Failed to register patient' });
  }
});

app.post('/api/auth/lab/register', async (req, res) => {
  try {
        const { labName, email, password, phone, address, licenseNumber, description } = req.body;
    console.log('Request body:', req.body);
    
    // Check if email already exists
    const existingLab = await pool.query('SELECT * FROM labs WHERE email = $1', [email]);
    if (existingLab.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Insert lab
    const query = `
      INSERT INTO labs (lab_name, email, password, phone, address, license_number, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, lab_name, email, phone, license_number, created_at
    `;
    
    const values = [labName, email, hashedPassword, phone, address, licenseNumber, description];
    console.log('Query:', query);
    console.log('Values:', values);
    const result = await pool.query(query, values);
    
    res.status(201).json({
      message: 'Laboratory registered successfully',
      lab: result.rows[0]
    });
  } catch (error) {
    console.error('Error registering laboratory:', error);
    res.status(500).json({ error: 'Failed to register laboratory' });
  }
});

app.post('/api/auth/patient/login', async (req, res) => {
  try {
        const { email, password } = req.body;
    console.log('Request body:', req.body);
    
    // Find patient by email
    const result = await pool.query('SELECT * FROM patients WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const patient = result.rows[0];
    
    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, patient.password);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Return patient data (excluding password)
    const { password: _, ...patientData } = patient;
    
    res.status(200).json({
      message: 'Login successful',
      user: {
        ...patientData,
        role: 'patient'
      }
    });
  } catch (error) {
    console.error('Error logging in patient:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

app.post('/api/auth/lab/login', async (req, res) => {
  try {
        const { email, password } = req.body;
    
    // Find lab by email
    const result = await pool.query('SELECT * FROM labs WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const lab = result.rows[0];
    
    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, lab.password);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Return lab data (excluding password)
    const { password: _, ...labData } = lab;
    
    res.status(200).json({
      message: 'Login successful',
      user: {
        ...labData,
        role: 'pathlab', // Ensure role is set
      },
    });
  } catch (error) {
    console.error('Error logging in laboratory:', error);
    res.status(500).json({ error: 'Failed to login' });
  }

});

// Records API endpoints
app.get('/api/records', async (req, res) => {
  const { userRole, labId, patientId } = req.query;

  try {
    let query = '';
    let values = [];

    if (userRole === 'pathlab') {
      query = 'SELECT * FROM records WHERE lab_id = $1 ORDER BY created_at DESC';
      values = [labId];
    } else if (userRole === 'patient') {
      query = 'SELECT * FROM records WHERE patient_id = $1 ORDER BY created_at DESC';
      values = [patientId];
    }

    const result = await pool.query(query, values);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

app.get('/api/records/patient/:patientId', async (req, res) => {
  try {
    console.log('Request body:', req.body);
    const { patientId } = req.params;
    console.log('Querying patient with ID:', patientId);
    const result = await pool.query(
     'SELECT r.*, l.lab_name FROM records r LEFT JOIN labs l ON r.lab_id = l.id WHERE r.patient_id = $1 ORDER BY r.created_at DESC',
      [patientId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching patient records:', error);
    res.status(500).json({ error: 'Failed to fetch patient records' });
  }
});

app.get('/api/records/lab/:labId', async (req, res) => {
  try {
    console.log('Request body:', req.body);
    const { labId } = req.params;

    if (!labId || isNaN(labId)) {
      return res.status(400).json({ error: 'Invalid lab ID' });
    }

    const result = await pool.query(
      'SELECT r.*, p.first_name, p.last_name FROM records r JOIN patients p ON r.patient_id = p.patient_id WHERE r.lab_id = $1 ORDER BY r.created_at DESC',
      [labId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching lab records:', error);
    res.status(500).json({ error: 'Failed to fetch lab records' });
  }
});

app.post('/api/records', upload.single('file'), async (req, res) => {
  console.log('Request body:', req.body); // Debugging
  console.log('Uploaded file:', req.file); // Debugging

  try {
    const { title, date, provider, doctor, type, category, notes, owner, labId } = req.body;
    const patientId = req.body.patient_id || req.body.pati // Handle both snake_case and camelCaseentId; // Handle both snake_case and camelCase

    const fileName = req.file ? req.file.filename : null;
    const fileSize = req.file ? req.file.size : null;

    // Insert record into the database
    const query = `
      INSERT INTO records (title, date, provider, doctor, type, category, notes, file_name, file_size, owner, patient_id, lab_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `;
    const values = [title, date, provider, doctor, type, category, notes, fileName, fileSize, owner, patientId, labId];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error inserting record:', error);
    res.status(500).json({ error: 'Failed to insert record' });
  }
});

app.get('/api/records/:id', async (req, res) => {
  try {
    console.log('Request body:', req.body);
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM records WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    const record = result.rows[0];
    console.log('File path:', path.join(__dirname, 'uploads', record.file_name));
    res.status(200).json(record);
  } catch (error) {
    console.error('Error fetching record by ID:', error);
    res.status(500).json({ error: 'Failed to fetch record' });
  }
});

// Patient verification endpoint for labs
app.get('/api/patients/verify/:patientId', async (req, res) => {
  try {
        const { patientId } = req.params;
    const result = await pool.query(
      'SELECT patient_id, first_name, last_name FROM patients WHERE patient_id = $1',
      [patientId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error verifying patient:', error);
    res.status(500).json({ error: 'Failed to verify patient' });
  }
});

// Get patient by ID
app.get('/api/patients/:id', async (req, res) => {
  try {
        const { id } = req.params;
    const result = await pool.query('SELECT * FROM patients WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    const patient = result.rows[0];
    delete patient.password; // Don't send password
    res.status(200).json(patient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Failed to fetch patient data' });
  }
});

// Update patient
app.put('/api/patients/:id', async (req, res) => {
  try {
        const { id } = req.params;
    const updates = req.body;
    delete updates.password; // Don't allow password updates through this endpoint
    
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    
    const query = `
      UPDATE patients 
      SET ${setClause} 
      WHERE id = $${fields.length + 1} 
      RETURNING *
    `;
    
    const result = await pool.query(query, [...values, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    const patient = result.rows[0];
    delete patient.password;
    res.status(200).json(patient);
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ error: 'Failed to update patient data' });
  }
});

// Get lab by ID
app.get('/api/labs/:id', async (req, res) => {
  try {
    console.log('Request body:', req.body);
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM labs WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Laboratory not found' });
    }
    
    const lab = result.rows[0];
    delete lab.password;
    res.status(200).json(lab);
  } catch (error) {
    console.error('Error fetching laboratory:', error);
    res.status(500).json({ error: 'Failed to fetch laboratory data' });
  }
});

// Update lab
app.put('/api/labs/:id', async (req, res) => {
  try {
    console.log('Request body:', req.body);
    const { id } = req.params;
    const updates = req.body;
    delete updates.password;
    
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    
    const query = `
      UPDATE labs 
      SET ${setClause} 
      WHERE id = $${fields.length + 1} 
      RETURNING *
    `;
    
    const result = await pool.query(query, [...values, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Laboratory not found' });
    }
    
    const lab = result.rows[0];
    delete lab.password;
    res.status(200).json(lab);
  } catch (error) {
    console.error('Error updating laboratory:', error);
    res.status(500).json({ error: 'Failed to update laboratory data' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
