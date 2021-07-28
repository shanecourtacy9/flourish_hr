import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorsService, NotifyService } from '../services/errorServices';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {

  constructor(private injector: Injector) { }

  handleError(error: Error | HttpErrorResponse) {
    const errorService = this.injector.get(ErrorsService);
    const notifyService = this.injector.get(NotifyService);

    let message;
    if (error instanceof HttpErrorResponse) {
      //server error
      message = errorService.getHttpRequestErrorMessage(error);
      if(!message){
        notifyService.showError('Please try later')
      }else{
        notifyService.showError(message)
      }
      
    } else {
      message = errorService.getClientErrorMessage(error);
      notifyService.showError(message)
    }
  }
}