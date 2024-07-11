// Go to https://pageviews.wmcloud.org/topviews
// Adjust the settings on the page, then download the json file
const JSON_PATH = './topviews-2023.json'
const DOWNLOAD_DIR = 'wikipedia'
const WIKI_LINK = 'https://sv.wikipedia.org/wiki/'
const REFERENCES_HEADER_TEXT = 'Referenser'

const axios = require('axios').default
const pageInfos = require(JSON_PATH)
const {parse} = require('node-html-parser')
const fs = require('fs')
const path = require('path')

async function main() {
    for (let pageInfo of pageInfos) {
        const title = `Wikipedia - ${pageInfo.article}.txt`
        const downloadPath = path.join(DOWNLOAD_DIR, title)

        if (fs.existsSync(downloadPath)) {
            console.log(`Skipping ${pageInfo.article}`)
            continue
        }

        console.log(`Downloading ${pageInfo.article}`)

        await new Promise(rs => setTimeout(rs, 2000))

        const url = WIKI_LINK + pageInfo.article
        const res = await axios(url)
        const html = res.data
        const page = parsePage(html)
        fs.writeFileSync(downloadPath, page)
    }
}

function parsePage(html) {
    const root = parse(html, {
        blockTextElements: {
            // a bit confusing, but block: false actually blocks it
            // otherwise the text of these elements will show up in the .txt file
            script: false,
            noscript: false,
            style: false,
            pre: false
        }
    })

    const mainDivs = root.querySelectorAll('.mw-content-ltr')
    if (mainDivs.length !== 1) throw Error('wrong number of main divs')
    const mainDiv = mainDivs[0]
    
    // delete references div and everything after it
    const refIndex = mainDiv.childNodes.findIndex(node => 
        node.rawTagName === 'H2' && node.textContent === REFERENCES_HEADER_TEXT)
    mainDiv.childNodes = mainDiv.childNodes.slice(0, refIndex)

    return mainDiv.text
}

main().catch(console.error)