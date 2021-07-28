import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private sidebarStateChanged$ = new BehaviorSubject<Boolean>(false);
  public sidebarStateObservable$ = this.sidebarStateChanged$.asObservable();
  private sidebarTitleChanged$ = new BehaviorSubject<String>('Home');
  public sidebarTitleObservable$ = this.sidebarTitleChanged$.asObservable();
  constructor() {
  }

  toggle() {
    this.sidebarStateChanged$.next(true);
  }

  changeTitle(title){
    this.sidebarTitleChanged$.next(title)
  }
  
}
