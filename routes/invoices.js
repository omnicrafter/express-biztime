const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res, next) => {
  try {
    const result = await db.query("SELECT * FROM invoices");
    return res.json({ invoices: result.rows });
  } catch (e) {
    return next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT invoices.id, invoices.amt, invoices.paid, invoices.add_date, invoices.paid_date, 
      companies.code, companies.name, companies.description 
      FROM invoices 
      INNER JOIN companies ON invoices.comp_code = companies.code 
      WHERE invoices.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      throw new ExpressError("Invoice not found", 404);
    }
    const data = result.rows[0];
    const response = {
      invoice: {
        id: data.id,
        amt: data.amt,
        paid: data.paid,
        add_date: data.add_date,
        paid_date: data.paid_date,
        company: {
          code: data.code,
          name: data.name,
          description: data.description,
        },
      },
    };
    return res.json(response);
  } catch (e) {
    return next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { comp_code, amt } = req.body;
    const result = await db.query(
      "INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING *",
      [comp_code, amt]
    );
    return res.status(201).json({ invoice: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amt } = req.body;
    const result = await db.query(
      "UPDATE invoices SET amt = $1 WHERE id = $2 RETURNING *",
      [amt, id]
    );
    if (result.rows.length === 0) {
      throw new ExpressError("Invoice not found", 404);
    }
    return res.json({ invoice: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query("DELETE FROM invoices WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      throw new ExpressError("Invoice not found", 404);
    }
    return res.json({ status: "deleted" });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
