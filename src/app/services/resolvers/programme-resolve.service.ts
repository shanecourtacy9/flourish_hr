import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { ProgrammesService } from '..';

@Injectable({
  providedIn: 'root'
})
export class ProgrammeResolveService implements Resolve<any> {
  constructor(private programmesService: ProgrammesService) { }
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
    return this.programmesService.getProgrammeById(route.params['programmeId']);
  }
}