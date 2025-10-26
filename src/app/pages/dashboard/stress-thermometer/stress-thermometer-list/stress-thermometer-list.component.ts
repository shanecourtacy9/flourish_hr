import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { format } from 'date-fns';
import { AuthService } from 'src/app/services/auth.service';
import { StressThermometerService } from 'src/app/services/stress-thermometer.service';
import { ExcelService } from 'src/app/services/excel.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-stress-thermometer-list',
  templateUrl: './stress-thermometer-list.component.html',
  styleUrls: ['./stress-thermometer-list.component.scss'],
})
export class StressThermometerListComponent implements OnInit, OnDestroy {
  companyId: string;
  surveys: any[] = [];
  loading = true;
  error: string;
  displayedColumns: string[] = ['name', 'status', 'responses', 'updated', 'actions'];

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private stressService: StressThermometerService,
    private router: Router,
    private route: ActivatedRoute,
    private excelService: ExcelService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const sub = this.authService.getProfile().subscribe({
      next: (profile) => {
        this.companyId = profile?.company?._id || profile?.company;

        if (!this.companyId) {
          this.error = 'No company associated with this account';
          this.loading = false;
          return;
        }

        this.loadSurveys();
      },
      error: () => {
        this.error = 'Unable to load company information';
        this.loading = false;
      },
    });

    this.subscriptions.push(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  openSurvey(survey: any): void {
    const surveyId = survey?._id || survey?.id;
    if (!surveyId) {
      return;
    }

    this.router.navigate([surveyId], { relativeTo: this.route });
  }

  trackBySurveyId(index: number, survey: any): any {
    return survey?._id || survey?.id || index;
  }

  loadSurveys(): void {
    this.loading = true;
    this.error = null;
    const sub = this.stressService.list(this.companyId).subscribe({
      next: (response) => {
        console.log(response);
        const surveys = Array.isArray(response) ? response : response?.surveys;
        this.surveys = Array.isArray(surveys) ? surveys : [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Unable to load surveys';
        this.loading = false;
      },
    });

    this.subscriptions.push(sub);
  }

  getActiveSurveysCount(): number {
    return this.surveys.filter(survey => survey.totalResponses > 0).length;
  }

  getTotalResponses(): number {
    return this.surveys.reduce((total, survey) => total + (survey.totalResponses || 0), 0);
  }

  getRecentSurveysCount(): number {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return this.surveys.filter(survey => 
      survey.updatedAt && new Date(survey.updatedAt) > oneWeekAgo
    ).length;
  }

  createNewSurvey(): void {
    // TODO: Implement create new survey functionality
    console.log('Create new survey');
  }

  editSurvey(survey: any): void {
    // TODO: Implement edit survey functionality
    console.log('Edit survey:', survey);
  }

  viewResponses(survey: any): void {
    // TODO: Implement view responses functionality
    console.log('View responses for:', survey);
  }

  downloadResponses(survey: any): void {
    const surveyId = survey?._id || survey?.id;
    if (!surveyId) {
      this.snackBar.open('Invalid survey ID', 'Close', { duration: 3000 });
      return;
    }

    const sub = this.stressService.getResponses(this.companyId, surveyId).subscribe({
      next: (response) => {
        const responses = response?.responses || [];
        
        if (responses.length === 0) {
          this.snackBar.open('No responses found for this survey', 'Close', { duration: 3000 });
          return;
        }

        // Prepare Excel data
        const excelData = this.formatResponsesForExcel(responses, survey);
        
        // Generate filename
        const filename = `stress-thermometer-${survey.name?.toLowerCase().replace(/\s+/g, '-') || 'survey'}-responses`;
        
        // Export to Excel
        this.excelService.exportExcel(excelData, filename);
        
        this.snackBar.open(`Downloaded ${responses.length} response(s)`, 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error downloading responses:', err);
        this.snackBar.open('Failed to download responses', 'Close', { duration: 3000 });
      },
    });

    this.subscriptions.push(sub);
  }

  private formatResponsesForExcel(responses: any[], survey: any): any[][] {
    const data: any[][] = [];
    
    // Header row
    data.push(['Stress Thermometer Responses']);
    data.push(['']);
    data.push(['Survey Name:', survey.name || 'N/A']);
    data.push(['Survey Description:', survey.description || 'N/A']);
    data.push(['Total Responses:', responses.length]);
    data.push(['']);
    
    // Check if we have responses
    if (responses.length === 0) {
      data.push(['No responses available']);
      return data;
    }

    // Get unique question IDs from all responses
    const questionIds = new Set<string>();
    responses.forEach(response => {
      if (response.answers && Array.isArray(response.answers)) {
        response.answers.forEach(answer => {
          if (answer.questionId) {
            questionIds.add(answer.questionId);
          }
        });
      }
    });

    // Build header row with question IDs
    const headerRow = ['Submission Date', 'Time', 'Session ID'];
    questionIds.forEach(qId => headerRow.push(`Question ${qId}`));
    data.push(headerRow);

    // Build data rows
    responses.forEach(response => {
      const row: any[] = [];
      
      // Date and time
      const submittedAt = response.submittedAt || response.createdAt;
      if (submittedAt) {
        const date = new Date(submittedAt);
        row.push(format(date, 'dd/MM/yyyy'));
        row.push(format(date, 'HH:mm:ss'));
      } else {
        row.push('N/A', 'N/A');
      }
      
      // Session ID
      row.push(response.sessionId || 'N/A');
      
      // Answers for each question
      questionIds.forEach(qId => {
        const answer = response.answers?.find((a: any) => a.questionId === qId);
        row.push(answer?.value ?? '');
      });
      
      data.push(row);
    });

    return data;
  }

  deleteSurvey(survey: any): void {
    // TODO: Implement delete survey functionality
    console.log('Delete survey:', survey);
  }

}


