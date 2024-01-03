const express = require("express");
const ExpressError = require("../expressError");
const slugify = require("slugify");
const router = express.Router();
const db = require("../db");

module.exports = router;

// Get all companies
router.get("/", async (req, res, next) => {
  try {
    const { code } = req.query;
    let result;
    if (code) {
      result = await db.query(
        `
      SELECT c.code, c.name, c.description, array_agg(I.industry) as industries
      FROM companies as c
      LEFT JOIN companies_industries AS ci
      ON c.code = ci.comp_code
      LEFT JOIN industries AS I
      ON ci.ind_code = I.code
      WHERE c.code = $1 
      GROUP BY c.code, c.name, c.description`,
        [code]
      );
    } else {
      result = await db.query(`
      SELECT c.code, c.name, c.description, array_agg(I.industry) as industries
      FROM companies as c
      LEFT JOIN companies_industries AS ci
      ON c.code = ci.comp_code
      LEFT JOIN industries AS I
      ON ci.ind_code = I.code
      GROUP BY c.code, c.name, c.description`);
    }
    if (result.rows.length === 0) {
      throw new ExpressError("Company not found", 404);
    }
    return res.json({ companies: result.rows });
  } catch (e) {
    return next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const code = slugify(name, { lower: true, strict: true });
    const result = await db.query(
      "INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description",
      [code, name, description]
    );
    return res.status(201).json({ company: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.post("/:code/add-industry", async (req, res, next) => {
  try {
    const { code } = req.params;
    const { industry } = req.body;
    const checkDuplicate = await db.query(
      `SELECT * FROM companies_industries WHERE comp_code = $1 AND ind_code = $2`,
      [code, industry]
    );
    if (checkDuplicate.rows.length > 0) {
      return res.status(400).json({ error: "Industry already exists" });
    }
    const result = await db.query(
      `INSERT INTO companies_industries (comp_code, ind_code) VALUES ($1, $2) RETURNING comp_code, ind_code`,
      [code, industry]
    );
    if (result.rows.length === 0) {
      throw new ExpressError("Company not found", 404);
    }
    return res.status(201).json({ association: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.patch("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const { name, description } = req.body;
    const result = await db.query(
      `UPDATE companies SET name=$1, description=$2
        WHERE code = $3
        RETURNING code, name, description`,
      [name, description, code]
    );
    if (result.rows.length === 0) {
      throw new ExpressError("Company not found", 404);
    }
    return res.json({ company: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.delete("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const result = await db.query(
      `
        DELETE FROM companies WHERE code = $1`,
      [code]
    );

    if (result.rowCount === 0) {
      throw new ExpressError("Company not found", 404);
    }
    return res.json({ status: "deleted" });
  } catch (e) {
    return next(e);
  }
});
