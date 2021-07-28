import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { UsersService } from '..';

@Injectable({
  providedIn: 'root'
})
export class UserResolveService implements Resolve<any> {
  constructor(private usersService: UsersService) { }
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
    return this.usersService.getUserById(route.params['userId']);
  }
}