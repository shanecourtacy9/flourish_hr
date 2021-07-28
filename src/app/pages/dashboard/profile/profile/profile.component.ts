import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from 'src/app/services/auth.service';
import { DirtyValues } from 'src/app/_helpers';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  corporateAdminForm: FormGroup
  corporateAdmin = {};
  loading$: Boolean
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar,
  ) { }

  ngOnInit() {
    setTimeout(() => {
      this.authService.loading$
        .subscribe(loading => {
          this.loading$ = loading
        })
    })
    this.createCorporateAdminForm()
    this.f.email.disable()
    this.f.membersCap.disable();
    this.f.membershipExpireAt.disable();
    this.f.createdAt.disable()
    this.authService
      .getProfile()
      .subscribe(corporateAdmin => {
        this.corporateAdmin = corporateAdmin
        this.assignValues(['email', 'firstName', 'membershipExpireAt', 'lastName', 'membersCap', 'phoneNumber'])
      })
  }
  /**
    * create corporateAdmin form
    */
  createCorporateAdminForm() {
    this.corporateAdminForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      membersCap: ['', [Validators.required, Validators.min(1), Validators.pattern(/^\d*\.?\d*$/)]],
      phoneNumber: ["", [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
      membershipExpireAt: [new Date().toISOString()],
      createdAt:[new Date().toISOString()]
    })
  }

  // get controls of corporateAdmin form 
  get f() {
    return this.corporateAdminForm.controls
  }
  /**
   * updata profile
   */
  updateProfile() {
    let changedValues = DirtyValues
      .getDirtyValues(this.corporateAdminForm);
    if (Object.keys(changedValues).length > 0) {
      this.authService
        .updateProfile(changedValues)
        .subscribe(message => {
          this.snackBar.open(message, '', { duration: 2000 })
        })
    }

  }

  /**
   * assign values to fields
   * @param fields 
   */
  assignValues(fields: any) {
    if (!fields.length) return
    fields.forEach(field => {
      this.corporateAdminForm.patchValue({
        [field]: this.corporateAdmin[field]
      })
    })
  }
}
