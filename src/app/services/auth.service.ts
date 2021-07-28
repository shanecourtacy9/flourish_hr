import { Injectable } from '@angular/core';
import { environment } from "../../environments/environment";
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { tap, map, catchError, finalize, switchMap, mapTo } from 'rxjs/operators';
import { JwtHelperService } from "@auth0/angular-jwt";
import { Router } from '@angular/router';
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const URL = `${environment.url}/api/corporateAdmins`
@Injectable({
  providedIn: 'root'
})

export class AuthService {
  isAuthenticated = new BehaviorSubject<boolean>(null);
  private userTypeSubject = new BehaviorSubject<string>(null);
  userType$ = this.userTypeSubject.asObservable();
  currentAccessToken = null;
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();
  constructor(
    private http: HttpClient,
    private jwtHelper: JwtHelperService,
    private router: Router
  ) { 
    this.checkToken()
  }


  /**
  * @function checkToken
  * @param 
  * @returns Subject<User>
  */
  checkToken() {
    let refreshToken = this.getToken(REFRESH_TOKEN_KEY);
    let accessToken = this.getToken(ACCESS_TOKEN_KEY);
    this.checkRefreshToken(refreshToken, accessToken)
  }

  //check access token
  checkAccessToken(accessToken) {
    if (accessToken) {
      this.currentAccessToken = accessToken;
      this.isAuthenticated.next(true);
    } else {
      this.isAuthenticated.next(false)
    }
  }

  //check refresh token
  checkRefreshToken(refreshToken, accessToken) {
    if (refreshToken) {
      let isRefreshTokenExpired = this.jwtHelper.isTokenExpired(refreshToken);
      if (isRefreshTokenExpired) {
        this.removeToken(REFRESH_TOKEN_KEY);
        this.removeToken(ACCESS_TOKEN_KEY);
        this.isAuthenticated.next(false);
        this.router.navigateByUrl('/auth',{ replaceUrl: true })
      } else {
        let refreshUser = this.jwtHelper.decodeToken(refreshToken);
        this.userTypeSubject.next(refreshUser.userType);
        this.checkAccessToken(accessToken)
      }
    } else {
      this.isAuthenticated.next(false)
    }
  }


  signin(credentialInfo?: {
    email: string,
    password: string
  }) {
    return this.http.post(`${URL}/signin`, credentialInfo)
      .pipe(
        tap(tokens => {
          this.currentAccessToken = tokens['access_token'];
          let user = this.jwtHelper.decodeToken(this.currentAccessToken);
          this.userTypeSubject.next(user.userType);
          this.storeToken(ACCESS_TOKEN_KEY, tokens['access_token']);
          this.storeToken(REFRESH_TOKEN_KEY, tokens['refresh_token']);
          this.isAuthenticated.next(true);
        }),
        mapTo(true)
      )
  }

  /**
   * get corporate admin profile
   */
  getProfile() {
    this.loadingSubject.next(true);
    return this.http.get(`${URL}/profile`)
      .pipe(
        map(res => res['document']),
        catchError(err => {
          throw err
        }),
        finalize(() => {
          this.loadingSubject.next(false)
        })
      )
  };

  updateProfile(properties) {
    return this.http.put(`${URL}/profile`, properties)
      .pipe(
        map(res => res['message']),
        catchError(err => {
          throw err
        })
      )
  };

  /**
   * 
   * @param properties 
   * @returns 
   */
  changePassword(properties) {
    return this.http.put(`${URL}/profile/changePassword`, properties)
      .pipe(
        map(res => res['message']),
        catchError(err => {
          throw err
        })
      )
  }
/**
   * 
   * @param properties 
   * @returns 
   */
 forgetPassword(email) {
  return this.http.put(`${URL}/forgetPassword`,email)
    .pipe(
      map(res => res['message']),
      catchError(err => {
        throw err
      })
    )
}

  //store token 
  private storeToken(key, value) {
     localStorage.setItem(key, value);
  };

  //store access token

 async storeAccessToken(accessToken) {
    this.currentAccessToken = accessToken;
    this.storeToken(ACCESS_TOKEN_KEY, accessToken);
  }

  // reissue new access token
  getNewAccessToken() {
    let refreshToken = this.getToken(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      return this.http.post(`${URL}/refresh`, { refreshToken: refreshToken });
    }
    else {
      // No stored refresh token
      return null;
    }
  }

  //get token
  getToken(key) {
    return localStorage.getItem(key)
  }

  //remove token
  private removeToken(key) {
     localStorage.removeItem(key)
  }

  /**
   * @function logout
   * @param refreshToken
   */
  logout() {
    this.currentAccessToken = null;
    this.userTypeSubject.next(null);
    this.removeToken(ACCESS_TOKEN_KEY);
    this.removeToken(REFRESH_TOKEN_KEY);
    this.isAuthenticated.next(false);
    this.router.navigateByUrl('/auth',{ replaceUrl: true })
  }
}

