import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from 'src/app/services/auth.service';
import { NotifyService } from 'src/app/services/errorServices';
import { MatchValidator } from 'src/app/_helpers';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {

  resetForm: FormGroup;
  isSubmitted = false;
  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private dialogRef: MatDialogRef<ResetPasswordComponent>,
    private notifyService: NotifyService
  ) { }

  ngOnInit() {
    this.createResetForm()
  }
  createResetForm() {
    this.resetForm = this.formBuilder.group({
      currentPassword: ['', Validators.compose([Validators.required, Validators.minLength(6)])],
      newPassword: ['', Validators.compose([Validators.required, Validators.minLength(8), Validators.pattern(/(?=.*\d)(?=.*[A-z])/)])],
      confirmPassword: ['', Validators.required],
    },
      {
        validator: MatchValidator('newPassword', 'confirmPassword')
      }
    )
  }

  get f() {
    return this.resetForm.controls
  }
  onReset() {
    if (this.resetForm.invalid) return
    this.authService
      .changePassword(this.resetForm.value)
      .subscribe(message => {
        this.closeDialog()
        this.notifyService.showSuccess(message)
      })
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
