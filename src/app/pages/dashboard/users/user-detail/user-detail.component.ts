import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ActivatedRoute, Router } from "@angular/router";
import { subYears } from "date-fns";
import { UsersService } from "src/app/services";
import { DirtyValues } from "src/app/_helpers";
@Component({
  selector: "app-user-detail",
  templateUrl: "./user-detail.component.html",
  styleUrls: ["./user-detail.component.scss"],
})
export class UserDetailComponent implements OnInit {
  minDate: Date;
  maxDate: Date;
  currentUser: any;
  isAddMode = true;
  loading$ = false;
  genders = [
    { value: "male", name: "Male" },
    { value: "female", name: "Female" },
  ];
  membershipTypes = ["Yes", "No"];
  firstTimeLoading = true;
  managementMode = "Add new user";
  userForm: FormGroup;
  constructor(
    private router: Router,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private userService: UsersService,
    private snackBar: MatSnackBar
  ) {
    // Set the minimum  and maxnimum  years
    this.maxDate = subYears(new Date(), 10);
    this.minDate = subYears(this.maxDate, 90);
    if (this.router.getCurrentNavigation().extras.state) {
      this.isAddMode =
        this.router.getCurrentNavigation().extras.state.isAddMode;
    }

    if (!this.isAddMode) {
      this.managementMode = "User Details";
      console.log("SNAPSHOT", this.activatedRoute.snapshot);
      this.currentUser = this.activatedRoute.snapshot.data["user"];
    }
  }

  ngOnInit() {
    //create corporateAdmin form
    this.createUserForm();
    console.log(this.currentUser);
    if (!this.isAddMode) {
      this.assignValues([
        "email",
        "lastName",
        "firstName",
        "phoneNumber",
        "gender",
        "dateOfBirth",
      ]);
      if (this.checkIsMember(this.currentUser)) {
        this.userForm.patchValue({
          isMember: "Yes",
        });
      } else {
        this.userForm.patchValue({
          isMember: "No",
        });
      }
    }
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

  /**
   * create corporateAdmin form
   */
  createUserForm() {
    this.userForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      firstName: ["", Validators.required],
      lastName: ["", Validators.required],
      gender: ["male", Validators.required],
      phoneNumber: ["", Validators.maxLength(20)],
      dateOfBirth: [new Date(this.maxDate).toISOString(), Validators.required],
      isMember: ["Yes", Validators.required],
    });
  }

  // get controls of corporateAdmin form
  get f() {
    return this.userForm.controls;
  }
  updateUser() {
    if (this.userForm.invalid) return;
    if (this.isAddMode) {
      this.userService.addUser(this.userForm.value).subscribe((res) => {
        if (res) {
          // ['email', 'lastName', 'firstName', 'phoneNumber'].forEach(field => {
          //   this.userForm.patchValue({
          //     [field]: ''
          //   })
          // })
          this.snackBar.open("created successfully", "", { duration: 2000 });
        }
      });
    } else {
      this.editUser();
    }
  }

  goBack() {
    this.router.navigateByUrl("/dashboard/users");
  }

  /**
   * assign values to fields
   * @param fields
   */
  assignValues(fieldArray) {
    fieldArray.forEach((field) => {
      this.userForm.patchValue({
        [field]: this.currentUser[field],
      });
    });
  }

  /**
   * edit corporateAdmin
   * @param form
   * @param posterFile
   */
  editUser() {
    let changedValues = DirtyValues.getDirtyValues(this.userForm);
    if (Object.keys(changedValues).length > 0) {
      this.userService
        .updateUser(this.currentUser._id, changedValues)
        .subscribe((message) => {
          if (message) {
            this.snackBar.open("update successfully", "", { duration: 2000 });
          }
        });
    }
  }
}
