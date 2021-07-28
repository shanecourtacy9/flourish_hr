// import { registrationOptions } from "../models";
import * as XLSX from 'xlsx';
import * as _ from 'lodash'
const coacheeExcelHeaders = [
  'email',
  'firstName',
  'lastName',
  'gender',
  'dateOfBirth',
  'phoneNumber',
  'isMember'
]
const programmeExcelHeaders = [
  'originalDate',
  'originalStartTime',
  'originalEndTime',
  'name',
  'category',
  'description',
  'trainer',
  'capacity',
  'personInCharge',
  'contactNumber',
  'isOnline',
  'venueOrLink',
  'password',
  'isFree'
]
function getHeaders(excelHeaders: Array<string>, excelType) {
  let headers = [];
  headers = excelHeaders.map(header => {
    return headerCamel(header, excelType)
  })
  return headers
}


function headerCamel(str: string, excelType) {
  let headerStr = str.trim();
  let header = "";
  if (headerStr.includes('\(')) {
    let index = headerStr.indexOf('\(')
    headerStr = headerStr.slice(0, index)
  }
  let words = headerStr.toLocaleLowerCase().split(' ');
  if (words.length > 0) {
    let newWords = words.map(word => {
      return word.charAt(0).toUpperCase().concat(word.slice(1));
    })
    header = newWords.join('');
  }
  if (excelType === 'records') {
    return header
  } else {
    return header.charAt(0).toLowerCase().concat(header.slice(1));
  }
}



/* read workbook */
function readWorkBook(data: string | ArrayBuffer, options) {
  let workbook = XLSX.read(data, options)
  return workbook
}

//get first work sheet
function getWorkSheet(workBook: XLSX.WorkBook) {
  let firstWorkSheet: XLSX.WorkSheet = null
  if (workBook.SheetNames.length) {
    let workSheetName: string = workBook.SheetNames[0];
    firstWorkSheet = workBook.Sheets[workSheetName];
  }
  return firstWorkSheet
}

// get headers of worksheet
function getHeaderRow(workSheet: XLSX.WorkSheet) {
  let headers = [];
  if (!workSheet['!ref']) throw new Error('no headers in your sheet')
  let range = XLSX.utils.decode_range(workSheet['!ref']);
  let coloum = 0;
  let row = range.s.r; /* start in the first row */
  /* walk every column in the range */
  for (coloum = range.s.c; coloum <= range.e.c; coloum++) {
    let cell = workSheet[XLSX.utils.encode_cell({ c: coloum, r: row })] /* find the cell in the first row */
    let hdr = null; // <-- replace with your desired default 
    if (cell && cell.t) hdr = XLSX.utils.format_cell(cell);
    headers.push(hdr);
  }
  return headers;
}

/**
 * get json data from raw data
 * @param worksheet 
 */
function getWorksheetData(worksheet: XLSX.WorkSheet) {
  return XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    raw: true,
    dateNF: 'DD"/"MM"/"YYYY HH":"mm'
  })
}

/**
 * get data which will pass to server
 * @param properties 
 * @param worksheetRawData 
 */
function convertWorksheetDataToUploadData(headers, worksheetRawData) {
  let uploadData = []
  for (let i = 2; i < worksheetRawData.length; i++) {
    let coacheeObject = _.zipObject(headers, worksheetRawData[i])
    uploadData.push(coacheeObject)
  }
  return uploadData
}

/**
 * make header match database
 * @param excelHeaders 
 */


export const ExcelDataProcessor = {
  readWorkBook,
  getWorkSheet,
  getHeaders,
  getHeaderRow,
  getWorksheetData,
  convertWorksheetDataToUploadData,
  coacheeExcelHeaders,
  programmeExcelHeaders
}