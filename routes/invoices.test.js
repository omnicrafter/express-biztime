process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testInvoice;

beforeAll(async () => {
  // make sure the invoice table is empty
  await db.query("DELETE FROM invoices");
  await db.query("DELETE FROM companies");
  await db.query(
    "INSERT INTO companies (code, name, description) VALUES ('test', 'Test Company', 'Test Description')"
  );
});

afterAll(async () => {
  await db.end();
});

beforeEach(async () => {
  const result = await db.query(
    "INSERT INTO invoices (comp_code, amt) VALUES ('test', 100) RETURNING *"
  );
  testInvoice = result.rows[0];
});

afterEach(async () => {
  await db.query("DELETE FROM invoices WHERE id = $1", [testInvoice.id]);
});

describe("GET /invoices", () => {
  test("Gets a list of invoices", async () => {
    const response = await request(app).get("/invoices");
    expect(response.statusCode).toBe(200);
    expect(response.body.invoices).toHaveLength(1);
  });
});

describe("GET /invoices/:id", () => {
  test("Gets a single invoice", async () => {
    const response = await request(app).get(`/invoices/${testInvoice.id}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.invoice).toHaveProperty("id");
  });

  test("Responds with 404 for invalid invoice id", async () => {
    const response = await request(app).get("/invoices/9999");
    expect(response.statusCode).toBe(404);
  });
});

describe("POST /invoices", () => {
  test("Creates a new invoice", async () => {
    const response = await request(app)
      .post("/invoices")
      .send({ comp_code: "test", amt: 200 });
    expect(response.statusCode).toBe(201);
    expect(response.body.invoice).toHaveProperty("id");
  });
});

describe("PUT /invoices/:id", () => {
  test("Updates an invoice", async () => {
    const response = await request(app)
      .put(`/invoices/${testInvoice.id}`)
      .send({ amt: 200 });
    expect(response.statusCode).toBe(200);
    expect(response.body.invoice.amt).toBe(200);
  });

  test("Responds with 404 for invalid invoice id", async () => {
    const response = await request(app)
      .put("/invoices/9999")
      .send({ amt: 200 });
    expect(response.statusCode).toBe(404);
  });
});

describe("DELETE /invoices/:id", () => {
  test("Deletes an invoice", async () => {
    const response = await request(app).delete(`/invoices/${testInvoice.id}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ status: "deleted" });
  });

  test("Responds with 404 for invalid invoice id", async () => {
    const response = await request(app).delete("/invoices/9999");
    expect(response.statusCode).toBe(404);
  });
});
