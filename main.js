// USER CONFIGURED PARAMETERS
// do not use this script for English books
// instead, run the wget command found here (if you really want all 50000+ books):
// https://www.gutenberg.org/policy/robot_access.html#how-to-get-certain-ebook-files
const LANG_CODE = 'sv' // not English!
const CSV_DIR = '.'
const EBOOK_DIR = 'ebooks'

// IMPORTS
const path = require('path')
const fs = require('fs')
const axios = require('axios').default
const Papa = require('papaparse')

async function main() {

    // DOWNLOAD CSV IF NEEDED
    // see https://www.gutenberg.org/ebooks/offline_catalogs.html
    const csvPath = path.join(CSV_DIR, 'pg_catalog.csv')

    if (!fs.existsSync(csvPath)) {
        console.log('Did not find catalog CSV. Downloading now.')
        const csvRes = await axios('https://www.gutenberg.org/cache/epub/feeds/pg_catalog.csv')
        fs.writeFileSync(csvPath, csvRes.data)
    } else {
        console.log('Found catalog CSV.')
    }

    // PARSE AND FILTER CSV
    const catalog = Papa.parse(fs.readFileSync(csvPath).toString(), {
        header: true
    })
        .data
        .filter(row => row.Language === LANG_CODE)

    console.log(`Found ${catalog.length} books matching language code ${LANG_CODE}.`)

    // GET THE BOOKS
    // see https://www.gutenberg.org/policy/robot_access.html
    // since I am looking for books in a language that is a small percentage of the total books, it will use fewer server resources to take a slightly different approach from what's recommended

    for (let bookInfo of catalog) {
        const bookNum = bookInfo['Text#']
        console.log(`Downloading ${bookNum} - ${bookInfo.Title}`)

        const txtFilePath = path.join(EBOOK_DIR, `${bookNum} - ${bookInfo.Title}.txt`)

        // check if it exists (in case the user wants to get new books, or if it stopped due to some error)
        if (fs.existsSync(txtFilePath)) {
            console.log(`Skipping due to already existing`)
            continue
        }

        // first, find what folder the book is in
        const dirURL = determineBookDirURL(bookNum)

        // then determine the text file to download
        // this is because we don't know what encodings are available
        // the encodings are marked in the filename, #.txt for ASCII, #-0.txt for UTF-8, and #-8.txt for ISO-8859-1 AKA latin1 (somewhat confusing and I can't find any explanation of why it's done this way, but it seems consistent)
        await wait()
        const tableRes = await axios(dirURL)
        const tableHTML = tableRes.data
        const txtFiles = Array.from(tableHTML.matchAll(/href="(.*\.txt)"/g))
            .map(m => m[1])

        if (txtFiles.length < 1) {
            console.log(`Skipping due to no .txt file.`)
            continue
        }

        let txtFile
        let encoding = 'latin1'

        // prefer UTF8, then latin1, then ASCII, then guess
        const utf8FileName = `${bookNum}-0.txt`
        const latin1FileName = `${bookNum}-8.txt`
        const asciiFileName = `${bookNum}.txt`

        if (txtFiles.includes(utf8FileName)) {
            txtFile = utf8FileName
            encoding = 'utf8'
        } else if (txtFiles.includes(latin1FileName)) txtFile = latin1FileName
        else if (txtFiles.includes(asciiFileName)) txtFile = asciiFileName
        else {
            txtFile = txtFiles[0]
            console.log(`Could not find recognized encoding, will use latin1 for file ${txtFile}`)
        }

        // download the actual txt file
        await wait()
        const fileRes = await axios(dirURL + txtFile, {
            responseType: 'arraybuffer'
        })
        const fileContents = fileRes.data.toString(encoding)
        fs.writeFileSync(txtFilePath, fileContents, {
            encoding: 'utf8'
        })
    }
}

function determineBookDirURL(bookNum) {
    // you can see how this works by poking around http://aleph.gutenberg.org/
    // basically you put slashes between the digits except the last digit
    // 1 digit books use 0 since they only have a "last" digit
    let slug
    if (bookNum.length === 1) {
        slug = `0/${bookNum}/`
    } else {
        slug = bookNum
            .split('')
            .slice(0, bookNum.length - 1)
            .join('/')
            + `/${bookNum}/`
    }

    return `http://aleph.gutenberg.org/${slug}`
}

function wait() {
    return new Promise(rs => setTimeout(rs, 2000))
}

main().catch(console.error)