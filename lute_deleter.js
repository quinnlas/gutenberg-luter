const axios = require('axios').default

const COOKIE = "session=..."

async function getBooks() {
    const res = await axios('http://localhost:5000/book/datatables/active', {
        headers: {
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        data: {
            "columns[0][name]": "BkId",

            // filter by language
            "filtLanguage": 0,

            // not having these causes a crash I guess
            "columns[0][data]": 0,
            "columns[0][orderable]": true
        },
        method: 'POST'
    })
    return res.data.data.map(b => b[0])
}

function deleteBook(bookID) {
    return axios('http://localhost:5000/book/delete/' + bookID, {
        method: 'POST',
        headers: {
            cookie: COOKIE
        }
    })
}

async function main() {
    const books = await getBooks()
    console.log(`Found ${books.length} books to delete.`)
    for (let book of books) {
        console.log(`Deleting ${book}`)
        await deleteBook(book)
    }
}

main().catch(console.error)