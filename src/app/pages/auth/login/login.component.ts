import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isSubmitted = false;
  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.createLoginForm()
  }
  createLoginForm() {
    //admin12345678
    this.loginForm = this.formBuilder.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(6)]]
    })
  }

  get f() {
    return this.loginForm.controls
  }
  onLogin() {
    if(this.loginForm.invalid){
      return
    }
    this.isSubmitted = true;
    this.authService
      .signin(this.loginForm.value)
      .subscribe(res => {
        this.router.navigateByUrl('/dashboard/home',{ replaceUrl: true })
      })

  }
  resetPassword() {
    this.router.navigateByUrl('auth/forgot-password')
  }

}
