import { Component, OnDestroy, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StressThermometerService } from 'src/app/services/stress-thermometer.service';
import { Subscription } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { AuthService } from 'src/app/services/auth.service';
import { environment } from 'src/environments/environment';

interface ThermometerAggregate {
  questionId: string;
  prompt?: string;
  average: number;
  count: number;
  max: number;
  min: number;
  scale?: {
    min?: number;
    max?: number;
    step?: number;
    minLabel?: string;
    maxLabel?: string;
  };
}

@Component({
  selector: 'app-stress-thermometer',
  templateUrl: './stress-thermometer.component.html',
  styleUrls: ['./stress-thermometer.component.scss'],
})
export class StressThermometerComponent implements OnInit, OnDestroy {
  companyId: string;
  surveyId: string;
  surveyName: string;
  surveyDescription: string;
  aggregates: { aggregates: ThermometerAggregate[]; totalResponses: number };
  loading = true;
  error: string;
  socket: Socket;
  subscriptions: Subscription[] = [];
  @ViewChild('fsContainer') fsContainer: ElementRef<HTMLElement>;
  isFullscreen = false;
  constructor(
    private route: ActivatedRoute,
    private stressService: StressThermometerService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.surveyId = this.route.snapshot.paramMap.get('surveyId');

    if (!this.surveyId) {
      this.error = 'Missing survey identifier';
      this.loading = false;
      return;
    }

    const sub = this.authService.getProfile().subscribe({
      next: (profile) => {
        this.companyId = profile?.company?._id || profile?.company;
        if (!this.companyId) {
          this.error = 'No company associated with this account';
          this.loading = false;
          return;
        }
        this.loadData();
        this.setupSocket();
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
    if (this.socket) {
      this.socket.emit('leave', { surveyId: this.surveyId, companyId: this.companyId });
      this.socket.disconnect();
    }
  }
  private loadData(): void {
    this.loading = true;
    const sub = this.stressService
      .getAggregates(this.companyId, this.surveyId)
      .subscribe({
        next: (aggregates) => {
          this.aggregates = aggregates;
          this.surveyName = aggregates?.survey?.name;
          this.surveyDescription = aggregates?.survey?.description;
          this.loading = false;
        },
        error: () => {
          this.error = 'Unable to load stress thermometer data';
          this.loading = false;
        },
      });

    this.subscriptions.push(sub);
  }

  private setupSocket(): void {
    this.socket = io(`${environment.url}/stress-thermometer`);

    this.socket.on('connect', () => {
      console.log('connected to stress thermometer socket');
      console.log('surveyId', this.surveyId);
      console.log('companyId', this.companyId);
      this.socket.emit('join', { surveyId: this.surveyId, companyId: this.companyId });
    });

    this.socket.on('stress-thermometer:update', (payload: any) => {
      console.log('stress-thermometer:update', payload);
      if (payload && payload.aggregates) {
        this.updateAggregatesInPlace(payload);
        this.surveyName = payload?.survey?.name || this.surveyName;
        this.surveyDescription = payload?.survey?.description || this.surveyDescription;
      }
    });
  }

  private updateAggregatesInPlace(payload: any): void {
    // If we don't have existing data, just set it
    if (!this.aggregates || !this.aggregates.aggregates) {
      this.aggregates = payload;
      return;
    }

    // Update total responses
    this.aggregates.totalResponses = payload.totalResponses;

    // Update each aggregate in place to preserve object references
    // This allows Angular to detect changes without re-rendering the entire list
    const newAggregates = payload.aggregates || [];
    
    newAggregates.forEach((newAggregate: ThermometerAggregate) => {
      const existingIndex = this.aggregates.aggregates.findIndex(
        (existing) => existing.questionId === newAggregate.questionId
      );

      if (existingIndex !== -1) {
        // Update existing aggregate in place
        const existing = this.aggregates.aggregates[existingIndex];
        existing.average = newAggregate.average;
        existing.count = newAggregate.count;
        existing.max = newAggregate.max;
        existing.min = newAggregate.min;
        existing.prompt = newAggregate.prompt || existing.prompt;
        existing.scale = newAggregate.scale || existing.scale;
      } else {
        // Add new aggregate if it doesn't exist
        this.aggregates.aggregates.push(newAggregate);
      }
    });

    // Remove aggregates that no longer exist in the new data
    this.aggregates.aggregates = this.aggregates.aggregates.filter((existing) =>
      newAggregates.some((newAgg: ThermometerAggregate) => newAgg.questionId === existing.questionId)
    );
  }

  trackByQuestionId(_index: number, item: ThermometerAggregate): string {
    return item.questionId;
  }

  getAggregatesToDisplay(): ThermometerAggregate[] {
    const list = this.aggregates?.aggregates || [];
    if (list.length) {
      return list;
    }
    return [
      {
        questionId: 'placeholder',
        prompt: this.surveyName || 'Stress Thermometer',
        average: 0,
        count: 0,
        min: 0,
        max: 100,
        scale: { min: 0, max: 100, minLabel: 'Low', maxLabel: 'High' },
      },
    ];
  }

  @HostListener('document:fullscreenchange')
  @HostListener('document:webkitfullscreenchange')
  onFullscreenChange(): void {
    const doc: any = document as any;
    this.isFullscreen = !!(document.fullscreenElement || doc.webkitFullscreenElement);
  }

  async toggleFullscreen(): Promise<void> {
    if (!this.isFullscreen) {
      await this.enterFullscreen();
    } else {
      await this.exitFullscreen();
    }
  }

  private async enterFullscreen(): Promise<void> {
    const el: any = this.fsContainer?.nativeElement || document.documentElement;
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      }
      this.isFullscreen = true;
    } catch (e) {
      console.error('Failed to enter fullscreen', e);
    }
  }

  private async exitFullscreen(): Promise<void> {
    const doc: any = document as any;
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
      }
      this.isFullscreen = false;
    } catch (e) {
      console.error('Failed to exit fullscreen', e);
    }
  }

  getFillPercentage(reading: ThermometerAggregate): number {
    const max = reading.scale?.max ?? reading.max ?? 0;
    const min = reading.scale?.min ?? reading.min ?? 0;
    if (max <= min) {
      return 0;
    }
    const clamped = Math.min(Math.max(reading.average, min), max);
    return ((clamped - min) / (max - min)) * 100;
  }

  getFillColor(reading: ThermometerAggregate): string {
    const percent = this.getFillPercentage(reading);
    if (percent <= 30) {
      return '#27ae60';
    }
    if (percent <= 60) {
      return '#f2c94c';
    }
    if (percent <= 85) {
      return '#f2994a';
    }
    return '#eb5757';
  }

  getLabel(reading: ThermometerAggregate): string {
    const minLabel = reading.scale?.minLabel ?? reading.min ?? 0;
    const maxLabel = reading.scale?.maxLabel ?? reading.max ?? 0;
    return `${minLabel} – ${maxLabel}`;
  }

  getGoalValue(reading: ThermometerAggregate): number {
    return reading.scale?.max ?? reading.max ?? 100;
  }

  getDisplayValue(reading: ThermometerAggregate): number {
    return reading.average ?? 0;
  }
}

