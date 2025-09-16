const express = require('express');
const db = require('../db');
const router = express.Router();

/**
 * POST /api/ask - Natural language course search
 * Parses user questions and converts them to database queries
 */
router.post('/ask', async (req, res) => {
  try {
    const { question, page = 1, per_page = 10 } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Missing question' });
    }

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(per_page) || 10)); // Limit max per_page to 100

    console.log('Processing question:', question);
    console.log('Pagination - Page:', pageNum, 'Per page:', perPage);

    // Parse natural language query into structured filters
    const filters = parseNaturalLanguageQuery(question);
    console.log('Parsed filters:', filters);

    // Execute filtered query with pagination
    const result = await executeFilteredQuery(filters, pageNum, perPage);

    res.json({
      data: result.data,
      meta: result.meta
    });
  } catch (err) {
    console.error('Error in /api/ask:', err);
    res.status(500).json({ 
      error: 'Server error', 
      details: err.message,
      question: req.body.question 
    });
  }
});

/**
 * Parse natural language query into structured filters
 * Implements rule-based parsing for various query types
 */
function parseNaturalLanguageQuery(question) {
  const filters = {};

  // Convert to lowercase for easier pattern matching
  const lowerQuestion = question.toLowerCase().trim();
  let remainingWords = lowerQuestion.split(/\s+/).filter(word => word.length > 0);

  console.log('Original question:', question);
  console.log('Lowercase question:', lowerQuestion);

  // Step 1: Detect and extract delivery mode
  const deliveryModePatterns = {
    'online': ['online', 'remote', 'virtual', 'digital', 'web-based', 'internet', 'distance'],
    'offline': ['offline', 'physical', 'in-person', 'campus', 'classroom', 'face-to-face', 'onsite', 'on-campus'],
    'hybrid': ['hybrid', 'blended', 'mixed', 'combined', 'flexible']
  };

  for (const [mode, patterns] of Object.entries(deliveryModePatterns)) {
    if (patterns.some(pattern => lowerQuestion.includes(pattern))) {
      filters.delivery_mode = mode;
      console.log('Found delivery mode:', mode);
      break;
    }
  }

  // Step 2: Detect and extract level (UG/PG) - Fixed mapping
  const levelPatterns = {
    'UG': [
      'undergraduate', 'ug', 'bachelor', 'bachelors', "bachelor's", 
      'btech', 'bsc', 'ba', 'bcom', 'undergrad', 'under-graduate'
    ],
    'PG': [
      'postgraduate', 'pg', 'graduate', 'master', 'masters', "master's", 
      'mtech', 'msc', 'ma', 'mcom', 'mba', 'post-graduate', 'postgrad'
    ]
  };

  for (const [level, patterns] of Object.entries(levelPatterns)) {
    if (patterns.some(pattern => lowerQuestion.includes(pattern))) {
      filters.level = level; // This will be 'UG' or 'PG' to match DB schema
      console.log('Found level:', level);
      break;
    }
  }

  // Step 3: Detect and extract fee constraints
  const feeRegexes = [
    // Under/below patterns
    {
      regex: /(?:under|below|less than|cheaper than|maximum|max|up to)\s*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d+)*)/i,
      handler: (match) => ({ max_fee: parseInt(match[1].replace(/,/g, '')) })
    },
    // Above/over patterns
    {
      regex: /(?:above|over|more than|greater than|minimum|min|at least)\s*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d+)*)/i,
      handler: (match) => ({ min_fee: parseInt(match[1].replace(/,/g, '')) })
    },
    // Between patterns
    {
      regex: /(?:between|from)\s*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d+)*)\s*(?:and|to|-)\s*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d+)*)/i,
      handler: (match) => {
        const fee1 = parseInt(match[1].replace(/,/g, ''));
        const fee2 = parseInt(match[2].replace(/,/g, ''));
        return {
          min_fee: Math.min(fee1, fee2),
          max_fee: Math.max(fee1, fee2)
        };
      }
    },
    // Exact fee patterns
    {
      regex: /(?:exactly|costs?|fees?|priced? at)\s*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d+)*)/i,
      handler: (match) => {
        const fee = parseInt(match[1].replace(/,/g, ''));
        return { min_fee: fee, max_fee: fee };
      }
    }
  ];

  for (const { regex, handler } of feeRegexes) {
    const match = lowerQuestion.match(regex);
    if (match) {
      Object.assign(filters, handler(match));
      console.log('Found fee constraint:', handler(match));
      break;
    }
  }

  // Step 4: Detect and extract rating constraints
  const ratingRegexes = [
    {
      regex: /(?:rating|rated|stars?)\s*(?:above|over|more than|greater than|at least)\s*(\d+(?:\.\d+)?)/i,
      handler: (match) => ({ min_rating: parseFloat(match[1]) })
    },
    {
      regex: /(?:rating|rated|stars?)\s*(?:below|under|less than|maximum|max)\s*(\d+(?:\.\d+)?)/i,
      handler: (match) => ({ max_rating: parseFloat(match[1]) })
    },
    {
      regex: /(?:rating|rated|stars?)\s*(?:between|from)\s*(\d+(?:\.\d+)?)\s*(?:and|to|-)\s*(\d+(?:\.\d+)?)/i,
      handler: (match) => {
        const rating1 = parseFloat(match[1]);
        const rating2 = parseFloat(match[2]);
        return {
          min_rating: Math.min(rating1, rating2),
          max_rating: Math.max(rating1, rating2)
        };
      }
    },
    {
      regex: /(\d+(?:\.\d+)?)\s*(?:star|stars?|rating|rated)/i,
      handler: (match) => ({ min_rating: parseFloat(match[1]) })
    }
  ];

  for (const { regex, handler } of ratingRegexes) {
    const match = lowerQuestion.match(regex);
    if (match) {
      Object.assign(filters, handler(match));
      console.log('Found rating constraint:', handler(match));
      break;
    }
  }

  // Step 5: Detect and extract credits constraints
  const creditRegexes = [
    {
      regex: /(\d+)\s*credits?/i,
      handler: (match) => {
        const credits = parseInt(match[1]);
        return { min_credits: credits, max_credits: credits };
      }
    },
    {
      regex: /(?:between|from)\s*(\d+)\s*(?:and|to|-)\s*(\d+)\s*credits?/i,
      handler: (match) => {
        const credits1 = parseInt(match[1]);
        const credits2 = parseInt(match[2]);
        return {
          min_credits: Math.min(credits1, credits2),
          max_credits: Math.max(credits1, credits2)
        };
      }
    },
    {
      regex: /(?:at least|minimum|min)\s*(\d+)\s*credits?/i,
      handler: (match) => ({ min_credits: parseInt(match[1]) })
    },
    {
      regex: /(?:at most|maximum|max|up to)\s*(\d+)\s*credits?/i,
      handler: (match) => ({ max_credits: parseInt(match[1]) })
    }
  ];

  for (const { regex, handler } of creditRegexes) {
    const match = lowerQuestion.match(regex);
    if (match) {
      Object.assign(filters, handler(match));
      console.log('Found credits constraint:', handler(match));
      break;
    }
  }

  // Step 6: Detect department keywords - improved matching
  const departmentKeywords = {
    'Computer Science': ['computer', 'programming', 'software', 'coding', 'algorithm', 'data', 'ai', 'ml', 'tech', 'cs', 'it'],
    'Management': ['management', 'business', 'mba', 'leadership', 'strategy', 'operations', 'mgt'],
    'Electrical Engineering': ['electrical', 'electronics', 'circuit', 'power', 'signal', 'ee', 'eee'],
    'Arts': ['arts', 'literature', 'philosophy', 'history', 'creative', 'humanities'],
    'Design': ['design', 'graphic', 'ui', 'ux', 'visual', 'creative', 'art'],
    'Law': ['law', 'legal', 'constitutional', 'criminal', 'commercial', 'judiciary'],
    'Medicine': ['medicine', 'medical', 'health', 'anatomy', 'clinical', 'doctor', 'healthcare'],
    'Commerce': ['commerce', 'finance', 'accounting', 'economics', 'trade', 'business']
  };

  for (const [dept, keywords] of Object.entries(departmentKeywords)) {
    if (keywords.some(keyword => lowerQuestion.includes(keyword))) {
      filters.department = dept;
      console.log('Found department:', dept);
      break;
    }
  }

  // Step 7: Extract year if mentioned
  const yearMatch = lowerQuestion.match(/(?:year|in)\s*(20\d{2})/);
  if (yearMatch) {
    filters.year_offered = parseInt(yearMatch[1]);
    console.log('Found year:', yearMatch[1]);
  }

  // Step 8: Extract search terms - improved logic
  // Remove stop words and extract meaningful terms
  const stopWords = new Set([
    'i', 'want', 'to', 'find', 'search', 'for', 'show', 'me', 'get', 'list', 'of', 
    'courses', 'course', 'in', 'with', 'that', 'are', 'is', 'and', 'or', 'the', 
    'a', 'an', 'some', 'all', 'any', 'can', 'you', 'please', 'help'
  ]);

  // Remove already matched terms (delivery mode, level, department keywords, etc.)
  let searchTerms = lowerQuestion.split(/\s+/).filter(word => {
    // Skip if it's a stop word
    if (stopWords.has(word)) return false;
    
    // Skip if it's a number (likely year, fee, rating, etc.)
    if (/^\d+$/.test(word)) return false;
    
    // Skip if it's too short
    if (word.length <= 2) return false;
    
    // Skip if it matches any of our pattern keywords
    const allPatternWords = [
      ...Object.values(deliveryModePatterns).flat(),
      ...Object.values(levelPatterns).flat(),
      ...Object.values(departmentKeywords).flat(),
      'rating', 'rated', 'star', 'stars', 'credit', 'credits',
      'fee', 'fees', 'cost', 'costs', 'price', 'year'
    ];
    
    return !allPatternWords.includes(word);
  });

  if (searchTerms.length > 0) {
    filters.q = searchTerms.join(' ');
    console.log('Search terms:', filters.q);
  }

  console.log('Final parsed filters:', filters);
  return filters;
}

/**
 * Execute database query using parsed filters
 * Returns data in the specified format with proper pagination
 */
async function executeFilteredQuery(filters, page = 1, perPage = 10) {
  console.log('Executing query with filters:', filters);
  
  const conditions = [];
  const queryParams = [];
  let paramCounter = 1;

  // Search query (q) - search in course name and department
  if (filters.q) {
    conditions.push(`(course_name ILIKE $${paramCounter} OR department ILIKE $${paramCounter})`);
    queryParams.push(`%${filters.q}%`);
    paramCounter++;
  }

  // Department filter
  if (filters.department) {
    conditions.push(`department ILIKE $${paramCounter}`);
    queryParams.push(`%${filters.department}%`);
    paramCounter++;
  }

  // Level filter (UG/PG)
  if (filters.level) {
    conditions.push(`level = $${paramCounter}`);
    queryParams.push(filters.level);
    paramCounter++;
  }

  // Delivery mode filter
  if (filters.delivery_mode) {
    conditions.push(`delivery_mode = $${paramCounter}`);
    queryParams.push(filters.delivery_mode);
    paramCounter++;
  }

  // Year offered filter
  if (filters.year_offered) {
    conditions.push(`year_offered = $${paramCounter}`);
    queryParams.push(filters.year_offered);
    paramCounter++;
  }

  // Fee range filters
  if (filters.min_fee !== undefined) {
    conditions.push(`tuition_fee_inr >= $${paramCounter}`);
    queryParams.push(filters.min_fee);
    paramCounter++;
  }
  if (filters.max_fee !== undefined) {
    conditions.push(`tuition_fee_inr <= $${paramCounter}`);
    queryParams.push(filters.max_fee);
    paramCounter++;
  }

  // Rating range filters
  if (filters.min_rating !== undefined) {
    conditions.push(`rating >= $${paramCounter}`);
    queryParams.push(filters.min_rating);
    paramCounter++;
  }
  if (filters.max_rating !== undefined) {
    conditions.push(`rating <= $${paramCounter}`);
    queryParams.push(filters.max_rating);
    paramCounter++;
  }

  // Credits range filters
  if (filters.min_credits !== undefined) {
    conditions.push(`credits >= $${paramCounter}`);
    queryParams.push(filters.min_credits);
    paramCounter++;
  }
  if (filters.max_credits !== undefined) {
    conditions.push(`credits <= $${paramCounter}`);
    queryParams.push(filters.max_credits);
    paramCounter++;
  }

  // Build WHERE clause
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  console.log('WHERE clause:', whereClause);
  console.log('Query params:', queryParams);

  try {
    // Count query for pagination info
    const countQuery = `SELECT COUNT(*) FROM courses ${whereClause}`;
    console.log('Count query:', countQuery);
    
    const countResult = await db.query(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0].count);

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / perPage);
    const offset = (page - 1) * perPage;

    // Main query with pagination
    const mainQuery = `
      SELECT course_id, course_name, department, level, delivery_mode,
             credits, duration_weeks, rating, tuition_fee_inr, year_offered
      FROM courses
      ${whereClause}
      ORDER BY rating DESC, course_name ASC
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;
    
    console.log('Main query:', mainQuery);
    const result = await db.query(mainQuery, [...queryParams, perPage, offset]);

    console.log(`Found ${totalCount} total courses, returning ${result.rows.length}`);

    // Format the response to match the expected structure
    return {
      data: result.rows.map(row => ({
        course_id: row.course_id,
        course_name: row.course_name,
        department: row.department,
        level: row.level,
        delivery_mode: row.delivery_mode,
        credits: parseInt(row.credits),
        duration_weeks: parseInt(row.duration_weeks),
        rating: row.rating.toString(), // Ensure rating is returned as string
        tuition_fee_inr: parseInt(row.tuition_fee_inr),
        year_offered: parseInt(row.year_offered)
      })),
      meta: {
        total_count: totalCount,
        page: page,
        per_page: perPage,
        total_pages: totalPages,
        has_next_page: page < totalPages,
        has_prev_page: page > 1
      }
    };
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error(`Database query failed: ${error.message}`);
  }
}

module.exports = router;