# Intro
A few scripts related to getting content for [Lute](https://github.com/LuteOrg/lute-v3). There is a script to download ebooks for a given language from Project Gutenburg. There is also a script to load .txt files from a folder into Lute as books.

# Scripts
## Project Gutenberg Downloader
A simple script to download the books from Project Gutenburg that are in a particular language. It handles the case where a book has multiple encodings (preferring UTF8, then Latin1, then ASCII). To use it, do the following:
1. Run `npm i` to install dependencies.
2. Configure the "USER CONFIGURED PARAMETERS" section in `main.js`.
3. Run the script using `node ./main.js`.

If you want to download new books, you will have to wait for the catalog CSV to be updated (it is updated weekly). Then, delete the local CSV that the script already downloaded. It will download a new one and only download the new books.

## Lute Uploader
This script should be configured similarly to the downloader. It will upload all texts in a specified directory to Lute as books.