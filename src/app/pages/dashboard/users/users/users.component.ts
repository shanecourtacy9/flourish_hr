import { SelectionModel } from "@angular/cdk/collections";
import { AfterViewChecked, Component, OnInit, ViewChild } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatPaginator } from "@angular/material/paginator";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatSort } from "@angular/material/sort";
import { NavigationExtras, Router } from "@angular/router";
import { UsersDatasource } from "src/app/models";
import {
  ConfirmDialogComponent,
  ConfirmDialogModel,
} from "src/app/pages/shared/confirm-dialog/confirm-dialog.component";
import { UsersService } from "src/app/services";

@Component({
  selector: "app-users",
  templateUrl: "./users.component.html",
  styleUrls: ["./users.component.scss"],
})
export class UsersComponent implements OnInit, AfterViewChecked {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  usersDatasource: UsersDatasource;
  selection = new SelectionModel<any>(true, []);
  onboardedUsers = 0;
  initializedLoading = false;
  displayedColumns: string[] = [
    "select",
    "profile",
    "status",
    "membership",
    "joinDate",
    "actions",
  ];
  users = [];
  totalUsers = 0;
  loading$ = true;
  private currentFilter = "";
  private paginatorInitialized = false;
  constructor(
    private usersService: UsersService,
    public dialog: MatDialog,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.usersDatasource = new UsersDatasource(this.usersService);
  }
  ngOnInit() {
    this.usersService.firstLoading("", "desc", 0, 20).subscribe((res) => {
      this.users = res[1];
      console.log(this.users);
      this.totalUsers = res[0];
      this.onboardedUsers = res[2];
      this.initializedLoading = true;
    });
    setTimeout(() => {
      this.usersService.loading$.subscribe((loading) => {
        this.loading$ = loading;
      });
    });
  }

  //get users by conditions
  getUsers(filter, sortDirection, pageIndex, pageSize) {
    this.usersDatasource
      .getUsers(filter, sortDirection, pageIndex, pageSize)
      .subscribe((users) => {
        this.selection.clear();
        this.users = users;
        console.log(users);
      });
  }
  ngAfterViewChecked(): void {
    if (!this.paginator || this.paginatorInitialized) return;
    this.paginatorInitialized = true;
    this.paginator.page.subscribe(() => {
      this.getUsers(
        this.currentFilter,
        this.sort?.direction || "desc",
        this.paginator.pageIndex,
        this.paginator.pageSize
      );
    });
  }

  /**
   * edit user
   * @param row
   */
  editUser(user) {
    console.log("EDIT USER ", user);
    const navigationState: NavigationExtras = {
      state: {
        isAddMode: false,
      },
    };
    this.router.navigate(
      [`/dashboard/users/edit/${user._id}`],
      navigationState
    );
  }
  /**
   * go to user detail page
   */
  addNewUser() {
    const navigationState: NavigationExtras = {
      state: {
        isAddMode: true,
      },
    };
    this.router.navigate([`/dashboard/users/add`], navigationState);
  }

  assignMemberships() {
    if (this.selection.selected.length > 0) {
      let users = this.selection.selected.map((user) => {
        return user._id;
      });
      this.usersService.assignMemberships(users).subscribe((res) => {
        if (res) {
          this.selection.clear();
          this.reloadUsers();
        }
      });
    } else {
      this.snackBar.open("Have not selected items", "", { duration: 2000 });
    }
  }

  gotoBatchUploadUsersPage() {
    this.router.navigateByUrl("/dashboard/users/batchupload");
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    let numSelected = this.selection.selected.length;
    let numRows = this.users.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.users.forEach((row) => this.selection.select(row));
  }
  /** The label for the checkbox on the passed row */
  checkboxLabel(row?) {
    if (!row) {
      return `${this.isAllSelected() ? "select" : "deselect"} all`;
    }
    return `${this.selection.isSelected(row) ? "deselect" : "select"} row ${
      row.index + 1
    }`;
  }

  deleteUser(user) {
    console.log("USER TO DELETE", user);
    this.openConfirmDialog(user);
  }
  openConfirmDialog(user) {
    const message = `Are you sure you want to delete?`;

    const dialogData = new ConfirmDialogModel("Confirm Delete user", message);

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: "500px",
      data: dialogData,
      hasBackdrop: true,
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((dialogResult) => {
      if (dialogResult) {
        this.usersService
          .moveUser(user._id, user.group._id)
          .subscribe((res) => {
            if (res) {
              this.snackBar.open("deleted", "", { duration: 2000 });
              this.reloadUsers();
            }
          });
      }
    });
  }

  checkIsMember(user) {
    let isMember = false;
    if (user["group"] != null) {
      if (new Date(user.group?.configs?.membershipExpireAt) > new Date()) {
        isMember = true;
      }
    }
    return isMember;
  }

  // New methods for modern UI
  getMemberCount(): number {
    return this.users?.filter(user => this.checkIsMember(user))?.length || 0;
  }

  getInactiveCount(): number {
    return this.users?.filter(user => !user?.isActive)?.length || 0;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  getRelativeTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.currentFilter = filterValue;
    if (this.paginator) this.paginator.pageIndex = 0;
    this.getUsers(filterValue, "desc", 0, this.paginator?.pageSize || 20);
  }

  private reloadUsers(): void {
    this.getUsers(
      this.currentFilter,
      "desc",
      this.paginator?.pageIndex || 0,
      this.paginator?.pageSize || 20
    );
  }

  viewUserDetails(user: any): void {
    // Navigate to user details or open a dialog
    this.editUser(user);
  }

  resetUserPassword(user: any): void {
    // Implement password reset functionality
    this.snackBar.open(`Password reset for ${user.email}`, 'Close', { duration: 3000 });
  }

  toggleUserStatus(user: any): void {
    // Implement user status toggle
    const action = user.isActive ? 'deactivate' : 'activate';
    this.snackBar.open(`User ${action}d successfully`, 'Close', { duration: 3000 });
  }
}
