const xlsx = require('xlsx');

try {
  const workbook = xlsx.readFile('catalog.xlsx.xlsx');
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Convert sheet to JSON array
  const data = xlsx.utils.sheet_to_json(sheet);
  
  if (data.length > 0) {
    console.log('Detected Columns:', Object.keys(data[0]));
    console.log(`\nFound ${data.length} rows.`);
    console.log('\nSample Row 1:', data[0]);
  } else {
    console.log('The sheet is empty.');
  }

} catch (err) {
  console.error('Error reading the Excel file:', err);
}
