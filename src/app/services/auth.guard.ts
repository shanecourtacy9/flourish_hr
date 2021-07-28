import { Injectable } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  CanLoad,
  Route,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router
} from '@angular/router';

import { Observable } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { AuthService } from "./auth.service";
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild, CanLoad {
  currentUserType
  constructor(private authService: AuthService, private router: Router) {
    this.authService.userType$
      .subscribe(userType => {
        this.currentUserType = userType
      })
  }
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.check(route, state)
  }
  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.check(route, state)
  }
  canLoad(route: Route): Observable<boolean> | Promise<boolean> | boolean {
    // return this.check(route);
    return this.authService
      .isAuthenticated
      .pipe(
        filter(val => val !== null), // Filter out initial Behaviour subject value
        take(1), // Otherwise the Observable doesn't complete!
        map(isAuthenticated => {
          if (isAuthenticated) {
            return true;
          } else {
            return false;
          }
        })
      );
  }

  check(route, _state?: RouterStateSnapshot) {
    if (route.data.allowUserType.includes(this.currentUserType)) {
      return true
    } else {
      return false;
    }
  }
}
