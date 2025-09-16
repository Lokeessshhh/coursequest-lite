const express = require('express');
const multer = require('multer');
const { parse } = require('csv-parse');
const db = require('../db'); // Import Postgres pool connection
const router = express.Router();

// Configure multer for single CSV file upload
// Store in memory as buffer for immediate processing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only accept CSV files
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
});

/**
 * POST /api/ingest - Upload and process CSV course data
 * Accepts CSV file upload and ingests course records into database
 */
router.post('/ingest', upload.single('csv'), async (req, res) => {
  try {
    // Step 1: Validate authentication token
    const ingestToken = req.headers['x-ingest-token'];
    const expectedToken = process.env.INGEST_TOKEN;
    
    if (!ingestToken || ingestToken !== expectedToken) {
      return res.status(401).json({
        error: 'Unauthorized: Invalid or missing ingest token'
      });
    }

    // Step 2: Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: 'No CSV file uploaded. Please upload a file using the "csv" field.'
      });
    }

    // Step 3: Initialize counters for tracking results
    let inserted = 0;
    let updated = 0;
    let failed = 0;
    const failedRows = []; // Track failed rows for debugging

    // Step 4: Parse CSV data from uploaded file buffer
    const csvData = req.file.buffer.toString();
    const records = [];

    // Use csv-parse to convert CSV string to array of objects
    await new Promise((resolve, reject) => {
      parse(csvData, {
        columns: true, // Use first row as column headers
        skip_empty_lines: true,
        trim: true,
      }, (err, data) => {
        if (err) {
          reject(err);
        } else {
          records.push(...data);
          resolve();
        }
      });
    });

    // Step 5: Process each CSV record
    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNumber = i + 2; // +2 because of header row and 0-based index

      try {
        // Step 6: Validate required fields
        const requiredFields = ['course_id', 'course_name', 'level', 'delivery_mode'];
        const missingFields = requiredFields.filter(field => !row[field] || row[field].trim() === '');

        if (missingFields.length > 0) {
          failed++;
          failedRows.push({
            row: rowNumber,
            error: `Missing required fields: ${missingFields.join(', ')}`,
            data: row
          });
          continue; // Skip this row and move to next
        }

        // Step 7: Prepare data for database insertion/update
        const courseData = {
          course_id: row.course_id.trim(),
          course_name: row.course_name.trim(),
          department: row.department ? row.department.trim() : null,
          level: row.level.trim(),
          delivery_mode: row.delivery_mode.trim(),
          credits: row.credits ? parseInt(row.credits) : null,
          duration_weeks: row.duration_weeks ? parseInt(row.duration_weeks) : null,
          rating: row.rating ? parseFloat(row.rating) : null,
          tuition_fee_inr: row.tuition_fee_inr ? parseInt(row.tuition_fee_inr) : null,
          year_offered: row.year_offered ? parseInt(row.year_offered) : null
        };

        // Step 8: Perform upsert operation (insert or update based on course_id)
        const upsertQuery = `
          INSERT INTO courses (
            course_id, course_name, department, level, delivery_mode,
            credits, duration_weeks, rating, tuition_fee_inr, year_offered
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
          )
          ON CONFLICT (course_id)
          DO UPDATE SET
            course_name = EXCLUDED.course_name,
            department = EXCLUDED.department,
            level = EXCLUDED.level,
            delivery_mode = EXCLUDED.delivery_mode,
            credits = EXCLUDED.credits,
            duration_weeks = EXCLUDED.duration_weeks,
            rating = EXCLUDED.rating,
            tuition_fee_inr = EXCLUDED.tuition_fee_inr,
            year_offered = EXCLUDED.year_offered
          RETURNING (CASE WHEN xmax = 0 THEN 'inserted' ELSE 'updated' END) as action
        `;

        const values = [
          courseData.course_id,
          courseData.course_name,
          courseData.department,
          courseData.level,
          courseData.delivery_mode,
          courseData.credits,
          courseData.duration_weeks,
          courseData.rating,
          courseData.tuition_fee_inr,
          courseData.year_offered
        ];

        // Execute the upsert query
        const result = await db.query(upsertQuery, values);
        
        // Step 9: Track whether record was inserted or updated
        if (result.rows[0].action === 'inserted') {
          inserted++;
        } else {
          updated++;
        }

      } catch (rowError) {
        // Step 10: Handle individual row processing errors
        failed++;
        failedRows.push({
          row: rowNumber,
          error: rowError.message,
          data: row
        });
        console.error(`Error processing row ${rowNumber}:`, rowError);
      }
    }

    // Step 11: Return success response with processing summary
    const response = {
      inserted,
      updated,
      failed,
      total_processed: records.length
    };

    // Include failed rows in response if there were any (for debugging)
    if (failed > 0 && failedRows.length > 0) {
      response.failed_rows = failedRows.slice(0, 10); // Limit to first 10 failed rows
    }

    res.status(200).json(response);

  } catch (error) {
    // Step 15: Handle general errors gracefully
    console.error('CSV ingest error:', error);
    
    // Return appropriate error response
    if (error.message.includes('Only CSV files are allowed')) {
      return res.status(400).json({
        error: 'Invalid file type. Please upload a CSV file.'
      });
    }

    res.status(500).json({
      error: 'Internal server error during CSV processing',
      message: error.message
    });
  }
});

module.exports = router;