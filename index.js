import express from "express";
import pg from "pg";
import bodyParser from "body-parser";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.set("view engine", "ejs");
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "book_notes",
  password: "7s9KZR1#M",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Home Route - Display All Books
app.get("/", async (req, res) => {
  const result = await db.query("SELECT * FROM books ORDER BY date_read DESC");
  res.render("index", { books: result.rows });
});

// Add Book Form
app.get("/add", (req, res) => {
  res.render("add");
});

// Add Book - POST
app.post("/add", async (req, res) => {
  const { title, author, rating, review } = req.body;

  // Fetch book cover from Open Library
  const apiUrl = `https://openlibrary.org/search.json?title=${title}`;
  const response = await axios.get(apiUrl);
  const bookData = response.data.docs[0];
  const coverUrl = bookData?.cover_i
    ? `https://covers.openlibrary.org/b/id/${bookData.cover_i}-L.jpg`
    : "/default-cover.jpg";

  await db.query(
    "INSERT INTO books (title, author, rating, review, cover_url) VALUES ($1, $2, $3, $4, $5)",
    [title, author, rating, review, coverUrl]
  );
  res.redirect("/");
});

// Delete Book
app.post("/delete/:id", async (req, res) => {
  const id = req.params.id;
  await db.query("DELETE FROM books WHERE id = $1", [id]);
  res.redirect("/");
});

// Edit Book
app.get("/edit/:id", async (req, res) => {
  const result = await db.query("SELECT * FROM books WHERE id = $1", [
    req.params.id,
  ]);
  res.render("edit", { book: result.rows[0] });
});

app.post("/edit/:id", async (req, res) => {
  const { title, author, rating, review } = req.body;
  await db.query(
    "UPDATE books SET title=$1, author=$2, rating=$3, review=$4 WHERE id=$5",
    [title, author, rating, review, req.params.id]
  );
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
