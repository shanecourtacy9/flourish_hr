import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {

  resetForm: FormGroup;
  isClicked=false;
  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    this.createResetForm()
  }
  createResetForm() {
    //admin12345678
    this.resetForm = this.formBuilder.group({
      email: ["", [Validators.required, Validators.email]]
    })
  }

  get f() {
    return this.resetForm.controls
  }
  onReset() {

    if (this.resetForm.invalid)
      return
    this.isClicked=true
    this.authService.forgetPassword(this.resetForm.value)
      .subscribe(res => {
        this.isClicked=false
        this.snackBar.open('new password has sent to your email', '', { duration: 2000 });
        this.router.navigateByUrl('/auth/login')
      })
  }

}
