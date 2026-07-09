import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute, Router } from "@angular/router";
import { ProgrammesService, NotificationService, UsersService } from "src/app/services";
import { DateValidator, DirtyValues, ValueAssigner } from "src/app/_helpers";
import { parse as dateParse, format, parseISO, subYears, isEqual } from "date-fns";
import { ExcelService } from "src/app/services/excel.service";
import { FormResponseService } from "src/app/services/form-response.service";
import {
  ConfirmDialogComponent,
  ConfirmDialogModel,
} from "src/app/pages/shared/confirm-dialog/confirm-dialog.component";
import { environment } from 'src/environments/environment';
@Component({
  selector: "app-programme-detail",
  templateUrl: "./programme-detail.component.html",
  styleUrls: ["./programme-detail.component.scss"],
})
export class ProgrammeDetailComponent implements OnInit {
  // Set the minimum  and maxnimum  years
  minDate = new Date();
  currentProgramme: any;
  isSubmitted = false;
  programmeCategories = [];
  isAddMode = true;
  loading$ = false;
  firstTimeLoading = true;
  valueAssigner: ValueAssigner;
  managementMode = "Add new programme";
  programmeForm: FormGroup;
  timepickerFormat = 24;
  originalStartDate: string;
  originalEndDate: string;
  registeredUsers: any[] = [];
  registeredUsersLoading = false;
  waitlistUsers: any[] = [];
  waitlistLoading = false;
  attendanceUserEmail = '';
  attendanceUserLoading = false;
  attendanceUpdatingUserIds = new Set<string>();
  freeConditions = [
    { value: true, name: "All" },
    { value: false, name: "Paid" },
  ];
  onlineConditions = [
    { value: true, name: "Online" },
    { value: false, name: "Offline" },
  ];
  registrationConditions = [
    { value: true, name: "Registration Required" },
    { value: false, name: "No Registration" },
  ];
  commonFields = [
    "name",
    "capacity",
    "description",
    "trainer",
    "personInCharge",
    "contactNumber",
    "isFree",
    "isOnline",
    "password",
    "venueOrLink",
    "registrationRequired",
  ];
  constructor(
    private router: Router,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private programmeService: ProgrammesService,
    private snackBar: MatSnackBar,
    private excelService: ExcelService,
    private formResponseService: FormResponseService,
    private notificationService: NotificationService,
    private dialog: MatDialog,
    private usersService: UsersService
  ) {
    // Set the minimum  and maxnimum  years
    if (this.router.getCurrentNavigation().extras.state) {
      this.isAddMode =
        this.router.getCurrentNavigation().extras.state.isAddMode;
    }
    this.valueAssigner = new ValueAssigner(this.isAddMode);
    if (!this.isAddMode) {
      this.managementMode = "Programme Details";
      this.currentProgramme = this.activatedRoute.snapshot.data["programme"];
    }
  }

  ngOnInit() {
    //create corporateAdmin form
    this.createProgrammeForm();
    this.programmeService
      .getProgrammeCategories("ScheduledProgrammeCategory")
      .subscribe((categories) => {
        this.programmeCategories = categories;
        this.valueAssigner.assignValueToField(
          this.f,
          "category",
          this.programmeCategories,
          this.currentProgramme
        );
        if (!this.isAddMode) {
          this.assignValues(this.commonFields);
          this.originalStartDate = this.currentProgramme.startDate;
          this.originalEndDate = this.currentProgramme.endDate;
          this.programmeForm.patchValue({
            date: parseISO(this.currentProgramme.startDate),
            startTime: format(
              new Date(parseISO(this.currentProgramme.startDate)),
              "hh:mm a"
            ),
            endTime: format(
              new Date(parseISO(this.currentProgramme.endDate)),
              "hh:mm a"
            ),
          });
          this.loadRegisteredUsers();
          this.loadWaitlistUsers();
        }
      });
  }

  /**
   * load registered users for current programme
   */
  loadRegisteredUsers() {
    if (!this.currentProgramme?._id) return;
    this.registeredUsersLoading = true;
    this.programmeService
      .getAttendanceUsersByProgrammeId(this.currentProgramme._id)
      .subscribe({
        next: (users) => {
          this.registeredUsers = users || [];
          this.registeredUsersLoading = false;
        },
        error: () => {
          this.registeredUsersLoading = false;
        },
      });
  }

  isAttendanceClosed() {
    return !this.currentProgramme || !this.currentProgramme.endDate || new Date(this.currentProgramme.endDate) < new Date();
  }

  getAttendanceUrl() {
    const programmeId = encodeURIComponent(String(this.currentProgramme && this.currentProgramme._id || ''));
    const eventName = encodeURIComponent(this.currentProgramme && this.currentProgramme.name || '');
    return `${environment.attendanceUrl}?id=${programmeId}&event=${eventName}`;
  }

  markAttendance(user: any) {
    if (!user || this.attendanceUpdatingUserIds.has(user._id)) return;
    this.attendanceUpdatingUserIds.add(user._id);
    this.programmeService.markAttendance(this.currentProgramme._id, user._id).subscribe({
      next: () => {
        this.snackBar.open(`${user.fullName || user.email} marked as attended`, '', { duration: 2500 });
        this.attendanceUpdatingUserIds.delete(user._id);
        this.loadRegisteredUsers();
      },
      error: (error) => {
        this.attendanceUpdatingUserIds.delete(user._id);
        this.snackBar.open(error.error && error.error.message || 'Unable to mark attendance', '', { duration: 3500 });
      }
    });
  }

  markUnregisteredCompanyUser() {
    const email = this.attendanceUserEmail.trim();
    if (!email) {
      this.snackBar.open('Enter a company user email address', '', { duration: 2500 });
      return;
    }
    this.attendanceUserLoading = true;
    this.usersService.getUsers(email, 'asc', 0, 10).subscribe({
      next: (users) => {
        const user = (users || []).find((candidate) => candidate.email && candidate.email.toLowerCase() === email.toLowerCase());
        this.attendanceUserLoading = false;
        if (!user) {
          this.snackBar.open('No user in this company has that email address', '', { duration: 3000 });
          return;
        }
        this.attendanceUserEmail = '';
        this.markAttendance(user);
      },
      error: () => {
        this.attendanceUserLoading = false;
        this.snackBar.open('Unable to look up company users', '', { duration: 3000 });
      }
    });
  }

  /**
   * load waitlisted users for current programme
   */
  loadWaitlistUsers() {
    if (!this.currentProgramme?._id) return;
    this.waitlistLoading = true;
    this.programmeService
      .getWaitlistUsersByProgrammeId(this.currentProgramme._id)
      .subscribe({
        next: (users) => {
          this.waitlistUsers = users || [];
          this.waitlistLoading = false;
        },
        error: () => {
          this.waitlistLoading = false;
        },
      });
  }

  /**
   * remove a registered user from this programme
   */
  onRemoveRegisteredUser(user: any) {
    const message = `Remove ${user?.fullName || 'this user'} from this programme?`;
    const dialogData = new ConfirmDialogModel(
      "Confirm removal",
      message
    );
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: "500px",
      data: dialogData,
      hasBackdrop: true,
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((dialogResult) => {
      if (dialogResult) {
        this.programmeService
          .removeRegisteredUserFromProgramme(
            this.currentProgramme._id,
            user._id
          )
          .subscribe({
            next: () => {
              this.snackBar.open("User removed", "", { duration: 2000 });
              this.loadRegisteredUsers();
            },
            error: () => {
              this.snackBar.open("Failed to remove user", "", { duration: 2000 });
            },
          });
      }
    });
  }

  /**
   * notify all waitlisted users
   */
  onNotifyWaitlist() {
    const message = `Notify ${this.waitlistUsers.length} waitlisted user(s) to register?`;
    const dialogData = new ConfirmDialogModel(
      "Notify waitlist",
      message
    );
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: "500px",
      data: dialogData,
      hasBackdrop: true,
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((dialogResult) => {
      if (dialogResult) {
        const subject = `Slots available - ${this.currentProgramme?.name || 'Programme'}`;
        const body = `Good news! Slots are now available for ${this.currentProgramme?.name}. Please log in to the platform and register to secure your spot.`;
        this.waitlistLoading = true;
        this.programmeService
          .notifyWaitlist(this.currentProgramme._id, { subject, message: body })
          .subscribe({
            next: () => {
              this.snackBar.open("Waitlist notified", "", { duration: 2500 });
              this.waitlistLoading = false;
            },
            error: () => {
              this.snackBar.open("Failed to notify waitlist", "", { duration: 3000 });
              this.waitlistLoading = false;
            },
          });
      }
    });
  }
  /**
   * create corporateAdmin form
   */
  createProgrammeForm() {
    this.programmeForm = this.fb.group(
      {
        name: ["", Validators.required],
        date: [new Date().toISOString()],
        startTime: ["12:00 PM", Validators.required],
        endTime: ["12:00 PM", Validators.required],
        capacity: [, [Validators.required, Validators.min(1)]],
        category: ["", Validators.required],
        description: [""],
        trainer: [""],
        personInCharge: [""],
        contactNumber: ["", Validators.pattern(/^\d{7,15}$/)],
        isFree: [true, Validators.required],
        isOnline: [true, Validators.required],
        password: [""],
        venueOrLink: ["", Validators.required],
        registrationRequired: [true, Validators.required],
      },
      {
        validator: DateValidator("startTime", "endTime"),
      }
    );
  }

  // get controls of corporateAdmin form
  get f() {
    return this.programmeForm.controls;
  }
  updateProgramme() {
    if (this.programmeForm.invalid) {
      this.snackBar.open("Please fill in required fields", "", {
        duration: 2000,
      });
      return;
    }
    let { startTime, endTime, date, ...otherProperties } =
      this.programmeForm.value;

    let startDate = dateParse(
      startTime,
      "hh:mm a",
      new Date(date)
    ).toISOString();
    let endDate = dateParse(endTime, "hh:mm a", new Date(date)).toISOString();
    let programmeProperties = {
      startDate,
      endDate,
      ...otherProperties,
    };
    if (this.isAddMode) {
      this.programmeService
        .addProgramme(programmeProperties)
        .subscribe((res) => {
          if (res) {
            this.programmeForm.markAllAsTouched();
          }
          this.snackBar.open("Created successfully", "", { duration: 2000 });
        });
    } else {
      this.editProgramme();
    }
  }

  goBack() {
    this.router.navigateByUrl("/dashboard/programmes");
  }

  /**
   * assign values to fields
   * @param fields
   */
  assignValues(fieldArray) {
    fieldArray.forEach((field) => {
      this.programmeForm.patchValue({
        [field]: this.currentProgramme[field],
      });
    });
  }

  /**
   * edit corporateAdmin
   * @param form
   * @param posterFile
   */
  editProgramme() {
    let changedValues = DirtyValues.getDirtyValues(this.programmeForm);
    let changedPropertites = {};
    if (Object.keys(changedValues).length > 0) {
      let isStartTimeChanged = Object.keys(changedValues).includes("startTime");
      let isDateChanged = Object.keys(changedValues).includes("date");
      let isEndTimeChanged = Object.keys(changedValues).includes("endTime");
      
      // Calculate new dates for comparison
      let newStartDate: string;
      let newEndDate: string;
      
      if (!isDateChanged && isStartTimeChanged && !isEndTimeChanged) {
        newStartDate = dateParse(
          changedValues["startTime"],
          "hh:mm a",
          new Date(this.f["date"].value)
        ).toISOString();
        newEndDate = this.originalEndDate;
        delete changedValues["startTime"];
        changedPropertites = {
          startDate: newStartDate,
          ...changedValues,
        };
      } else if (!isDateChanged && !isStartTimeChanged && isEndTimeChanged) {
        newStartDate = this.originalStartDate;
        newEndDate = dateParse(
          changedValues["endTime"],
          "hh:mm a",
          new Date(this.f["date"].value)
        ).toISOString();
        delete changedValues["endTime"];
        changedPropertites = {
          endDate: newEndDate,
          ...changedValues,
        };
      } else if (!isDateChanged && !isStartTimeChanged && !isEndTimeChanged) {
        changedPropertites = changedValues;
        newStartDate = this.originalStartDate;
        newEndDate = this.originalEndDate;
      } else {
        newStartDate = dateParse(
          this.f["startTime"].value,
          "hh:mm a",
          new Date(this.f["date"].value)
        ).toISOString();
        newEndDate = dateParse(
          this.f["endTime"].value,
          "hh:mm a",
          new Date(this.f["date"].value)
        ).toISOString();
        if (isStartTimeChanged) {
          delete changedValues["startTime"];
        }
        if (isEndTimeChanged) {
          delete changedValues["endTime"];
        }
        if (isDateChanged) {
          delete changedValues["date"];
        }
        changedPropertites = {
          startDate: newStartDate,
          endDate: newEndDate,
          ...changedValues,
        };
      }

      // Check if date has changed and send notification
      const hasDateChanged = !isEqual(new Date(this.originalStartDate), new Date(newStartDate)) || 
                            !isEqual(new Date(this.originalEndDate), new Date(newEndDate));

      this.programmeService
        .updateProgramme(this.currentProgramme._id, changedPropertites)
        .subscribe((message) => {
          if (message) {
            this.snackBar.open("Update successfully", "", { duration: 2000 });
            
            // Send notification if date changed
            if (hasDateChanged) {
              this.sendDateChangeNotification(newStartDate, newEndDate);
            } else if (Object.keys(changedValues).length > 0) {
              // Send notification for other changes
              this.sendDetailsChangeNotification(changedValues);
            }
          }
        });
    }
  }

  /**
   * Send notification when programme date changes
   */
  private sendDateChangeNotification(newStartDate: string, newEndDate: string) {
    const oldDateFormatted = format(new Date(this.originalStartDate), "dd/MM/yyyy 'at' hh:mm a");
    const newDateFormatted = format(new Date(newStartDate), "dd/MM/yyyy 'at' hh:mm a");
    
    this.notificationService.sendProgrammeDateChangeNotification(
      this.currentProgramme._id,
      oldDateFormatted,
      newDateFormatted,
      this.currentProgramme.name
    ).subscribe({
      next: (response) => {
        console.log('Date change notification sent successfully', response);
        this.snackBar.open("Registered users have been notified of the date change", "", { duration: 3000 });
      },
      error: (error) => {
        console.error('Error sending date change notification:', error);
        this.snackBar.open("Programme updated but failed to notify users", "", { duration: 3000 });
      }
    });
  }

  /**
   * Send notification when programme details change
   */
  private sendDetailsChangeNotification(changes: any) {
    const changeDescriptions = this.getChangeDescriptions(changes);
    
    this.notificationService.sendProgrammeDetailsChangeNotification(
      this.currentProgramme._id,
      changeDescriptions,
      this.currentProgramme.name
    ).subscribe({
      next: (response) => {
        console.log('Details change notification sent successfully', response);
        this.snackBar.open("Registered users have been notified of the changes", "", { duration: 3000 });
      },
      error: (error) => {
        console.error('Error sending details change notification:', error);
        this.snackBar.open("Programme updated but failed to notify users", "", { duration: 3000 });
      }
    });
  }

  /**
   * Get human-readable descriptions of changes
   */
  private getChangeDescriptions(changes: any): string[] {
    const descriptions: string[] = [];
    
    Object.keys(changes).forEach(key => {
      switch(key) {
        case 'name':
          descriptions.push(`Programme name changed to: ${changes[key]}`);
          break;
        case 'description':
          descriptions.push('Programme description has been updated');
          break;
        case 'trainer':
          descriptions.push(`Trainer changed to: ${changes[key]}`);
          break;
        case 'venueOrLink':
          descriptions.push('Venue or online link has been updated');
          break;
        case 'capacity':
          descriptions.push(`Capacity changed to: ${changes[key]} participants`);
          break;
        case 'isOnline':
          descriptions.push(`Programme type changed to: ${changes[key] ? 'Online' : 'Offline'}`);
          break;
        case 'isFree':
          descriptions.push(`Access changed to: ${changes[key] ? 'Free' : 'Paid'}`);
          break;
        case 'password':
          descriptions.push('Programme password has been updated');
          break;
        case 'personInCharge':
          descriptions.push(`Person in charge changed to: ${changes[key]}`);
          break;
        case 'contactNumber':
          descriptions.push(`Contact number changed to: ${changes[key]}`);
          break;
        default:
          descriptions.push(`${key} has been updated`);
      }
    });
    
    return descriptions;
  }

  /**
   * download registered users
   */
  async exportRegisteredUsers() {
    this.programmeService
      .getRegisteredUsersByProgrammeId(this.currentProgramme._id)
      .subscribe((users) => {
        let description = ["Registration list"];
        let headerArray = ["No.", "Full name", "Email"];
        this.currentProgramme.name;
        let userDataArray = [];
        let blankLine = [""];
        let startDate = format(
          new Date(parseISO(this.currentProgramme.startDate)),
          "dd/MMM/yyyy"
        );
        let startTime = format(
          new Date(parseISO(this.currentProgramme.startDate)),
          "hh:mm a"
        );
        userDataArray.push(description);
        userDataArray.push(blankLine);
        userDataArray.push(["Date:", startDate]);
        userDataArray.push(["Time:", startTime]);
        userDataArray.push(["Programme name:", this.currentProgramme.name]);
        userDataArray.push(blankLine);
        userDataArray.push(headerArray);

        if (users.length > 0) {
          let i = 1;
          users.forEach((user) => {
            let dataArray = [i, user.fullName, user.email];
            userDataArray.push(dataArray);
            i++;
          });
        } else {
          userDataArray.push(["No registered users"]);
        }
        this.exportExcel(
          "Registration list - Flourish HR panel",
          userDataArray
        );
      });
  }

  /**
   * download feedback reports
   */
  exportFeedback() {
    this.formResponseService
      .getResponseByProgrammeId(this.currentProgramme._id)
      .subscribe((responses) => {
        let description = ["Feedack Report"];
        let blankLine = [""];
        let startDate = format(
          new Date(parseISO(this.currentProgramme.startDate)),
          "dd/MMM/yyyy"
        );
        let startTime = format(
          new Date(parseISO(this.currentProgramme.startDate)),
          "hh:mm a"
        );

        let headerArray = ["No.", "Name of user", "Email", "NPS"];

        if (responses.length > 0) {
          for (const option of responses[0]?.response) {
            if (option?.controlType != "label") {
              headerArray.push(option?.label);
            }
          }
        }
        let userDataArray = [];
        let averageScore = ["Average score:", "XX"];
        let netPromoterScore = ["Net Promoter Score:", "XX%"];
        userDataArray.push(description);
        userDataArray.push(blankLine);
        userDataArray.push(["Date", startDate]);
        userDataArray.push(["Time", startTime]);
        userDataArray.push(["Programme name:", this.currentProgramme.name]);
        userDataArray.push(blankLine);
        userDataArray.push(averageScore);
        userDataArray.push(netPromoterScore);
        userDataArray.push(blankLine);
        if (responses.length > 0) {
          let i = 1;
          let totalScore = 0;
          let totalComments = 0;
          let detractors = 0;
          let promoters = 0;
          for (const response of responses) {
            let dataArray = [
              i,
              response?._coachee?.fullName ?? "Anonymous",
              response?._coachee?.email ?? "",
              "NPS",
            ];
            for (const option of response.response) {
              if (option?.controlType != "label") {
                dataArray.push(option?.value);
                if (
                  option?.label ==
                  "How likely is it that you would recommend this programme to your friend or colleague?"
                ) {
                  let rating = parseInt(option?.value);
                  totalScore = totalScore + rating;
                  totalComments += 1;
                  let selfNPS = "";
                  if (rating >= 9) {
                    promoters += 1;
                    selfNPS = "promoter";
                  } else if (rating >= 7 && rating <= 8) {
                    selfNPS = "passive";
                  } else {
                    detractors += 1;
                    selfNPS = "detractor";
                  }
                  dataArray[3] = selfNPS;
                }
              }
            }
            userDataArray.push(dataArray);
            i++;
          }
          let realAverageScore = (totalScore / totalComments).toFixed(2);
          let realNPS = (
            (100 * (promoters - detractors)) /
            totalComments
          ).toFixed(2);
          userDataArray.splice(6, 1, ["Average score:", realAverageScore]);
          userDataArray.splice(7, 1, ["Net Promoter Score:", realNPS]);
        } else {
          userDataArray.push(["No feedback"]);
        }
        // userDataArray.push(headerArray);
        // if (comments.length > 0) {
        //   let totalScore = 0;
        //   let totalComments = 0;
        //   let detractors = 0;
        //   let promoters = 0;
        //   let i = 1;
        //   comments.forEach((comment) => {
        //     let rating = parseInt(comment["rating"]);
        //     let selfNPS = "";
        //     totalScore = totalScore + rating;
        //     totalComments += 1;
        //     if (rating >= 9) {
        //       promoters += 1;
        //       selfNPS = "promoter";
        //     } else if (rating >= 7 && rating <= 8) {
        //       selfNPS = "passive";
        //     } else {
        //       detractors += 1;
        //       selfNPS = "detractor";
        //     }
        //     let dataArray = [
        //       i,
        //       comment.user.fullName,
        //       comment.user.email,
        //       selfNPS,
        //       comment.content,
        //     ];
        //     userDataArray.push(dataArray);
        //     i++;
        //   });
        //   let realAverageScore = (totalScore / totalComments).toFixed(2);
        //   let realNPS = (
        //     (100 * (promoters - detractors)) /
        //     totalComments
        //   ).toFixed(2);
        //   userDataArray.splice(6, 1, ["Average score:", realAverageScore]);
        //   userDataArray.splice(7, 1, ["Net Promoter Score:", realNPS]);
        // } else {
        //   userDataArray.push(["No comments"]);
        // }
        this.exportExcel("feedback", userDataArray);
      });
  }

  /**
   * export excel
   * @param fileName
   * @param data
   */
  async exportExcel(fileName, data) {
    await this.excelService.exportExcel(data, fileName);
  }
}
