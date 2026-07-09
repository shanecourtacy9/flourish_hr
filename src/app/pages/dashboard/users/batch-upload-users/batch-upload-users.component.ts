import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import _ from 'lodash';
import { FileValidator } from 'ngx-material-file-input';
import { Observable } from 'rxjs';
import { AuthService, UsersService } from 'src/app/services';
import * as dateFns from 'date-fns';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ExcelService } from 'src/app/services/excel.service';

interface RegistrationUploadRow {
  rowNumber: number;
  fullName: string;
  phoneNumber: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  chasCardColour: string;
  sgEnableStatus: string;
  parq_heart_condition: boolean;
  parq_chest_pain_activity: boolean;
  parq_chest_pain_recent: boolean;
  parq_dizziness_balance: boolean;
  parq_bone_joint_problem: boolean;
  parq_blood_pressure_drugs: boolean;
  parq_other_reason: boolean;
  liabilityConsent?: boolean;
  pdpaConsent?: boolean;
}

@Component({
  selector: 'app-batch-upload-users',
  templateUrl: './batch-upload-users.component.html',
  styleUrls: ['./batch-upload-users.component.scss']
})
export class BatchUploadUsersComponent implements OnInit {
  fileUploadForm: FormGroup;
  @ViewChild('coacheeFile', { read: ElementRef }) coacheeFile;
  @ViewChild('registrationFile', { read: ElementRef }) registrationFile: ElementRef;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatTable, { read: MatTable }) matTable: MatTable<any>;

  totalCoachees = 0;
  coachees = [];
  loading$ = false;
  coacheeDataSource: MatTableDataSource<any>;
  registrationDataSource: MatTableDataSource<RegistrationUploadRow>;
  registrationRows: RegistrationUploadRow[] = [];
  registrationErrors: Array<{ rowNumber?: number; message: string }> = [];
  uploadMode: 'users' | 'registration' = 'users';
  parqEnabled = false;
  selectedUserFileName = '';
  selectedRegistrationFileName = '';

  coacheeTableColumns = ['index', 'email', 'first name', 'last name', 'gender', 'dateOfBirth', 'phoneNumber', 'member'];
  registrationTableColumns = ['rowNumber', 'fullName', 'phoneNumber', 'gender', 'dateOfBirth', 'parqSummary'];
  private readonly parqKeys = [
    'parq_heart_condition',
    'parq_chest_pain_activity',
    'parq_chest_pain_recent',
    'parq_dizziness_balance',
    'parq_bone_joint_problem',
    'parq_blood_pressure_drugs',
    'parq_other_reason'
  ];

  private readonly registrationHeaders = {
    fullName: [['participant', 'name'], ['full', 'name'], ['name']],
    phoneNumber: [['contact', 'no'], ['contact', 'number'], ['phone', 'number']],
    gender: [['gender']],
    dateOfBirth: [['d', 'o', 'b'], ['date', 'birth'], ['dob']],
    address: [['address']],
    chasCardColour: [['chas', 'card']],
    sgEnableStatus: [['sg', 'enable']],
    parq_heart_condition: [['heart', 'condition', 'doctor']],
    parq_chest_pain_activity: [['chest', 'pain', 'physical', 'activity']],
    parq_chest_pain_recent: [['past', 'month', 'chest', 'pain']],
    parq_dizziness_balance: [['dizziness', 'consciousness']],
    parq_bone_joint_problem: [['bone', 'joint', 'worse']],
    parq_blood_pressure_drugs: [['blood', 'pressure', 'medication']],
    parq_other_reason: [['other', 'reason', 'physical', 'activity']],
    liabilityConsent: [['release', 'liability']],
    pdpaConsent: [['photography', 'videography', 'promotional']]
  };

  constructor(
    private usersService: UsersService,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private excelService: ExcelService
  ) {}

  maxSize = 16;

  ngOnInit() {
    this.fileUploadForm = this.fb.group({
      coacheeFile: [undefined, [FileValidator.maxContentSize(this.maxSize)]]
    });
    this.coacheeDataSource = this.createTableDataSource([]);
    this.registrationDataSource = this.createTableDataSource([]);
    this.usersService.loading$.subscribe((loading) => this.loading$ = loading);
    this.authService.getProfile().subscribe((user) => {
      const company = user && user.company;
      const fields = company && company.configs && company.configs.additionalSignupFields || [];
      const keys = new Set(fields.map((field) => field && field.key));
      this.parqEnabled = Boolean(company && company.configs && company.configs.allowAdditionalSignupFields)
        && this.parqKeys.every((key) => keys.has(key));
    });
  }

  goBack() {
    this.router.navigateByUrl('/dashboard/users');
  }

  onFileChange(event) {
    this.uploadMode = 'users';
    this.registrationRows = [];
    this.registrationErrors = [];
    this.coachees = [];
    const coacheeFile = this.getUploadedFile(event);
    this.selectedUserFileName = coacheeFile.name;
    this.selectedRegistrationFileName = '';
    this.readFile(coacheeFile).subscribe({
      next: (data) => {
        try {
          const { worksheet } = this.handleSheetData(data);
          const rawData = this.excelService.getWorksheetData(worksheet);
          const originalCoachees = this.excelService.convertWorksheetDataToUploadData(
            this.excelService.coacheeExcelHeaders,
            rawData
          );
          originalCoachees.forEach((coachee) => {
            const { phoneNumber, ...otherProperties } = coachee;
            if (!Object.values(otherProperties).includes(undefined)) {
              coachee.dateOfBirth = dateFns.format(dateFns.addDays(otherProperties.dateOfBirth, 1), 'dd/MM/yyyy');
              this.coachees.push(coachee);
            }
          });
          if (!this.coachees.length) throw new Error('Please fill in user information');
          this.coacheeDataSource = this.createTableDataSource(this.coachees);
          this.totalCoachees = this.coachees.length;
        } catch (error) {
          this.snackBar.open(error.message || 'Unable to read user file', '', { duration: 3000 });
        }
      },
      error: () => this.snackBar.open('Unable to read user file', '', { duration: 3000 })
    });
  }

  onRegistrationFileChange(event) {
    this.uploadMode = 'registration';
    this.coachees = [];
    this.totalCoachees = 0;
    this.registrationRows = [];
    this.registrationErrors = [];
    try {
      const file = this.getUploadedFile(event);
      this.selectedRegistrationFileName = file.name;
      this.selectedUserFileName = '';
      this.readFile(file).subscribe({
        next: (data) => {
          try {
            const { worksheet, excelHeaders } = this.handleSheetData(data);
            const { rows, errors } = this.parseRegistrationSheet(
              excelHeaders,
              this.excelService.getWorksheetData(worksheet) as any[][]
            );
            this.registrationRows = rows;
            this.registrationErrors = errors;
            this.registrationDataSource = this.createTableDataSource(rows);
            if (!rows.length) throw new Error('No valid PAR-Q registration rows found');
          } catch (error) {
            this.registrationErrors.push({ message: error.message || 'Unable to read PAR-Q registration sheet' });
            this.registrationDataSource = this.createTableDataSource([]);
          } finally {
            if (this.registrationFile) this.registrationFile.nativeElement.value = '';
          }
        },
        error: () => this.registrationErrors.push({ message: 'Unable to read PAR-Q registration sheet' })
      });
    } catch (error) {
      this.registrationErrors.push({ message: error.message || 'Unable to read PAR-Q registration sheet' });
    }
  }

  uploadUsers() {
    if (this.uploadMode === 'registration') {
      this.uploadRegistrationRows();
      return;
    }
    const uniqueUsers = _.uniqBy(this.coachees, 'email');
    if (this.coachees.length > uniqueUsers.length) {
      this.snackBar.open('The upload contains duplicate email addresses', '', { duration: 3000 });
      return;
    }
    const uploadCoachees = this.coachees.map((coachee) => {
      let { gender, isMember, dateOfBirth, ...otherProperties } = coachee;
      gender = gender.toLowerCase().charAt(0) === 'f' ? 'female' : 'male';
      isMember = isMember.toLowerCase().charAt(0) !== 'f';
      return {
        gender,
        isMember,
        dateOfBirth: dateFns.parse(dateOfBirth, 'dd/MM/yyyy', new Date()).toISOString(),
        ...otherProperties
      };
    });
    this.usersService.batchUploadUsers(uploadCoachees).subscribe({
      next: () => {
        this.cancelUpload();
        this.snackBar.open('Users uploaded successfully', '', { duration: 2500 });
      },
      error: (error) => this.snackBar.open(error.error && error.error.message || 'Upload failed', '', { duration: 3500 })
    });
  }

  private uploadRegistrationRows() {
    if (!this.registrationRows.length) {
      this.snackBar.open('Choose a valid PAR-Q registration sheet first', '', { duration: 3000 });
      return;
    }
    this.usersService.batchUploadRegistrationSheet(this.registrationRows).subscribe({
      next: (result: any) => {
        this.registrationErrors = (result.errors || []).map((error) => ({
          rowNumber: error.rowIndex,
          message: error.reason
        }));
        this.snackBar.open(`${result.created || 0} users uploaded${result.skipped ? `, ${result.skipped} skipped` : ''}`, '', { duration: 4000 });
        if (!result.skipped) this.cancelUpload();
      },
      error: (error) => this.snackBar.open(error.error && error.error.message || 'PAR-Q upload failed', '', { duration: 4000 })
    });
  }

  getParqSummary(row: RegistrationUploadRow) {
    const answered = this.parqKeys.filter((key) => typeof row[key] === 'boolean').length;
    return `${answered}/7 answered`;
  }

  downloadParqRegistrationTemplate() {
    this.excelService.exportParqRegistrationTemplate();
  }

  private parseRegistrationSheet(headers: any[], data: any[][]) {
    const columnMap: any = {};
    const requiredColumns = [
      'fullName',
      'phoneNumber',
      'gender',
      'dateOfBirth',
      'address',
      'chasCardColour',
      'sgEnableStatus',
      ...this.parqKeys
    ];
    Object.keys(this.registrationHeaders).forEach((key) => {
      columnMap[key] = this.findHeaderIndex(headers, this.registrationHeaders[key]);
      if (requiredColumns.includes(key) && columnMap[key] < 0) {
        throw new Error(`Missing required column: ${key}`);
      }
    });

    const rows: RegistrationUploadRow[] = [];
    const errors: Array<{ rowNumber?: number; message: string }> = [];
    const seenPhones = new Set<string>();
    data.slice(1).forEach((cells, index) => {
      const rowNumber = index + 2;
      if (!cells || cells.every((cell) => cell === undefined || cell === null || cell === '')) return;
      try {
        const row: any = {
          rowNumber,
          fullName: this.requiredValue(cells[columnMap.fullName], 'Full name'),
          phoneNumber: this.requiredValue(cells[columnMap.phoneNumber], 'Phone number'),
          gender: this.requiredValue(cells[columnMap.gender], 'Gender'),
          dateOfBirth: this.toIsoDate(cells[columnMap.dateOfBirth]),
          address: this.requiredValue(cells[columnMap.address], 'Address'),
          chasCardColour: this.requiredValue(cells[columnMap.chasCardColour], 'CHAS card colour'),
          sgEnableStatus: this.requiredValue(cells[columnMap.sgEnableStatus], 'SG Enable status'),
          liabilityConsent: this.optionalBoolean(cells[columnMap.liabilityConsent], 'Liability consent'),
          pdpaConsent: this.optionalBoolean(cells[columnMap.pdpaConsent], 'PDPA consent')
        };
        this.parqKeys.forEach((key) => row[key] = this.parseBoolean(cells[columnMap[key]], key));
        const phone = String(row.phoneNumber).replace(/\s+/g, '').replace(/^\+?65/, '');
        if (seenPhones.has(phone)) throw new Error('Phone number is duplicated in this upload');
        seenPhones.add(phone);
        rows.push(row as RegistrationUploadRow);
      } catch (error) {
        errors.push({ rowNumber, message: error.message || 'Invalid row' });
      }
    });
    return { rows, errors };
  }

  private findHeaderIndex(headers: any[], alternatives: string[][]) {
    return headers.findIndex((header) => {
      const normalized = this.normalizeHeader(header);
      return alternatives.some((keywords) => keywords.every((keyword) => normalized.includes(keyword)));
    });
  }

  private normalizeHeader(value: any) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  private requiredValue(value: any, field: string) {
    const normalized = String(value === undefined || value === null ? '' : value).trim();
    if (!normalized) throw new Error(`${field} is required`);
    return normalized;
  }

  private parseBoolean(value: any, field: string) {
    if (typeof value === 'boolean') return value;
    const normalized = String(value === undefined || value === null ? '' : value).trim().toLowerCase();
    if (['yes', 'y', 'true', '1'].includes(normalized)) return true;
    if (['no', 'n', 'false', '0'].includes(normalized)) return false;
    throw new Error(`${field} must be Yes or No`);
  }

  private optionalBoolean(value: any, field: string) {
    if (value === undefined || value === null || String(value).trim() === '') return undefined;
    return this.parseBoolean(value, field);
  }

  private toIsoDate(value: any) {
    if (value instanceof Date && !isNaN(value.getTime())) return value.toISOString();
    const parsed = new Date(String(value));
    if (isNaN(parsed.getTime())) throw new Error('Date of birth must be valid');
    return parsed.toISOString();
  }

  createTableDataSource(data: any[]) {
    const dataSource = new MatTableDataSource(data);
    dataSource.paginator = this.paginator;
    return dataSource;
  }

  readFile(file: File): Observable<any> {
    return new Observable((observer) => {
      const reader = new FileReader();
      reader.readAsBinaryString(file);
      reader.onload = () => observer.next(reader.result);
      reader.onerror = () => observer.error('read unsuccessfully');
    });
  }

  getUploadedFile(event: { target: DataTransfer; }) {
    const target: DataTransfer = event.target as DataTransfer;
    if (target.files.length !== 1) throw new Error('Choose one Excel file');
    if (!target.files[0].name.toLowerCase().match(/\.xlsx?$/)) throw new Error('Please choose an Excel file');
    return target.files[0];
  }

  handleSheetData(data) {
    const workBook = this.excelService.readWorkBook(data, { type: 'binary', cellDates: true });
    const worksheet = this.excelService.getWorkSheet(workBook);
    if (!worksheet) throw new Error('Add a worksheet');
    const excelHeaders = this.excelService.getHeaderRow(worksheet);
    if (!excelHeaders.length) throw new Error('Add headers');
    return { worksheet, excelHeaders };
  }

  cancelUpload() {
    this.fileUploadForm.patchValue({ coacheeFile: undefined });
    this.coacheeDataSource = this.createTableDataSource([]);
    this.registrationDataSource = this.createTableDataSource([]);
    this.coachees = [];
    this.registrationRows = [];
    this.registrationErrors = [];
    this.totalCoachees = 0;
    this.uploadMode = 'users';
    this.selectedUserFileName = '';
    this.selectedRegistrationFileName = '';
    if (this.coacheeFile) this.coacheeFile.nativeElement.value = '';
    if (this.registrationFile) this.registrationFile.nativeElement.value = '';
  }
}
