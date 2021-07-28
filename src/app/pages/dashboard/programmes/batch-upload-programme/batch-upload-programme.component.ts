import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { FileValidator } from 'ngx-material-file-input';
import { Observable } from 'rxjs';
import * as _ from 'lodash'
import { ProgrammesService } from 'src/app/services';
import * as dateFns from 'date-fns';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ExcelService } from 'src/app/services/excel.service';
@Component({
  selector: 'app-batch-upload-programme',
  templateUrl: './batch-upload-programme.component.html',
  styleUrls: ['./batch-upload-programme.component.scss']
})
export class BatchUploadProgrammeComponent implements OnInit {

  fileUploadForm: FormGroup
  @ViewChild('programmeFile', { read: ElementRef }) programmeFile;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatTable, { read: MatTable }) matTable: MatTable<any>;
  totalProgrammes = 0;
  programmes = [];
  programmeCategories = [];
  loading$: boolean = false
  programmeDataSource: MatTableDataSource<any>;
  programmeTableColumns = [
    'index',
    'date',
    'startTime',
    'endTime',
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
  constructor(
    private programmesService: ProgrammesService,
    private router: Router,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private excelService:ExcelService
  ) {

  }
  maxSize = 16;
  ngOnInit() {
    this.programmesService
      .getProgrammeCategories('ScheduledProgrammeCategory')
      .subscribe(categories => {
        this.programmeCategories = categories
      })
    this.fileUploadForm = this.fb.group({
      'programmeFile': [undefined, [FileValidator.maxContentSize(this.maxSize)]]
    })
    setTimeout(() => {
      this.programmesService
        .loading$
        .subscribe(loading => {
          this.loading$ = loading
        })
    })
  }
  goBack() {
    this.router.navigateByUrl('/dashboard/programmes')
  }
  onFileChange(event) {
    let programmeFile = this.getUploadedFile(event)
    this.readFile(programmeFile)
      .subscribe(data => {
        let { worksheet } = this.handleSheetData(data)
        let worksheetRawData = [];
        let originalProgrammes = [];
        worksheetRawData = this.excelService.getWorksheetData(worksheet)
        originalProgrammes = this.excelService
          .convertWorksheetDataToUploadData(this.excelService.programmeExcelHeaders, worksheetRawData)

        for (let i = 0; i < originalProgrammes.length; i++) {
          let {
            description,
            trainer,
            personInCharge,
            contactNumber,
            password,
            ...compulsoryValues
          } = originalProgrammes[i]
         if(i===0){
         }
          if (Object.values(compulsoryValues).includes(undefined) || Object.values(compulsoryValues).includes('Invalid time value')) {
            continue
          } else {
            let programme = {}
            let { originalDate, originalStartTime, originalEndTime, ...otherProperties } = originalProgrammes[i]
            if (originalStartTime > originalEndTime) {
              this.snackBar.open('Start time bigger than End time in some programmes', '', { duration: 2000 });
            } else {
              let date = dateFns.format(dateFns.addDays(originalDate, 1), 'dd/MM/yyyy');
              let startTime = dateFns.format(originalStartTime, 'hh:mm a');
              let endTime = dateFns.format(originalEndTime, 'hh:mm a');
              programme = {
                date: date,
                startTime,
                endTime,
                ...otherProperties
              }
              this.programmes.push(programme)
            }

          }
        }
        if (this.programmes.length > 0) {
          this.programmeDataSource = this.createTableDataSource(this.programmes)
          this.totalProgrammes = this.programmes.length
        } else {
          throw new Error('please fill in programme infos')
        }

      })
  }


  uploadProgrammes() {
    let uploadProgrammes = [];
    //rectify the gender and member column
    this.programmes.forEach(programme => {
      let {
        date: date,
        startTime,
        endTime,
        category,
        isOnline,
        isFree,
        ...otherProperties
      } = programme
      let uploadProgramme = {}
      let startDate = dateFns.parse(startTime, 'hh:mm a', dateFns.parse(date, 'dd/MM/yyyy', new Date())).toISOString();
      let endDate = dateFns.parse(endTime, 'hh:mm a', dateFns.parse(date, 'dd/MM/yyyy', new Date())).toISOString();
      if (isOnline.toLowerCase().includes('off')) {
        isOnline = false
      } else {
        isOnline = true
      }
      if (isFree.toLowerCase().charAt(0) === 'f') {
        isFree = true
      } else {
        isFree = false
      }
      let programmeCategory = this.programmeCategories
        .filter(proCategory => {
          if ((proCategory.name.toLowerCase()).includes(category.toLowerCase())) {
            return true
          }
        })
      if (programmeCategory.length <= 0) {
        programmeCategory = this.programmeCategories[0]
      }
      uploadProgramme = {
        isOnline,
        isFree,
        startDate,
        endDate,
        category: programmeCategory[0]._id,
        ...otherProperties
      }
      uploadProgrammes.push(uploadProgramme)
    })
    this.programmesService.batchUploadProgrammes(uploadProgrammes)
      .subscribe(res => {
        if (res) {
          this.cancelUpload()
          this.snackBar.open('uploaded successfully', '', { duration: 2000 });
        }

      })
  }

  /**
   * create new data table
   * @param array
   */
  createTableDataSource(data: any[]) {
    let dataSource = new MatTableDataSource(data);
    dataSource.paginator = this.paginator;
    return dataSource
  }
  /**
   * get string data of file 
   * @param file 
   */
  readFile(file: File): Observable<any> {
    return new Observable((observer) => {
      let reader = new FileReader()
      reader.readAsBinaryString(file)
      reader.onload = () => {
        observer.next(reader.result);
      }
      reader.onerror = () => {
        observer.error('read unsuccessfully')
      }
    })
  }

  /**
   * get file
   * @param event 
   */
  getUploadedFile(event: { target: DataTransfer; }) {
    let target: DataTransfer = <DataTransfer>(event.target);
    if (target.files.length !== 1) throw new Error('Cannot use multiple files');
    let postFixs = target.files[0].name.slice(-4).toLowerCase()
    if (postFixs.includes('xls')) {
      return target.files[0]
    } else {
      throw new Error('Please choose excel file');
    }

  }
  /**
   * handle Binary String data 
   * @param data 
   */
  handleSheetData(data) {
    let excelHeaders = [];
    let workBook = null;
    let worksheet = null;
    workBook = this.excelService.readWorkBook(data, { type: 'binary', cellDates: true })
    worksheet = this.excelService.getWorkSheet(workBook);
    if (!worksheet) throw new Error('add work sheet')
    excelHeaders = this.excelService.getHeaderRow(worksheet)
    if (!excelHeaders.length) throw new Error('add headers')
    return {
      worksheet,
      excelHeaders
    }
  }

  cancelUpload() {
    this.fileUploadForm.patchValue({
      programmeFile: null
    })
    this.programmeDataSource = this.createTableDataSource([]);
    this.programmes = [];
    this.totalProgrammes = 0
  }

}
