import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { MediaChange, MediaObserver } from '@angular/flex-layout';
import { MatSidenav } from '@angular/material/sidenav';
import { SidebarService } from 'src/app/services/sidebar.service';
@Component({
  selector: 'app-root',
  templateUrl: './root.component.html',
  styleUrls: ['./root.component.scss']
})
export class RootComponent implements OnInit {
  sideNavOpened = false;
  sideNavMode: 'side'
  navBarTitle: any
  @ViewChild(MatSidenav) sidenav: MatSidenav
  constructor(private mediaObserver: MediaObserver,
    private sidebarService: SidebarService,
    private changeDetector: ChangeDetectorRef
  ) { }
  ngOnInit() {
    this.mediaObserver
      .asObservable()
      .subscribe((changes: MediaChange[]) => {
        if (changes.length > 0) {
          let currentChange = changes.find(change => {
            return change.mqAlias === 'lt-lg'
          })
          if (currentChange) {
            if (this.sideNavOpened) {
              this.sideNavOpened = false
            }
            this.sideNavMode = 'side'

          } else {
            this.sideNavMode = 'side';
            this.sideNavOpened = true
          }
        }
      })

    this.sidebarService
      .sidebarTitleObservable$
      .subscribe(title => {
        this.navBarTitle = title
      })
  }

  ngAfterViewChecked(): void {
    //Called after every check of the component's view. Applies to components only.
    //Add 'implements AfterViewChecked' to the class.
    this.changeDetector.detectChanges()
  }
  ngAfterViewInit() {
    this.sidebarService
      .sidebarStateObservable$
      .subscribe(() => {
        this.sidenav.toggle()
      })
  }
}
