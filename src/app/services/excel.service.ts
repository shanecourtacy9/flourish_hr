import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import * as _ from 'lodash'
@Injectable({
  providedIn: 'root'
})
export class ExcelService {

  EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
  EXCEL_EXTENSION = '.xlsx';
  coacheeExcelHeaders = [
    'email',
    'firstName',
    'lastName',
    'gender',
    'dateOfBirth',
    'phoneNumber',
    'isMember'
  ]
  programmeExcelHeaders = [
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
  constructor() { }

  getHeaders(excelHeaders: Array<string>, excelType) {
    let headers = [];
    headers = excelHeaders.map(header => {
      return this.headerCamel(header, excelType)
    })
    return headers
  }


  headerCamel(str: string, excelType) {
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
      return header.charAt(0)
        .toLowerCase()
        .concat(header.slice(1));
    }
  }



  /* read workbook */
  readWorkBook(data: string | ArrayBuffer, options) {
    let workbook = XLSX.read(data, options)
    return workbook
  }

  //get first work sheet
  getWorkSheet(workBook: XLSX.WorkBook) {
    let firstWorkSheet: XLSX.WorkSheet = null
    if (workBook.SheetNames.length) {
      let workSheetName: string = workBook.SheetNames[0];
      firstWorkSheet = workBook.Sheets[workSheetName];
    }
    return firstWorkSheet
  }

  // get headers of worksheet
  getHeaderRow(workSheet: XLSX.WorkSheet) {
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
  getWorksheetData(worksheet: XLSX.WorkSheet) {
    return XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: true,
      dateNF: 'DD"/"MM"/"YYYY HH":"mm'
    })
  }

  /**
   * get data which will pass to server
   * real data from 6th line
   * @param properties 
   * @param worksheetRawData 
   * 
   */
  convertWorksheetDataToUploadData(headers, worksheetRawData) {
    let uploadData = []
    for (let i = 5; i < worksheetRawData.length; i++) {
      let coacheeObject = _.zipObject(headers, worksheetRawData[i])
      uploadData.push(coacheeObject)
    }
    return uploadData
  }
  /**
   * 
   * @param data 
   * @param fileName 
   */
  exportExcel(data, fileName): void {
    /* generate worksheet */
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ width: 17 }, { width: 20 }, { width: 25 }, { width: 10 }, { width: 100 }];

    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    /* save to file */
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  }

  exportParqRegistrationTemplate(): void {
    const headers = [
      'Participant name',
      'Contact no',
      'Gender',
      'Date of birth (DD/MM/YYYY)',
      'Address',
      'CHAS card colour',
      'SG Enable',
      'PAR-Q: Heart condition / doctor',
      'PAR-Q: Chest pain during physical activity',
      'PAR-Q: Chest pain in the past month while not exercising',
      'PAR-Q: Dizziness, balance or consciousness',
      'PAR-Q: Bone or joint problem made worse by activity',
      'PAR-Q: Blood pressure or heart medication',
      'PAR-Q: Other reason not to do physical activity'
    ];
    const instructions = [
      ['PAR-Q registration sheet'],
      ['Complete one row per participant.'],
      ['Use Yes or No for every PAR-Q column.'],
      ['Use DD/MM/YYYY for dates of birth.'],
      ['Do not change the column headings on the PAR-Q Registration sheet.']
    ];
    const workbook = XLSX.utils.book_new();
    const registrationSheet = XLSX.utils.aoa_to_sheet([headers]);
    registrationSheet['!cols'] = headers.map((header, index) => ({
      width: index < 7 ? 24 : 42
    }));
    registrationSheet['!freeze'] = { xSplit: 0, ySplit: 1 };
    const guidanceSheet = XLSX.utils.aoa_to_sheet(instructions);
    guidanceSheet['!cols'] = [{ width: 82 }];
    XLSX.utils.book_append_sheet(workbook, registrationSheet, 'PAR-Q Registration');
    XLSX.utils.book_append_sheet(workbook, guidanceSheet, 'Guidance');
    XLSX.writeFile(workbook, 'PAR-Q_registration_template.xlsx');
  }
}
