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

    // CREATE BOOKS
    for (let file of files) {
        if (!file.endsWith('.txt')) continue
        const title = file.slice(0, -4)
        console.log(`Creating book ${title}`)
        const text = fs.readFileSync(path.join(TXT_FILE_DIR, file)).toString()
        await createBook(title, text)
    }
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
    // fs.writeFileSync('debug.html', res.data)
}

main().catch(console.error)
