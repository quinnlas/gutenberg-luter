// Go to https://pageviews.wmcloud.org/topviews
// Adjust the settings on the page, then download the json file
const JSON_PATH = './topviews-2023.json'
const DOWNLOAD_DIR = 'wikipedia'
const WIKI_LINK = 'https://sv.wikipedia.org/wiki/'
const REFERENCES_HEADER_TEXT = 'Referenser'

const axios = require('axios').default
const pageInfos = require(JSON_PATH)
const cheerio = require('cheerio')
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

        const articleURL = pageInfo.article.replaceAll(/ /g, "_")
        const url = WIKI_LINK + articleURL
        const res = await axios(url)
        const html = res.data
        const page = parsePage(html)
        fs.writeFileSync(downloadPath, page)
    }
}

// the "proper" way to get the text would be to render the whole HTML with a browser, otherwise there is not really a parser library accurate enough
const lineBreakingTagsSet = {
    'address': true,
    'article': true,
    'aside': true,
    'blockquote': true,
    'br': true,
    'canvas': true,
    'dd': true,
    'div': true,
    'dl': true,
    'dt': true,
    'fieldset': true,
    'figcaption': true,
    'figure': true,
    'footer': true,
    'form': true,
    'h1': true,
    'h2': true,
    'h3': true,
    'h4': true,
    'h5': true,
    'h6': true,
    'header': true,
    'hr': true,
    'li': true,
    'main': true,
    'nav': true,
    'noscript': true,
    'ol': true,
    'p': true,
    'pre': true,
    'section': true,
    'table': true,
    'tfoot': true,
    'ul': true,
    'video': true
}

function innerText(element) {
    function getTextLoop(element) {
        const texts = [];
        Array.from(element.childNodes || []).forEach(node => {
            if (node.nodeType === 3) {
                texts.push(node.data);
            } else {
                if (lineBreakingTagsSet[node.name]) {
                    texts.push('\n')
                }
                texts.push(...getTextLoop(node));
            }
        });
        return texts;
    }
    return getTextLoop(element).join(' ');
}

function parsePage(html) {
    const root = cheerio.load(html)

    // delete elements whose text should not appear
    // otherwise they will be included when generating text
    root('style').remove()

    const mainDivs = root('.mw-content-ltr')
    if (mainDivs.length !== 1) throw Error('wrong number of main divs')
    const mainDiv = mainDivs[0]

    // get text
    let text = innerText(mainDiv)

    // remove references
    const referencesIndex = text.lastIndexOf(REFERENCES_HEADER_TEXT)
    if (referencesIndex !== -1) text = text.slice(0, referencesIndex)

    // remove extra new lines
    text = text.split('\n').map(l => l.trimEnd()).join('\n')
    text = text.replaceAll(/\n\n\n+/g, "\n\n")
    
    return text
}

main().catch(console.error)