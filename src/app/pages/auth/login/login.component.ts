import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "src/app/services/auth.service";
import Swal from "sweetalert2";
@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isSubmitted = false;
  token;
  showOTPField = false;
  showResendOTP = false;
  hidePassword = true;

  otp;
  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.createLoginForm();
  }
  createLoginForm() {
    //admin12345678
    this.loginForm = this.formBuilder.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(6)]],
      otp: [""],
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  sendOTP() {
    this.authService.signin(this.loginForm.value).subscribe((token) => {
      if (token) {
        Swal.fire({
          title: "Verification",
          heightAuto: false,
          text: "OTP has been sent to your registered email",
          footer: "Note: Please also check your junk/spam folder",
          icon: "success",
        });
        this.showResendOTP = false;
        this.showOTPField = true;
        this.token = token;
        setTimeout(() => {
          this.showResendOTP = true;
        }, 10 * 1000);
      }
    });
  }
  onLogin() {
    if (!this.showOTPField) {
      this.sendOTP();
    } else {
      if (this.loginForm.invalid) {
        return;
      }
      this.isSubmitted = true;
      let credentialInfo = this.loginForm.value;
      credentialInfo["token"] = this.token;

      this.authService.verifyOtp(credentialInfo).subscribe((res) => {
        this.router.navigateByUrl("/dashboard/home", { replaceUrl: true });
      });
    }
  }
  resetPassword() {
    this.router.navigateByUrl("auth/forgot-password");
  }
}
