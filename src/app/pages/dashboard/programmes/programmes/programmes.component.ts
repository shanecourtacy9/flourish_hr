import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { NavigationExtras, Router } from "@angular/router";
import { debounceTime, distinctUntilChanged, tap } from "rxjs/operators";
import { ProgrammesDatasource } from "src/app/models";
import { AuthService, ProgrammesService } from "src/app/services";
import * as dateFns from "date-fns";
import { FormBuilder, FormGroup } from "@angular/forms";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatDialog } from "@angular/material/dialog";
import {
  ConfirmDialogComponent,
  ConfirmDialogModel,
} from "src/app/pages/shared/confirm-dialog/confirm-dialog.component";
import { ExcelService } from "src/app/services/excel.service";

@Component({
  selector: "app-programmes",
  templateUrl: "./programmes.component.html",
  styleUrls: ["./programmes.component.scss"],
})
export class ProgrammesComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild("input", { static: true }) input: ElementRef;
  programmesDatasource: ProgrammesDatasource;
  initializedLoading = false;
  displayedColumns: string[] = [
    "name",
    "time",
    "registration",
    "status",
    "actions",
  ];
  programmes = [];
  totalProgrammes = 0;
  loading$ = true;
  rangeFormGroup: FormGroup;
  undo: boolean;
  isMember = false;
  viewMode: 'cards' | 'table' = 'cards';
  constructor(
    private programmesService: ProgrammesService,
    private router: Router,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private authService: AuthService,
    private excelService: ExcelService
  ) {
    this.programmesDatasource = new ProgrammesDatasource(
      this.programmesService
    );
  }
  ngOnInit() {
    this.authService.getProfile().subscribe((user) => {
      this.isMember = user["isMember"];
      var company = user["company"];

      // if (!this.isMember) {
      //   if (company != null) {
      //     if (new Date(company["configs"]["membershipExpireAt"]) > new Date()) {
            this.isMember = true;
      //     }
      //   }
      // }
      if (this.isMember) {
        this.programmesService
          .firstLoading("", "", "desc", 0, 20)
          .subscribe((res) => {
            this.programmes = this.convertDateProperties(res[0]);
            this.totalProgrammes = res[1];
            this.initializedLoading = true;
          });
        setTimeout(() => {
          this.programmesService.loading$.subscribe((loading) => {
            this.loading$ = loading;
          });
        });
        this.createRangeFormGroup();
      } else {
        this.initializedLoading = true;
      }
    });
  }

  createRangeFormGroup() {
    this.rangeFormGroup = this.fb.group({
      startDate: [""],
      endDate: [""],
    });
  }
  //get Programmes by conditions
  getProgrammes(startDate, endDate, sortDirection, pageIndex, pageSize) {
    this.programmesDatasource
      .getProgrammes(startDate, endDate, sortDirection, pageIndex, pageSize)
      .subscribe((programmes) => {
        this.programmes = this.convertDateProperties(programmes);
      });
  }
  /**
   * event
   */
  ngAfterViewInit(): void {
    //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
    //Add 'implements AfterViewInit' to the class.
    if (this.isMember) {
      this.rangeFormGroup.valueChanges
        .pipe(
          debounceTime(1000),
          distinctUntilChanged(),
          tap(() => {
            this.paginator.pageIndex = 0;
          })
        )
        .subscribe((dateRange) => {
          let startDate = "";
          let endDate = "";
          if (
            (dateRange["startDate"] && dateRange["endDate"]) ||
            (!dateRange["startDate"] && !dateRange["endDate"])
          ) {
            if (dateRange["startDate"] !== null) {
              startDate = dateRange.startDate.toISOString();
              endDate = dateRange.endDate.toISOString();
              this.getProgrammes(
                startDate,
                endDate,
                this.sort.direction,
                this.paginator.pageIndex,
                this.paginator.pageSize
              );
            } else {
              this.getProgrammes(
                "",
                "",
                this.sort.direction,
                this.paginator.pageIndex,
                this.paginator.pageSize
              );
            }
          }
        });

      this.paginator.page.subscribe(() => {
        this.getProgrammes(
          this.f["startDate"].value,
          this.f["endDate"].value,
          this.sort.direction,
          this.paginator.pageIndex,
          this.paginator.pageSize
        );
      });
    }
  }

  // get controls of corporateAdmin form
  get f() {
    return this.rangeFormGroup.controls;
  }
  /**
   * edit Programme
   * @param row
   */
  editProgramme(programme) {
    const navigationState: NavigationExtras = {
      state: {
        isAddMode: false,
      },
    };
    this.router.navigate(
      [`/dashboard/programmes/edit/${programme._id}`],
      navigationState
    );
  }
  /**
   * go to Programme detail page
   */
  addNewProgramme() {
    const navigationState: NavigationExtras = {
      state: {
        isAddMode: true,
      },
    };
    this.router.navigate([`/dashboard/programmes/add`], navigationState);
  }

  deleteProgramme(row) {
    this.openConfirmDialog(row);
  }

  gotoBatchUploadProgrammesPage() {
    this.router.navigateByUrl("/dashboard/programmes/batchupload");
  }
  convertDateProperties(programmes: any[]) {
    if (programmes.length > 0) {
      let convertedProgrammes = programmes.reduce((acc, current) => {
        let isOutdated = false;
        let isClicked = false;
        let isLower = false;
        if (
          Math.floor(current.registeredUsers.length / current.capacity) * 10 <
          5
        ) {
          isLower = true;
        }
        if (new Date(current["startDate"]) < new Date()) {
          isOutdated = true;
        }
        let convertedProgramme = {
          isOutdated,
          isClicked,
          isLower,
          date: dateFns.parseISO(current.startDate),
          startTime: dateFns.format(
            new Date(dateFns.parseISO(current.startDate)),
            "hh:mm a"
          ),
          endTime: dateFns.format(
            new Date(dateFns.parseISO(current.endDate)),
            "hh:mm a"
          ),
          ...current,
        };
        return [...acc, convertedProgramme];
      }, []);
      return convertedProgrammes;
    }
  }

  openConfirmDialog(programme) {
    const message = `Are you sure you want to delete?`;

    const dialogData = new ConfirmDialogModel(
      "Confirm Delete programme",
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
        this.programmesService
          .updateProgramme(programme._id, { isObsolete: true })
          .subscribe((res) => {
            if (res) {
              this.programmesService
                .firstLoading("", "", "desc", 0, 20)
                .subscribe((res) => {
                  this.programmes = this.convertDateProperties(res[0]);
                  this.totalProgrammes = res[1];
                });
              this.snackBar.open("deleted", "", { duration: 2000 });
            }
          });
      }
    });
  }

  recruitUsrs(row) {
    const message = `Are you sure you want to send emails to all?`;

    const dialogData = new ConfirmDialogModel(
      "Confirm send emails to all",
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
        row.isClicked = true;
        this.programmesService.sendRecruitEmails(row).subscribe((res) => {
          row.isClicked = false;
          if (res) {
            this.snackBar.open("send successfully", "", { duration: 2000 });
          }
        });
      }
    });
  }

  reminderUsers(row) {
    const message = `Are you sure you want to send emails to registered users?`;

    const dialogData = new ConfirmDialogModel(
      "Confirm send emails to registered users",
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
        row.isClicked = true;
        this.programmesService.sendReminderEmails(row).subscribe((res) => {
          row.isClicked = false;
          if (res) {
            this.snackBar.open("send successfully", "", { duration: 2000 });
          }
        });
      }
    });
  }

  // New methods for modern UI
  getTotalProgrammes(): number {
    return this.programmes?.length || 0;
  }

  getUpcomingProgrammes(): number {
    const now = new Date();
    return this.programmes?.filter(programme => {
      const programmeDate = new Date(programme.date);
      return programmeDate > now;
    })?.length || 0;
  }

  getTotalParticipants(): number {
    return this.programmes?.reduce((total, programme) => {
      return total + (programme.registeredUsers?.length || 0);
    }, 0) || 0;
  }

  getRegistrationPercentage(programme: any): number {
    if (!programme.capacity || programme.capacity === 0) return 0;
    const registered = programme.registeredUsers?.length || 0;
    return Math.round((registered / programme.capacity) * 100);
  }

  getProgressBarColor(programme: any): string {
    const percentage = this.getRegistrationPercentage(programme);
    if (percentage >= 80) return 'primary';
    if (percentage >= 50) return 'accent';
    return 'warn';
  }

  getProgrammeStatus(programme: any): string {
    if (programme.isOutdated) return 'Completed';
    
    const now = new Date();
    const programmeDate = new Date(programme.date);
    
    if (programmeDate > now) {
      const daysUntil = Math.ceil((programmeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil <= 7) return 'Starting Soon';
      return 'Upcoming';
    }
    
    return 'In Progress';
  }

  getProgrammeStatusClass(programme: any): string {
    const status = this.getProgrammeStatus(programme);
    switch (status) {
      case 'Completed': return 'completed';
      case 'Starting Soon': return 'starting-soon';
      case 'Upcoming': return 'upcoming';
      case 'In Progress': return 'in-progress';
      default: return 'upcoming';
    }
  }

  getProgrammeStatusIcon(programme: any): string {
    const status = this.getProgrammeStatus(programme);
    switch (status) {
      case 'Completed': return 'check_circle';
      case 'Starting Soon': return 'schedule';
      case 'Upcoming': return 'event';
      case 'In Progress': return 'play_circle';
      default: return 'event';
    }
  }
}
