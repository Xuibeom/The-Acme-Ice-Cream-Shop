const express = require("express");
const app = express();
const pg = require("pg");
app.use(express.json());
app.use(require("morgan")("dev"));

// Between the colon and @, "postgres" is the password
const client = new pg.Client(
  process.env.DATABASE_URL ||
    "postgres://postgres:postgres@localhost/acme_flavors_db"
);

const PORT = process.env.PORT || 3000;

// Routes
app.get("/api/flavors", async (req, res, next) => {
  try {
    const SQL = `
         SELECT * from flavors;
         `;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    console.log(error);
  }
});

app.get("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `
          SELECT * FROM flavors WHERE id= $1;
          `;
    const response = await client.query(SQL, [req.params.id]);
    res.send(response.rows);
  } catch (error) {
    console.log(error);
  }
});

app.post("/api/flavors", async (req, res, next) => {
  try {
    const SQL = `
          INSERT INTO flavors(name, favorite)
          VALUES ($1, $2)
          RETURNING *
          `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.favorite,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    console.log(error);
  }
});

app.delete("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `
          DELETE from flavors WHERE id=$1;
          `;
    const response = await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    console.log(error);
  }
});

app.put("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `
          UPDATE flavors
          SET name=$1, favorite=$2, updated=now()
          WHERE id =$3
          `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.favorite,
      req.params.id,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    console.log(error);
  }
});

// Initialize the Table
const init = async () => {
  app.listen(PORT, () => {
    console.log(`I am listening on port number ${PORT}`);
  });
  await client.connect();
  let SQL = `
          DROP TABLE IF EXISTS flavors;
          CREATE TABLE flavors(
              id SERIAL PRIMARY KEY,
              name VARCHAR(255) NOT NULL,
              favorite BOOLEAN DEFAULT FALSE,
              created TIMESTAMP DEFAULT now(),
              updated TIMESTAMP DEFAULT now()
          );
      `;
  await client.query(SQL);
  SQL = `
      INSERT INTO flavors(name, favorite, created) VALUES ('Vanilla', false, now());
      INSERT INTO flavors(name, favorite, created) VALUES ('Chocolate', false, now());
      INSERT INTO flavors(name, favorite, created) VALUES ('Strawberry', true, now());
  `;
  await client.query(SQL);
  console.log("We just seeded out database");
};

// Call init
init();
