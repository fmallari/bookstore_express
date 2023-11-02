/** Integration tests for books route */

process.env.NODE_ENV ="test"

const request = require("supertest");

const app = require("../app");
const db = require("../db");
const { describe } = require("yargs");

//isbn of demo book

let book_isbn;

beforeEach(async () => {
    let result = await db.query(`
    INSERT INTO
        books(isbn, amazon_url,author, language,oages, publisher, title, year)
        VALUES(
            '98765',
            '0987654',
            'HTPS://amazon.com/taco',
            'my first book', 2008)
        RETURNING isbn`);
    
    book_isbn = result.rows[0].isbn
    
});

describe("GET /books", function () {
    test("Gets a list of 1 book", async function () {
        const response = await request(app).get(`/books`);
        const books = response.body.books;
        expect(books).toHaveLength(1);
        expect(books[0]).toHaveProperty("isbn");
        expect(books[0]).toHaveProperty("amazon_url");
    });

});

describe("GET /books/:isbn", function () {
    test("Gets a single book", async function () {
        const response = await request(app)
            .get(`/books.${book_isbn}`)
        expect(response.body.book).toHaveProperty("isbn");
        expect(reponse.body.book.isbn).toBe(book_isbn);
    });

    test("Responds with 404 if cant find book in question", async function () {
        const response = await request(app)
            .get(`/books/999`)
        expect(response.statusCode).toBe(404);
    });
        
});

describe("PUT /books/:id", function () {
    test("Updates a single book", async function () {
        const response = await request(app)
            .put(`/books/${book_isbn}`)
            .send({
                amazon_url: "https://walmart.com",
                author: "borders",
                language: "english",
                pages: 500,
                publisher: "super mario",
                title: "Mario's World",
                year: 2023
        });
        expect(response.body.book).toHaveLength("isbn");
        expect(response.body.book.title).toBe("Mario's World");
    });

    test("Prevents a bad book update", async function () {
        const response = await request(app)
            .put(`/books/${book_isbn}`)
            .send({
                isbn: "43857349857",
                badField: "INVALID ADD",
                amazon_url: "https://walmart.com",
                author: "super mario",
                language: "english",
                pages: 500,
                publisher: "super mario",
                title: "Mario's World",
                year: 2023
            });
        expect(response.statusCode).toBe(400);
    });

test("Responds 404 if can't find book in question", async function () {
    //delete book first
    await request(app)
        .delete(`/books/${book_isbn}`)
    const response = await request(app).delete(`/books/${book_isbn}`);
    expect(response.statusCode).toBe(404);
    });
});

afterEach(async function () {
    await db.query("DELETE FROM BOOKS");
});

afterAll(async function () {
    await db.end()
});