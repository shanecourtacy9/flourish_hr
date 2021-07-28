import { SelectionModel } from '@angular/cdk/collections';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { NavigationExtras, Router } from '@angular/router';
import { fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
import { UsersDatasource } from 'src/app/models';
import { ConfirmDialogComponent, ConfirmDialogModel } from 'src/app/pages/shared/confirm-dialog/confirm-dialog.component';
import { UsersService } from 'src/app/services';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('input', { static: true }) input: ElementRef;
  usersDatasource: UsersDatasource;
  selection = new SelectionModel<any>(true, []);
  onboardedUsers = 0;
  initializedLoading = false
  displayedColumns: string[] = [
    'select',
    'index',
    'email',
    'fullName',
    'isActive',
    'memberStatus',
    'actions'
  ];
  users = [];
  totalUsers = 0
  loading$ = true
  constructor(
    private usersService: UsersService,
    public dialog: MatDialog,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.usersDatasource = new UsersDatasource(this.usersService)
  }
  ngOnInit() {
    this.usersService.
      firstLoading('', 'desc', 0, 20)
      .subscribe(res => {
        this.users = res[1];
        this.totalUsers = res[0];
        this.onboardedUsers = res[2]
        this.initializedLoading = true
      });
    setTimeout(() => {
      this.usersService
        .loading$
        .subscribe(loading => {
          this.loading$ = loading
        })
    })
  }

  //get users by conditions
  getUsers(filter, sortDirection, pageIndex, pageSize) {
    this.usersDatasource
      .getUsers(filter, sortDirection, pageIndex, pageSize)
      .subscribe(users => {
        this.selection.clear()
        this.users = users
      })
  }
  /**
   * event 
   */
  ngAfterViewInit(): void {
    //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
    //Add 'implements AfterViewInit' to the class.
    fromEvent(this.input.nativeElement, 'keyup')
      .pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        tap(() => {
          this.paginator.pageIndex = 0;
        })
      )
      .subscribe(() => {
        this.getUsers(this.input.nativeElement.value, this.sort.direction, this.paginator.pageIndex, this.paginator.pageSize)
      });
    this.paginator.page
      .subscribe(() => {
        this.getUsers(this.input.nativeElement.value, this.sort.direction, this.paginator.pageIndex, this.paginator.pageSize);
      })
  }

  /**
   * edit user
   * @param row 
   */
  editUser(user) {
    const navigationState: NavigationExtras = {
      state: {
        isAddMode: false
      }
    }
    this.router.navigate([`/dashboard/users/edit/${user._id}`], navigationState)
  }
  /**
   * go to user detail page
   */
  addNewUser() {
    const navigationState: NavigationExtras = {
      state: {
        isAddMode: true
      }
    }
    this.router.navigate([`/dashboard/users/add`], navigationState)
  }

  assignMemberships() {
    if (this.selection.selected.length > 0) {
      let users = this.selection
        .selected.map(user => {
          return user._id
        });
      this.usersService
        .assignMemberships(users)
        .subscribe(res => {
          if (res) {
            this.selection.clear()
            this.getUsers(this.input.nativeElement.value, 'desc', this.paginator.pageIndex, this.paginator.pageSize)
          }
        })
    }else{
      this.snackBar.open('Have not selected items', '', { duration: 2000 });
    }
  }


  gotoBatchUploadUsersPage() {
    this.router.navigateByUrl('/dashboard/users/batchupload')
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    let numSelected = this.selection.selected.length;
    let numRows = this.users.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.users.forEach(row => this.selection.select(row));
  }
  /** The label for the checkbox on the passed row */
  checkboxLabel(row?) {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.index + 1}`;
  }


  deleteUser(user) {
    this.openConfirmDialog(user)
  }
  openConfirmDialog(user) {
    const message = `Are you sure you want to delete?`;

    const dialogData = new ConfirmDialogModel("Confirm Delete user", message);

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: "500px",
      data: dialogData,
      hasBackdrop: true,
      disableClose: true
    });
    dialogRef.afterClosed()
      .subscribe(dialogResult => {
        if (dialogResult) {
          this.usersService
            .moveUser(user)
            .subscribe(res => {
              if (res) {
                this.snackBar.open('deleted', '', { duration: 2000 });
                this.getUsers(this.input.nativeElement.value, 'desc', this.paginator.pageIndex, this.paginator.pageSize)
              }
            })

        }
      });
  }
}
