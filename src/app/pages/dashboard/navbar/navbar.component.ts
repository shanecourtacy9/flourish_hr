import { Component, Input, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Location } from "@angular/common";
import { Router } from "@angular/router";
import { AuthService, UsersService } from "src/app/services";
import { SidebarService } from "src/app/services/sidebar.service";
import { ResetPasswordComponent } from "../../shared/reset-password/reset-password.component";

@Component({
  selector: "app-navbar",
  templateUrl: "./navbar.component.html",
  styleUrls: ["./navbar.component.scss"],
})
export class NavbarComponent implements OnInit {
  @Input() title: string;
  user;
  notificationCount = 3; // Mock notification count
  ROUTES = [
    { path: "/dashboard/home", title: "Home" },
    { path: "/dashboard/users", title: "Users" },
    { path: "/dashboard/programmes", title: "Programmes" },
    { path: "/dashboard/profile", title: "Profile" },
  ];

  constructor(
    private sidebarService: SidebarService,
    private router: Router,
    private dialog: MatDialog,
    private location: Location,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.getTitle();
    this.getUser();
  }

  getUser() {
    this.authService.getProfile().subscribe((user) => {
      this.user = user;
    });
  }

  toggleSidenav() {
    this.sidebarService.toggle();
  }

  getTitle() {
    let titlee = this.location.prepareExternalUrl(this.location.path());
    let isHave = false;
    for (var item = 0; item < this.ROUTES.length; item++) {
      if (titlee.includes(this.ROUTES[item].path)) {
        this.sidebarService.changeTitle(this.ROUTES[item].title);
        isHave = true;
        break;
      }
    }
    if (!isHave) {
      this.sidebarService.changeTitle("Home");
    }
  }
  //go to profile page
  gotoProfilePage() {
    this.router.navigateByUrl("/dashboard/profile");
    this.sidebarService.changeTitle("Profile");
  }

  logout() {
    this.authService.logout();
  }
  // set new password
  openPasswordDialog() {
    const dialogRef = this.dialog.open(ResetPasswordComponent, {
      width: "50%",
      height: "50%",
      hasBackdrop: true,
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe(() => {});
  }

  getBreadcrumb(): string {
    // Simple breadcrumb logic based on current route
    const currentPath = this.location.path();
    if (currentPath.includes('/users/')) return 'User Details';
    if (currentPath.includes('/programmes/')) return 'Programme Details';
    return '';
  }
}
