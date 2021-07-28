import { Component, OnInit } from '@angular/core';
import { AuthService, ProgrammesService } from 'src/app/services';
import * as dateFns from 'date-fns';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  initializedLoading = false
  upcomingProgrammes = [];
  isMember = false;
  constructor(
    private programmeService: ProgrammesService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.authService
      .getProfile()
      .subscribe(user => {
        this.isMember = user['isMember'];
        if (this.isMember) {
          this.programmeService
            .getProgrammes(new Date().toISOString(), '', 'desc', 0, 4)
            .subscribe(programmes => {
              if (programmes.length > 0) {
                this.upcomingProgrammes = this.convertDateProperties(programmes)
              } else {
                this.upcomingProgrammes = [];
              }
              this.initializedLoading = true
            })
        } else {
          this.initializedLoading = true
        }
      })
  }

  /**
   * convert date properties
   * @param programmes 
   * @returns 
   */
  convertDateProperties(programmes: any[]) {
    if (programmes.length > 0) {
      let convertedProgrammes = programmes.reduce((acc, current) => {
        let isLower = false;
        if (Math.floor(current.registeredUsers.length / current.capacity) * 10 < 5) {
          isLower = true
        }
        let convertedProgramme = {
          date: dateFns.format(dateFns.parseISO(current.startDate), 'dd/MM/yy'),
          isLower,
          ...current
        };
        return [convertedProgramme, ...acc]
      }, [])
      return convertedProgrammes
    }
  }
}
