import { HttpErrorResponse, HttpEvent, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, Injector } from "@angular/core";
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, finalize, retryWhen, switchMap, take } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService, NotifyService } from '../services';

@Injectable()

export class HttpRequestInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService, private injector: Injector
  ) { }
  notifyService = this.injector.get(NotifyService);

  // Used for queued API calls while refreshing tokens
  tokenSubject: BehaviorSubject<string> = new BehaviorSubject<string>(null);
  isRefreshingToken = false;

  // Intercept every HTTP call
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    // Check if we need additional token logic or not
    if (this.isInBlockedList(request.url)) {
      return next.handle(request);
    } else {
      return next.handle(this.addToken(request)).pipe(
        catchError(err => {
          if (err instanceof HttpErrorResponse) {
            switch (err.status) {
              case 400:
                return this.handle400Error(err);
              case 401:
                return this.handle401Error(request, next);
              case 404:
                return throwError(err);
              case 500:
                return throwError(err);
              default:
                this.authService.logout()
                return throwError(err);
               
            }
          } else {
            return throwError(err);
          }
        })
      );
    }
  }

  // Filter out URLs where you don't want to add the token!
  private isInBlockedList(url: string): Boolean {
    // Example: Filter out our login and logout API call
    if (url == `${environment.url}/api` ||
      url == `${environment.url}/api/logout`
    ) {
      return true;
    } else {
      return false;
    }
  }

  // Add our current access token from the service if present
  private addToken(req: HttpRequest<any>) {
    if (this.authService.currentAccessToken) {
      return req.clone({
        headers: new HttpHeaders({
          Authorization: `Bearer ${this.authService.currentAccessToken}`
        })
      });
    } else {
      return req;
    }
  }


  // We are not just authorized, we couldn't refresh token
  // or something else along the caching went wrong!
  private async handle400Error(err) {
    // Potentially check the exact error reason for the 400
    // then log out the user automatically
    this.notifyService.showError('Logged out due to authentication mismatch')
    this.authService.logout();
    return
  }

  // Indicates our access token is invalid, try to load a new one
  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<any> {
    // Check if another call is already using the refresh logic
    if (!this.isRefreshingToken) {

      // Set to null so other requests will wait
      // until we got a new token!
      this.tokenSubject.next(null);
      this.isRefreshingToken = true;
      this.authService.currentAccessToken = null;

      // First, get a new access token
      return this.authService.getNewAccessToken()
        .pipe(
          switchMap((token: any) => {
            if (token) {
              // Store the new token
              const accessToken = token.access_token;
              this.authService.storeAccessToken(accessToken);
              // Use the subject so other calls can continue with the new token
              this.tokenSubject.next(accessToken);
              // Perform the initial request again with the new token
              return next.handle(this.addToken(request));
            } else {
              // No new token or other problem occurred
              return null;
            }
          }),
          finalize(() => {
            // Unblock the token reload logic when everything is done
            this.isRefreshingToken = false;
          })
        );
    } else {
      // "Queue" other calls while we load a new token
      return this.tokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => {
          // Perform the request again now that we got a new token!
          return next.handle(this.addToken(request));
        })
      );
    }
  }
}
