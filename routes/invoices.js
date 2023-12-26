const express = require("express");
const router = express.Router();
const db = require("../db");

module.exports = router;

router.get("/", async (req, res, next) => {
  try {
    const { id } = req.params;
    let result;

    if (id) {
      result = await db.query(`SELECT * FROM invoices WHERE id = $1`, [id]);
    } else {
      result = await db.query(`SELECT * FROM invoices`);
    }

    return res.json({ invoices: result.rows });
  } catch (e) {
    return next(e);
  }
});
