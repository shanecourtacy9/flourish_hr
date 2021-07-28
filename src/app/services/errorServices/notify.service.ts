import { Injectable, NgZone } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotifyService {

  constructor(
    private snackBar: MatSnackBar,
    private zone: NgZone
  ) { }

  showSuccess(message: string): void {
    this.zone.run(() => {
      this.snackBar.open(message, '', { duration: 2000 })
    })
  }

  showError(message: string): void {
    this.zone.run(() => {
      this.snackBar.open(message, '', { duration: 2000 })
    })
  }
}
