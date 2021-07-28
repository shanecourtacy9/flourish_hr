
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import _ from 'lodash'
import { FileValidator } from 'ngx-material-file-input';
import { Observable } from 'rxjs';
import { UsersService } from 'src/app/services';
import * as dateFns from 'date-fns';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ExcelService } from 'src/app/services/excel.service';
@Component({
  selector: 'app-batch-upload-users',
  templateUrl: './batch-upload-users.component.html',
  styleUrls: ['./batch-upload-users.component.scss']
})
export class BatchUploadUsersComponent implements OnInit {
  fileUploadForm: FormGroup
  @ViewChild('coacheeFile', { read: ElementRef }) coacheeFile;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatTable, { read: MatTable }) matTable: MatTable<any>;
  isCoacheeTable: boolean = true;
  totalCoachees = 0;
  coachees = [];
  loading$: boolean = false
  coacheeDataSource: MatTableDataSource<any>;
  coacheeTableColumns = [
    'index',
    'email',
    'first name',
    'last name',
    'gender',
    'dateOfBirth',
    'phoneNumber',
    'member'
  ]
  constructor(
    private usersService: UsersService,
    private router: Router,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private excelService:ExcelService
  ) {

  }
  maxSize = 16;
  ngOnInit() {
    this.fileUploadForm = this.fb.group({
      'coacheeFile': [undefined, [FileValidator.maxContentSize(this.maxSize)]]
    })
    setTimeout(() => {
      this.usersService
        .loading$
        .subscribe(loading => {
          this.loading$ = loading
        })
    })
  }
  goBack() {
    this.router.navigateByUrl('/dashboard/users')
  }
  onFileChange(event) {
    let coacheeFile = this.getUploadedFile(event)
    this.readFile(coacheeFile)
      .subscribe(data => {
        let { worksheet } = this.handleSheetData(data)
        let worksheetRawData = [];
        let originalCoachees = [];

        worksheetRawData = this.excelService.getWorksheetData(worksheet)
        originalCoachees = this.excelService.convertWorksheetDataToUploadData(this.excelService.coacheeExcelHeaders, worksheetRawData)
        for (let i = 0; i < originalCoachees.length; i++) {
          let { phoneNumber, ...otherProperties } = originalCoachees[i]
          if (!Object.values(otherProperties).includes(undefined)) {
            let { dateOfBirth } = otherProperties
            let convertedDOB = dateFns.format(dateFns.addDays(dateOfBirth, 1), 'dd/MM/yyyy');
            originalCoachees[i].dateOfBirth = convertedDOB;
            this.coachees.push(originalCoachees[i])
          }
        }
        if (!this.coachees.length)
          throw new Error('please fill in coachee infos')
        this.coacheeDataSource = this.createTableDataSource(this.coachees)
        this.totalCoachees = this.coachees.length
      })
  }


  uploadUsers() {
    let difference = []
    //judge table wether have same email
    if (this.coachees.length > 0)
      difference = _.uniqBy(this.coachees, 'email')
    if (this.coachees.length > difference.length)
      throw new Error('have same email address')
    let uploadCoachees = [];
    //rectify the gender and member column
    this.coachees.forEach(coachee => {
      let uploadCoachee = {}
      let { gender, isMember,dateOfBirth, ...otherProperties } = coachee
      let uploadedDOB=dateFns.parse(dateOfBirth, 'dd/MM/yyyy', new Date()).toISOString()
      if (gender.toLowerCase().charAt(0) === 'f') {
        gender = 'female'
      } else {
        gender = 'male'
      }
      if (isMember.toLowerCase().charAt(0) === 'f') {
        isMember = false
      } else {
        isMember = true
      }
      uploadCoachee = {
        gender,
        isMember,
        dateOfBirth:uploadedDOB,
        ...otherProperties
      }
      uploadCoachees.push(uploadCoachee)
    })
    this.usersService.batchUploadUsers(uploadCoachees)
      .subscribe(res => {
        if(res){
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
      coacheeFile: undefined
    })
    this.coacheeDataSource = this.createTableDataSource([]);
    this.coachees = [];
    this.totalCoachees = 0
  }

}
