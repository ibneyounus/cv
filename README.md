# Muhammad Faisal portfolio website

Eight static pages (HTML, CSS, JavaScript). No build step and no installation.

## Run it
Double click `index.html`. Or, from this folder: `python3 -m http.server 8000` and open http://localhost:8000

## Edit
- Contact details and LinkedIn: `js/config.js`
- Colours: top of `css/style.css`
- Translations: `js/lang/*.js` (English text lives in the page files, tagged with `data-i18n="key"`)
- PDFs: replace the files in `assets/downloads/` keeping the same names

## Deploy
Upload everything in this folder to the web root (`public_html`) of any host. PHP + MySQL is needed only for the optional message form (`contact.php`, `config.php.example`, `schema.sql`). Then replace `https://www.example.com` with the real domain in all `.html` files, `sitemap.xml` and `robots.txt`.

## Needs confirmation
real domain, WhatsApp test, native-speaker review of translations, current validity of listed qualifications.

See `Website_Client_Guide.pdf` for the full step by step instructions.
