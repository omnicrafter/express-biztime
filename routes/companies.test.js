process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testCompany;

beforeEach(async () => {
  const result = await db.query(
    `INSERT INTO companies (code, name, description) VALUES ('cstco', 'Costco', 'Kirkland Signature') 
    RETURNING code, name, description`
  );
  testCompany = result.rows[0];
});

afterEach(async () => {
  await db.query(`DELETE FROM companies`);
});

afterAll(async () => {
  await db.end();
});

describe("GET /companies", () => {
  test("Gets a list of 1 company", async () => {
    const response = await request(app).get(`/companies`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ companies: [testCompany] });
  });
});

describe("GET /companies", () => {
  test("Gets a list of all companies", async () => {
    const response = await request(app).get(`/companies`);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ companies: [testCompany] });
  });

  test("Gets a single company by code", async () => {
    const response = await request(app).get(
      `/companies?code=${testCompany.code}`
    );
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ companies: [testCompany] });
  });

  test("Responds with 404 for invalid company code", async () => {
    const response = await request(app).get(`/companies?code=nonexistent`);
    expect(response.statusCode).toEqual(404);
  });
});

describe("POST /companies", () => {
  test("Creates a new company", async () => {
    const response = await request(app)
      .post(`/companies`)
      .send({ code: "msft", name: "Microsoft", description: "Tech company" });
    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({
      company: { code: "msft", name: "Microsoft", description: "Tech company" },
    });
  });
});

describe("Patch /companies/:code", () => {
  test("Updates a single company", async () => {
    const response = await request(app)
      .patch(`/companies/${testCompany.code}`)
      .send({ name: "Updated Company", description: "Updated description" });
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      company: {
        code: testCompany.code,
        name: "Updated Company",
        description: "Updated description",
      },
    });
  });

  test("Responds with 404 for invalid company code", async () => {
    const response = await request(app)
      .put(`/companies/nonexistent`)
      .send({ name: "Updated Company", description: "Updated description" });
    expect(response.statusCode).toEqual(404);
  });
});

describe("DELETE /companies/:code", () => {
  test("Deletes a single company", async () => {
    const response = await request(app).delete(
      `/companies/${testCompany.code}`
    );
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ status: "deleted" });
  });

  test("Responds with 404 for invalid company code", async () => {
    const response = await request(app).delete(`/companies/nonexistent`);
    expect(response.statusCode).toEqual(404);
  });
});
