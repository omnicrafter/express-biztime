const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

module.exports = router;

// Get all industries or one industry
router.get("/", async (req, res, next) => {
  try {
    const { code } = req.query;
    let result;
    if (code) {
      result = await db.query(
        `
        SELECT i.code, i.industry, array_agg(c.code) as companies 
        FROM industries as i
        LEFT JOIN companies_industries AS ci
        ON i.code = ci.ind_code
        LEFT JOIN companies AS c
        ON ci.comp_code = c.code
        WHERE i.code = $1
        GROUP BY i.code, i.industry
        `,
        [code]
      );
    } else {
      result = await db.query(`
    SELECT i.code, i.industry, array_agg(c.code) as companies 
    FROM industries as i
    LEFT JOIN companies_industries AS ci
    ON i.code = ci.ind_code
    LEFT JOIN companies AS c
    ON ci.comp_code = c.code
    GROUP BY i.code, i.industry
    `);
    }
    if (result.rows.length === 0) {
      throw new ExpressError("Industry not found", 404);
    }
    return res.json({ industries: result.rows });
  } catch (e) {
    return next(e);
  }
});

// Create a new industry
router.post("/", async (req, res, next) => {
  try {
    const { code, industry } = req.body;

    // Check if the code or industry already exists
    const existingIndustry = await db.query(
      `SELECT * FROM industries WHERE code = $1 OR industry = $2`,
      [code, industry]
    );

    if (existingIndustry.rows.length > 0) {
      return res
        .status(400)
        .json({ error: "Industry code or name already exists" });
    }

    const result = await db.query(
      `INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING code, industry`,
      [code, industry]
    );

    return res.status(201).json({ industry: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});
