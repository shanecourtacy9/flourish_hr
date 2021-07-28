import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ErrorsService {

  constructor() { }
  getClientErrorMessage(error: Error): string {
    return error.message ? error.message : error.toString();
  }

  getHttpRequestErrorMessage(error:HttpErrorResponse):any{
    return navigator.onLine? error.error.message:error.toString()
  }
}
