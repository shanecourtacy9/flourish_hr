import { Injectable } from '@angular/core';
import { environment } from "../../environments/environment";
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, forkJoin, Observable } from 'rxjs';
import { map, catchError, finalize, mapTo } from 'rxjs/operators';
const URL = `${environment.url}/api`
@Injectable({
  providedIn: 'root'
})
export class ProgrammesService {
  constructor(
    private http: HttpClient
  ) { }
  public loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();
  /**
  * get all programmes
  * @param filter 
  * @param sortOrder 
  * @param pageNumber 
  * @param pageSize 
  */
  getProgrammes(startDate, endDate, sortOrder, pageNumber, pageSize): Observable<any> {
    this.loadingSubject.next(true)
    return this.http.get(`${URL}/scheduledProgrammes`, {
      params: new HttpParams()
        .set('startDate', startDate)
        .set('endDate', endDate)
        .set('sortOrder', sortOrder)
        .set('pageNumber', pageNumber)
        .set('pageSize', pageSize)
    }).pipe(
      map(res => res['documents']),
      finalize(() => {
        this.loadingSubject.next(false)
      })
    )
  }

  /**
   * get total users numbers
   */
  getToalNumbersProgrammes() {
    return this.http.get(`${URL}/scheduledProgrammes/count`).pipe(
      map(res => res['documentNumbers']),
      catchError(err => {
        throw err
      })
    )
  }

  /**
   * 
   * @param id
   */
  getProgrammeById(id) {
    return this.http.get(`${URL}/scheduledProgrammes/${id}`).pipe(
      map(res => res['document']),
      catchError(err => {
        throw err
      })
    )
  }

  /**
 * add new corporate admin
 * @param admin 
 */
  addProgramme(programmeProperties) {
    this.loadingSubject.next(true)
    return this.http.post(`${URL}/scheduledProgrammes`, programmeProperties).pipe(
      mapTo(true),
      finalize(() => {
        this.loadingSubject.next(false)
      })
    )
  }

  /**
   * 
   * @param id 
   * @param properties 
   */
  updateProgramme(id, properties) {
    this.loadingSubject.next(true)
    return this.http.put(`${URL}/scheduledProgrammes/${id}`, properties).pipe(
      mapTo(true),
      finalize(() => {
        this.loadingSubject.next(false)
      })
    )
  }

  batchUploadProgrammes(programmes) {
    this.loadingSubject.next(true)
    return this.http.post(`${URL}/scheduledProgrammes/batchUpload`, programmes).pipe(
      map(res => res['message']),
      finalize(() => {
        this.loadingSubject.next(false)
      })
    )
  }

  getProgrammeCategories(kind) {
    this.loadingSubject.next(true)
    return this.http.get(`${URL}/categories/kind`, {
      params: new HttpParams()
        .set('kind', kind)
    }).pipe(
      map(res => res['categories']),
      finalize(() => {
        this.loadingSubject.next(false)
      })
    )
  }

  firstLoading(startDate, endDate, sortOrder, pageNumber, pageSize) {
    return forkJoin([
      this.getProgrammes(startDate, endDate, sortOrder, pageNumber, pageSize),
      this.getToalNumbersProgrammes()
    ]).pipe(
      catchError(err => {
        throw err
      })
    )
  }

  sendRecruitEmails(programme) {
    return this.http
      .post(`${URL}/scheduledProgrammes/sendRecuritEmails`, programme)
      .pipe(
        mapTo(true)
      )
  }

  sendReminderEmails(programme) {
    return this.http
      .post(`${URL}/scheduledProgrammes/sendReminderEmails`, programme)
      .pipe(
        mapTo(true)
      )
  }

  /**
   * 
   * @param id 
   * @returns 
   */
  getCommentsByProgrammeId(id) {
    return this.http.get(`${URL}/scheduledProgrammes/${id}/allComments`)
      .pipe(
        map(res => res['comments']),
        catchError(err => {
          throw err
        })
      )
  }

  /**
   * 
   * @param id 
   * @returns 
   */
  getRegisteredUsersByProgrammeId(id) {
    return this.http.get(`${URL}/scheduledProgrammes/${id}/registeredUsers`).pipe(
      map(res => res['registeredUsers']),
      catchError(err => {
        throw err
      })
    )
  }

  getAttendanceUsersByProgrammeId(id) {
    return this.http.get(`${URL}/scheduledProgrammes/${id}/attendance/users`).pipe(
      map(res => res['users']),
      catchError(err => { throw err; })
    )
  }

  markAttendance(programmeId: string, userId: string) {
    this.loadingSubject.next(true)
    return this.http.post(`${URL}/scheduledProgrammes/${programmeId}/attendance/${userId}`, {}).pipe(
      finalize(() => this.loadingSubject.next(false))
    )
  }

  /**
   * get waitlisted users for a programme
   * @param id
   * @returns
   */
  getWaitlistUsersByProgrammeId(id) {
    return this.http.get(`${URL}/scheduledProgrammes/${id}/waitlist`).pipe(
      map(res => res['waitlistUsers'] ?? res['waitlist'] ?? []),
      catchError(err => {
        throw err
      })
    )
  }

  /**
   * notify all waitlisted users for a programme
   */
  notifyWaitlist(programmeId: string, payload: { subject?: string; message: string }) {
    this.loadingSubject.next(true)
    return this.http
      .post(`${URL}/scheduledProgrammes/${programmeId}/notifyWaitlist`, payload)
      .pipe(
        mapTo(true),
        finalize(() => {
          this.loadingSubject.next(false)
        })
      )
  }

  /**
   * remove a registered user from a programme
   */
  removeRegisteredUserFromProgramme(programmeId: string, userId: string) {
    this.loadingSubject.next(true)
    return this.http
      .delete(`${URL}/scheduledProgrammes/${programmeId}/registeredUsers/${userId}`)
      .pipe(
        mapTo(true),
        finalize(() => {
          this.loadingSubject.next(false)
        })
      )
  }
}
