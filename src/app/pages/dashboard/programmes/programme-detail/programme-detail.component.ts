import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { ProgrammesService } from 'src/app/services';
import { DateValidator, DirtyValues, ValueAssigner } from 'src/app/_helpers';
import { parse as dateParse, format, parseISO, subYears } from "date-fns";
import { ExcelService } from 'src/app/services/excel.service';
@Component({
  selector: 'app-programme-detail',
  templateUrl: './programme-detail.component.html',
  styleUrls: ['./programme-detail.component.scss']
})
export class ProgrammeDetailComponent implements OnInit {

  // Set the minimum  and maxnimum  years
  minDate = new Date()
  currentProgramme: any;
  isSubmitted = false
  programmeCategories = [];
  isAddMode = true;
  loading$ = false;
  firstTimeLoading = true;
  valueAssigner: ValueAssigner
  managementMode = 'Add new programme';
  programmeForm: FormGroup;
  timepickerFormat = 24;
  freeConditions = [
    { value: true, name: 'All' },
    { value: false, name: 'Paid' }
  ];
  onlineConditions = [
    { value: true, name: 'Online' },
    { value: false, name: 'Offline' }
  ];
  commonFields = [
    'name',
    'capacity',
    'description',
    'trainer',
    'personInCharge',
    'contactNumber',
    'isFree',
    'isOnline',
    'password',
    'venueOrLink'
  ];
  constructor(
    private router: Router,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private programmeService: ProgrammesService,
    private snackBar: MatSnackBar,
    private excelService: ExcelService
  ) {
    // Set the minimum  and maxnimum  years
    if (this.router
      .getCurrentNavigation()
      .extras.state) {
      this.isAddMode = this.router
        .getCurrentNavigation()
        .extras.state
        .isAddMode
    }
    this.valueAssigner = new ValueAssigner(this.isAddMode)
    if (!this.isAddMode) {
      this.managementMode = 'Programme Details';
      this.currentProgramme = this.activatedRoute
        .snapshot
        .data['programme'];
    }
  }

  ngOnInit() {
    //create corporateAdmin form
    this.createProgrammeForm();
    this.programmeService
      .getProgrammeCategories('ScheduledProgrammeCategory')
      .subscribe(categories => {
        this.programmeCategories = categories;
        this.valueAssigner.assignValueToField(this.f, 'category', this.programmeCategories, this.currentProgramme)
        if (!this.isAddMode) {
          this.assignValues(this.commonFields);
          this.programmeForm.patchValue({
            date: parseISO(this.currentProgramme.startDate),
            startTime: format(new Date(parseISO(this.currentProgramme.startDate)), 'hh:mm a'),
            endTime: format(new Date(parseISO(this.currentProgramme.endDate)), 'hh:mm a'),
          })
        }
      })
  }
  /**
   * create corporateAdmin form
   */
  createProgrammeForm() {
    this.programmeForm = this.fb.group({
      name: ['', Validators.required],
      date: [new Date().toISOString()],
      startTime: ['12:00 PM', Validators.required],
      endTime: ['12:00 PM', Validators.required],
      capacity: [, [Validators.required, Validators.min(1)]],
      category: ['', Validators.required],
      description: [''],
      trainer: [''],
      personInCharge: [''],
      contactNumber: ['', Validators.pattern(/^\d{7,15}$/)],
      isFree: [true, Validators.required],
      isOnline: [true, Validators.required],
      password: [''],
      venueOrLink: ['', Validators.required]
    },
      {
        validator: DateValidator('startTime', 'endTime')
      }
    )
  }

  // get controls of corporateAdmin form 
  get f() {
    return this.programmeForm.controls
  }
  updateProgramme() {
    if (this.programmeForm.invalid) {
      this.snackBar.open('Please fill in required fields', '', { duration: 2000 });
      return
    }
    let { startTime,
      endTime,
      date,
      ...otherProperties } = this.programmeForm.value

    let startDate = dateParse(startTime, 'hh:mm a', new Date(date)).toISOString();
    console.log(startDate)
    let endDate = dateParse(endTime, 'hh:mm a', new Date(date)).toISOString();
    let programmeProperties = {
      startDate,
      endDate,
      ...otherProperties
    }
    if (this.isAddMode) {
      this.programmeService
        .addProgramme(programmeProperties)
        .subscribe(res => {
          if (res) {
            this.programmeForm.markAllAsTouched();
          }
          this.snackBar.open('Created successfully', '', { duration: 2000 })
        })
    } else {
      this.editProgramme()
    }
  }

  goBack() {
    this.router.navigateByUrl('/dashboard/programmes')
  }

  /**
  * assign values to fields
  * @param fields 
  */
  assignValues(fieldArray) {
    fieldArray.forEach(field => {
      this.programmeForm.patchValue({
        [field]: this.currentProgramme[field]
      })
    })
  }

  /**
   * edit corporateAdmin
   * @param form 
   * @param posterFile 
   */
  editProgramme() {
    let changedValues = DirtyValues.getDirtyValues(this.programmeForm)
    let changedPropertites = {}
    if (Object.keys(changedValues).length > 0) {
      let isStartTimeChanged = Object.keys(changedValues).includes('startTime')
      let isDateChanged = Object.keys(changedValues).includes('date')
      let isEndTimeChanged = Object.keys(changedValues).includes('endTime')
      if (!isDateChanged && isStartTimeChanged && !isEndTimeChanged) {
        let startDate = dateParse(changedValues['startTime'], 'hh:mm a', new Date(this.f['date'].value)).toISOString();
        delete changedValues['startTime'];
        changedPropertites = {
          startDate,
          ...changedValues
        }
      } else if (!isDateChanged && !isStartTimeChanged && isEndTimeChanged) {
        let endDate = dateParse(changedValues['endTime'], 'hh:mm a', new Date(this.f['date'].value)).toISOString();
        delete changedValues['endTime'];
        changedPropertites = {
          endDate,
          ...changedValues
        }
      } else if (!isDateChanged && !isStartTimeChanged && !isEndTimeChanged) {
        changedPropertites = changedValues
      } else {
        let startDate = dateParse(this.f['startTime'].value, 'hh:mm a', new Date(this.f['date'].value))
          .toISOString();
        let endDate = dateParse(this.f['endTime'].value, 'hh:mm a', new Date(this.f['date'].value))
          .toISOString();
        if (isStartTimeChanged) {
          delete changedValues['startTime'];
        }
        if (isEndTimeChanged) {
          delete changedValues['endTime'];
        }
        if (isDateChanged) {
          delete changedValues['date'];
        }
        changedPropertites = {
          startDate,
          endDate,
          ...changedValues
        }
      }
      this.programmeService
        .updateProgramme(this.currentProgramme._id, changedPropertites)
        .subscribe(message => {
          if (message) {
            this.snackBar.open('Update successfully', '', { duration: 2000 })
          }
        })
    }
  }

  /**
   * download registered users
   */
  async exportRegisteredUsers() {
    console.log(this.currentProgramme)
    this.programmeService
      .getRegisteredUsersByProgrammeId(this.currentProgramme._id)
      .subscribe(users => {
        let description = ['Registration list'];
        let headerArray = ['No.', 'Full name', 'Email'];
        this.currentProgramme.name
        let userDataArray = [];
        let blankLine = ['']
        let startDate = format(new Date(parseISO(this.currentProgramme.startDate)), 'dd/MMM/yyyy')
        let startTime = format(new Date(parseISO(this.currentProgramme.startDate)), 'hh:mm a')
        userDataArray.push(description);
        userDataArray.push(blankLine)
        userDataArray.push(['Date:', startDate]);
        userDataArray.push(['Time:', startTime]);
        userDataArray.push(['Programme name:', this.currentProgramme.name])
        userDataArray.push(blankLine)
        userDataArray.push(headerArray);

        if (users.length > 0) {
          let i = 1
          users.forEach(user => {
            let dataArray = [i, user.fullName, user.email]
            userDataArray.push(dataArray)
            i++;
          })
        } else {
          userDataArray.push(['No registered users'])
        }
        this.exportExcel('Registration list - Flourish HR panel', userDataArray)
      })
  }

  /**
   * download feedback reports
   */
  exportFeedback() {
    this.programmeService
      .getCommentsByProgrammeId(this.currentProgramme._id)
      .subscribe(comments => {
        let description = ['Feedack Report']
        let blankLine = ['']
        let startDate = format(new Date(parseISO(this.currentProgramme.startDate)), 'dd/MMM/yyyy')
        let startTime = format(new Date(parseISO(this.currentProgramme.startDate)), 'hh:mm a')
        let userDataArray = [];
        let averageScore = ['Average score:', 'XX'];
        let netPromoterScore = ['Net Promoter Score:', 'XX%'];
        userDataArray.push(description);
        userDataArray.push(blankLine);
        userDataArray.push(['Date', startDate]);
        userDataArray.push(['Time', startTime]);
        userDataArray.push(['Programme name:', this.currentProgramme.name]);
        userDataArray.push(blankLine);
        userDataArray.push(averageScore);
        userDataArray.push(netPromoterScore);
        userDataArray.push(blankLine)
        let headerArray = ['No.', 'Name of user', 'Email', 'NPS', 'Content'];
        userDataArray.push(headerArray);
        if (comments.length > 0) {
          let totalScore = 0;
          let totalComments = 0;
          let detractors = 0;
          let promoters = 0;
          let i = 1;
          comments.forEach(comment => {
            let rating = parseInt(comment['rating']);
            let selfNPS = ''
            totalScore = totalScore + rating;
            totalComments += 1;
            if (rating >= 9) {
              promoters += 1;
              selfNPS = 'promoter';
            } else if (rating >= 7 && rating <= 8) {
              selfNPS = 'passive'
            } else {
              detractors += 1;
              selfNPS = 'detractor'
            }
            let dataArray = [i, comment.user.fullName, comment.user.email, selfNPS, comment.content]
            userDataArray.push(dataArray);
            i++;
          })
          let realAverageScore = (totalScore / totalComments).toFixed(2);
          let realNPS = (100 * (promoters - detractors) / totalComments).toFixed(2);
          userDataArray.splice(6, 1, ['Average score:', realAverageScore]);
          userDataArray.splice(7, 1, ['Net Promoter Score:', realNPS]);
        } else {
          userDataArray.push(['No comments'])
        }
        this.exportExcel('feedback', userDataArray)
      })
  }

  /**
   * export excel
   * @param fileName 
   * @param data 
   */
  async exportExcel(fileName, data) {
    await this.excelService.exportExcel(data, fileName)
  }
}
