const XLSX = require('xlsx');
const fs = require('fs');
const https = require('https');
const path = require('path');

const EXCEL_URL = 'https://cdnarfigyeloprodweu.azureedge.net/excel/arfigyelo_napi_termekadatok.xlsx';
const OUTPUT_PATH = path.join(__dirname, '..', 'products.json');

const parsePrice = (val) => {
    if (!val) return 0;
    return parseFloat(String(val).replace(',', '.')) || 0;
};
const downloadFile = ( url ) => {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            const chunks = [];
            response.on('data', chunk => chunks.push(chunk));
            response.on('end', () => resolve(Buffer.concat(chunks)));
            response.on('error', reject);
        }).on('error', reject);
    });
};

const run = async () => {
    console.log('Downloading..');
    const buffer = await downloadFile(EXCEL_URL);

    console.log('Parsing..');
    const workbook = XLSX.read(buffer, {type: 'buffer'});
    const sheet = Object.values(workbook.Sheets)[0];
    const rows = XLSX.utils.sheet_to_json(sheet, {header: 1});

    const products = rows.slice(1).map(row => ({
        id: String(row[0] || ''),
        name: String(row[1] || '').trim(),
        categoryId: parseInt(row[2]) || 0,
        categoryName: String(row[3] || '').trim(),
        store: String(row[4] || '').trim(),
        unit: String(row[5] || '').trim(),
        quantity: String(row[6] || '').trim(),
        minPrice: parsePrice(row[7]),
        maxPrice: parsePrice(row[8]),
    })).filter(p => p.name && p.categoryId > 0);

    console.log(`Products: ${products.length}`);
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(products));
    console.log('Data saved into products.json');
};

run().catch(err => {
    console.error(err);
    process.exit(1);
});