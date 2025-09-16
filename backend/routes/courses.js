const express = require('express');
const db = require('../db');
const router = express.Router();

/**
 * GET /api/courses - Search and filter courses with pagination
 * Supports comprehensive filtering and sorting options
 */
router.get('/courses', async (req, res) => {
  try {
    // Step 1: Extract and validate query parameters
    const {
      q,
      department,
      level,
      delivery_mode,
      min_fee,
      max_fee,
      min_rating,
      max_rating,
      min_credits,
      max_credits,
      min_duration_weeks,
      max_duration_weeks,
      year_offered,
      page = 1,
      per_page = 10,
      sort_by = 'course_id',
      sort_dir = 'asc'
    } = req.query;

    // Step 2: Validate numeric parameters
    const validateNumber = (value, name, min = null, max = null) => {
      if (value === undefined || value === null || value === '') return null;
      const num = parseFloat(value);
      if (isNaN(num)) {
        throw new Error(`Invalid ${name}: must be a number`);
      }
      if (min !== null && num < min) {
        throw new Error(`Invalid ${name}: must be >= ${min}`);
      }
      if (max !== null && num > max) {
        throw new Error(`Invalid ${name}: must be <= ${max}`);
      }
      return num;
    };

    const validateInteger = (value, name, min = null, max = null) => {
      if (value === undefined || value === null || value === '') return null;
      const num = parseInt(value);
      if (isNaN(num) || !Number.isInteger(parseFloat(value))) {
        throw new Error(`Invalid ${name}: must be an integer`);
      }
      if (min !== null && num < min) {
        throw new Error(`Invalid ${name}: must be >= ${min}`);
      }
      if (max !== null && num > max) {
        throw new Error(`Invalid ${name}: must be <= ${max}`);
      }
      return num;
    };

    // Validate all numeric parameters
    const validatedParams = {
      min_fee: validateNumber(min_fee, 'min_fee', 0),
      max_fee: validateNumber(max_fee, 'max_fee', 0),
      min_rating: validateNumber(min_rating, 'min_rating', 0, 5),
      max_rating: validateNumber(max_rating, 'max_rating', 0, 5),
      min_credits: validateInteger(min_credits, 'min_credits', 1),
      max_credits: validateInteger(max_credits, 'max_credits', 1),
      min_duration_weeks: validateInteger(min_duration_weeks, 'min_duration_weeks', 1),
      max_duration_weeks: validateInteger(max_duration_weeks, 'max_duration_weeks', 1),
      year_offered: validateInteger(year_offered, 'year_offered', 1900, 2100),
      page: validateInteger(page, 'page', 1),
      per_page: validateInteger(per_page, 'per_page', 1, 100)
    };

    // Step 3: Validate enum parameters
    const validLevels = ['UG', 'PG'];
    const validDeliveryModes = ['online', 'offline', 'hybrid'];
    const validSortColumns = ['rating', 'tuition_fee_inr', 'credits', 'duration_weeks', 'course_id', 'course_name', 'year_offered'];
    const validSortDirections = ['asc', 'desc'];

    if (level && !validLevels.includes(level.toUpperCase())) {
      return res.status(400).json({
        error: 'Invalid level parameter',
        message: `Level must be one of: ${validLevels.join(', ')}`
      });
    }

    if (delivery_mode && !validDeliveryModes.includes(delivery_mode.toLowerCase())) {
      return res.status(400).json({
        error: 'Invalid delivery_mode parameter',
        message: `Delivery mode must be one of: ${validDeliveryModes.join(', ')}`
      });
    }

    if (sort_by && !validSortColumns.includes(sort_by)) {
      return res.status(400).json({
        error: 'Invalid sort_by parameter',
        message: `Sort by must be one of: ${validSortColumns.join(', ')}`
      });
    }

    if (sort_dir && !validSortDirections.includes(sort_dir.toLowerCase())) {
      return res.status(400).json({
        error: 'Invalid sort_dir parameter',
        message: `Sort direction must be one of: ${validSortDirections.join(', ')}`
      });
    }

    // Step 4: Build WHERE clause dynamically
    const conditions = [];
    const queryParams = [];
    let paramCounter = 1;

    // Text search in course_name and department
    if (q && q.trim()) {
      conditions.push(`(course_name ILIKE $${paramCounter} OR department ILIKE $${paramCounter})`);
      queryParams.push(`%${q.trim()}%`);
      paramCounter++;
    }

    // Exact match filters
    if (department && department.trim()) {
      conditions.push(`department ILIKE $${paramCounter}`);
      queryParams.push(department.trim());
      paramCounter++;
    }

    if (level) {
      conditions.push(`level = $${paramCounter}`);
      queryParams.push(level.toUpperCase());
      paramCounter++;
    }

    if (delivery_mode) {
      conditions.push(`delivery_mode = $${paramCounter}`);
      queryParams.push(delivery_mode.toLowerCase());
      paramCounter++;
    }

    if (year_offered) {
      conditions.push(`year_offered = $${paramCounter}`);
      queryParams.push(validatedParams.year_offered);
      paramCounter++;
    }

    // Range filters
    if (validatedParams.min_fee !== null) {
      conditions.push(`tuition_fee_inr >= $${paramCounter}`);
      queryParams.push(validatedParams.min_fee);
      paramCounter++;
    }

    if (validatedParams.max_fee !== null) {
      conditions.push(`tuition_fee_inr <= $${paramCounter}`);
      queryParams.push(validatedParams.max_fee);
      paramCounter++;
    }

    if (validatedParams.min_rating !== null) {
      conditions.push(`rating >= $${paramCounter}`);
      queryParams.push(validatedParams.min_rating);
      paramCounter++;
    }

    if (validatedParams.max_rating !== null) {
      conditions.push(`rating <= $${paramCounter}`);
      queryParams.push(validatedParams.max_rating);
      paramCounter++;
    }

    if (validatedParams.min_credits !== null) {
      conditions.push(`credits >= $${paramCounter}`);
      queryParams.push(validatedParams.min_credits);
      paramCounter++;
    }

    if (validatedParams.max_credits !== null) {
      conditions.push(`credits <= $${paramCounter}`);
      queryParams.push(validatedParams.max_credits);
      paramCounter++;
    }

    if (validatedParams.min_duration_weeks !== null) {
      conditions.push(`duration_weeks >= $${paramCounter}`);
      queryParams.push(validatedParams.min_duration_weeks);
      paramCounter++;
    }

    if (validatedParams.max_duration_weeks !== null) {
      conditions.push(`duration_weeks <= $${paramCounter}`);
      queryParams.push(validatedParams.max_duration_weeks);
      paramCounter++;
    }

    // Step 5: Build final WHERE clause
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Step 6: Get total count for pagination
    const countQuery = `SELECT COUNT(*) FROM courses ${whereClause}`;
    const countResult = await db.query(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0].count);

    // Step 7: Calculate pagination
    const totalPages = Math.ceil(totalCount / validatedParams.per_page);
    const offset = (validatedParams.page - 1) * validatedParams.per_page;

    // Step 8: Build main query with pagination and sorting
    const orderClause = `ORDER BY ${sort_by} ${sort_dir.toUpperCase()}`;
    const limitClause = `LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;
    
    const mainQuery = `
      SELECT 
        course_id,
        course_name,
        department,
        level,
        delivery_mode,
        credits,
        duration_weeks,
        rating,
        tuition_fee_inr,
        year_offered
      FROM courses 
      ${whereClause}
      ${orderClause}
      ${limitClause}
    `;

    const mainQueryParams = [...queryParams, validatedParams.per_page, offset];

    // Step 9: Execute main query
    const result = await db.query(mainQuery, mainQueryParams);

    // Step 10: Return formatted response
    res.json({
      data: result.rows,
      meta: {
        total_count: totalCount,
        page: validatedParams.page,
        per_page: validatedParams.per_page,
        total_pages: totalPages,
        has_next_page: validatedParams.page < totalPages,
        has_prev_page: validatedParams.page > 1
      }
    });

  } catch (error) {
    console.error('Error in /api/courses:', error);
    
    // Return validation errors as 400, others as 500
    if (error.message.includes('Invalid')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch courses'
    });
  }
});

module.exports = router;