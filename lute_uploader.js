// USER CONFIGURED PARAMETERS
/*
To find these, you should open dev tools and then open or refresh the create book page. The cookie will be in the first request in the network tab > headers tab > request headers > cookie
then in the console tab, enter the following:
document.querySelector('#csrf_token').attributes.value.value
that will give you the token
*/
const COOKIE = 'session=...'
const TOKEN = '...'
const LANG_ID = 14
const TXT_FILE_DIR = 'ebooks'

const fs = require('fs')
const path = require('path')
const axios = require('axios').default

async function main() {
    // GET FILE LIST
    const files = fs.readdirSync(TXT_FILE_DIR)

    // GET EXISTING BOOKS
    const existingBooks = await getBooks()

    // CREATE BOOKS
    for (let file of files) {
        if (!file.endsWith('.txt')) continue
        const title = file.slice(0, -4)

        // check if it exists already
        if (existingBooks.includes(title)) {
            console.log(`Skipping existing book ${title}`)
            continue
        }

        console.log(`Creating book ${title}`)
        const text = fs.readFileSync(path.join(TXT_FILE_DIR, file)).toString()
        await createBook(title, text)
    }
}

async function getBookType(type) {
    const res = await axios('http://localhost:5000/book/datatables/' + type, {
        headers: {
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        data: {
            // specify that we want the title of each book
            "columns[0][name]": "BkTitle",

            // filter by language
            "filtLanguage": LANG_ID,

            // not having these causes a crash I guess
            "columns[0][data]": 0,
            "columns[0][orderable]": true
        },
        method: 'POST'
    })
    return res.data.data.map(b => b[0])
}

async function getBooks() {
    // get the archived and active books for a language
    const archived = await getBookType('Archived')
    const active = await getBookType('active')
    return [...archived, ...active]
}

async function createBook(title, text) {
    const res = await axios.postForm('http://localhost:5000/book/new', {
        csrf_token: TOKEN,
        language_id: LANG_ID,
        title,
        text,
        max_page_tokens: 250
    }, {
        headers: {
            cookie: COOKIE
        }
    })
    // because the route is built to respond to the frontend, it always gives a 200 status code and errors are displayed in the HTML
    // therefore we need to check the HTML manually if something is not working
    // fs.writeFileSync('debug.html', res.data)
}

main().catch(console.error)
