const express = require('express');
const db = require('../db');
const router = express.Router();

/**
 * GET /api/compare?ids=1,2,3 - Compare multiple courses by their IDs
 * Accepts up to 4 course IDs and returns detailed comparison data
 */
router.get('/compare', async (req, res) => {
  try {
    // Step 1: Extract and validate IDs parameter
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({
        error: 'Missing required parameter',
        message: 'Please provide course IDs using the "ids" parameter (e.g., ?ids=1,2,3)'
      });
    }

    // Step 2: Parse and validate course IDs
    let courseIds;
    try {
      // Split by comma and trim whitespace
      courseIds = ids.split(',').map(id => id.trim()).filter(id => id !== '');
      
      if (courseIds.length === 0) {
        throw new Error('No valid IDs provided');
      }

      if (courseIds.length > 4) {
        return res.status(400).json({
          error: 'Too many course IDs',
          message: 'Maximum 4 courses can be compared at once'
        });
      }

      // Validate each ID (should be non-empty strings)
      const invalidIds = courseIds.filter(id => !id || typeof id !== 'string');
      if (invalidIds.length > 0) {
        throw new Error('Invalid course IDs format');
      }

    } catch (parseError) {
      return res.status(400).json({
        error: 'Invalid IDs format',
        message: 'Course IDs should be comma-separated (e.g., "CS101,MGT201,EE301")'
      });
    }

    // Step 3: Remove duplicates while preserving order
    const uniqueIds = [...new Set(courseIds)];

    // Step 4: Build parameterized query to prevent SQL injection
    const placeholders = uniqueIds.map((_, index) => `$${index + 1}`).join(',');
    
    const query = `
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
      WHERE course_id IN (${placeholders})
      ORDER BY 
        CASE course_id 
          ${uniqueIds.map((id, index) => `WHEN $${index + 1} THEN ${index + 1}`).join(' ')}
          ELSE ${uniqueIds.length + 1}
        END
    `;

    // Step 5: Execute query
    const result = await db.query(query, uniqueIds);
    const foundCourses = result.rows;

    // Step 6: Identify found and missing course IDs
    const foundIds = foundCourses.map(course => course.course_id);
    const missingIds = uniqueIds.filter(id => !foundIds.includes(id));

    // Step 7: Add comparison metadata for better user experience
    const comparisonMeta = {
      requested_count: uniqueIds.length,
      found_count: foundCourses.length,
      missing_count: missingIds.length,
      comparison_date: new Date().toISOString()
    };

    // Step 8: Add comparison insights if multiple courses found
    let insights = null;
    if (foundCourses.length > 1) {
      insights = generateComparisonInsights(foundCourses);
    }

    // Step 9: Return structured response
    const response = {
      courses: foundCourses,
      missing_ids: missingIds,
      meta: comparisonMeta
    };

    // Include insights if generated
    if (insights) {
      response.insights = insights;
    }

    res.json(response);

  } catch (error) {
    console.error('Error in /api/compare:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to compare courses'
    });
  }
});

/**
 * Generate comparison insights from course data
 * Provides useful comparative statistics
 */
function generateComparisonInsights(courses) {
  const insights = {
    fee_range: {
      min: null,
      max: null,
      avg: null
    },
    rating_range: {
      min: null,
      max: null,
      avg: null
    },
    credits_range: {
      min: null,
      max: null,
      avg: null
    },
    levels: [],
    delivery_modes: [],
    departments: []
  };

  // Extract numeric values, filtering out null/undefined
  const fees = courses
    .map(c => c.tuition_fee_inr)
    .filter(fee => fee !== null && fee !== undefined && !isNaN(fee));
  
  const ratings = courses
    .map(c => c.rating)
    .filter(rating => rating !== null && rating !== undefined && !isNaN(rating));
  
  const credits = courses
    .map(c => c.credits)
    .filter(credit => credit !== null && credit !== undefined && !isNaN(credit));

  // Calculate fee statistics
  if (fees.length > 0) {
    insights.fee_range.min = Math.min(...fees);
    insights.fee_range.max = Math.max(...fees);
    insights.fee_range.avg = Math.round(fees.reduce((a, b) => a + b, 0) / fees.length);
  }

  // Calculate rating statistics
  if (ratings.length > 0) {
    insights.rating_range.min = Math.min(...ratings);
    insights.rating_range.max = Math.max(...ratings);
    insights.rating_range.avg = Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;
  }

  // Calculate credits statistics
  if (credits.length > 0) {
    insights.credits_range.min = Math.min(...credits);
    insights.credits_range.max = Math.max(...credits);
    insights.credits_range.avg = Math.round((credits.reduce((a, b) => a + b, 0) / credits.length) * 10) / 10;
  }

  // Extract unique categorical values
  insights.levels = [...new Set(courses.map(c => c.level).filter(Boolean))];
  insights.delivery_modes = [...new Set(courses.map(c => c.delivery_mode).filter(Boolean))];
  insights.departments = [...new Set(courses.map(c => c.department).filter(Boolean))];

  return insights;
}

module.exports = router;