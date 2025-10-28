import { Component, ElementRef, OnDestroy, OnInit } from "@angular/core";
import {
  AuthService,
  ProgrammesService,
  UsersService,
  ViewershipService,
  KpiService,
  ExcelService,
} from "src/app/services";
import * as dateFns from "date-fns";
import { ScheduledSessionService } from "src/app/services/schedule-sessions.service";
import { Chart, registerables } from "chart.js";
import { FormControl, FormGroup } from "@angular/forms";
import { KeyValue } from "@angular/common";
Chart.register(...registerables);

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
})
export class HomeComponent implements OnInit, OnDestroy {
  initializedLoading = true;
  upcomingProgrammes = [];
  isMember = false;
  company;
  numOfTherapy;
  numOfWL;
  numOfChat = 0;
  endDate = new Date();
  startDate = dateFns.subYears(new Date(), 1);
  utilisationData;
  therapyChart;
  chatChart;
  wlChart;
  numOfResponses;
  usersChart;
  feedbackChart;
  presetRange = "lastYear";
  presetFeedbackRange = "lastYear";
  granularity: "monthly" | "quarterly" | "yearly" = "monthly";
  range = new FormGroup({
    start: new FormControl(),
    end: new FormControl(),
  });
  viewershipData;

  displayedColumns: string[] = ["name", "date", "registeredNum"];
  onboardedUsers = 0;
  supportedMembers = 0;
  totalUsers = 0;
  monthlyReport = [];
  sessionsFeedback = [];
  loading = false;
  challengeStats: any = null;

  // Order by ascending property value
  valueAscOrder = (
    a: KeyValue<number, string>,
    b: KeyValue<number, string>
  ): number => {
    return a?.value.localeCompare(b?.value);
  };
  originalOrder = (
    a: KeyValue<number, string>,
    b: KeyValue<number, string>
  ): number => {
    return 0;
  };
  constructor(
    private programmeService: ProgrammesService,
    private authService: AuthService,
    private sessionService: ScheduledSessionService,
    private elementRef: ElementRef,
    private userService: UsersService,
    private viewershipService: ViewershipService,
    private kpiService: KpiService,
    private excelService: ExcelService
  ) {}
  ngOnDestroy(): void {
    this.destoryChart(this.therapyChart);
    this.destoryChart(this.wlChart);
    this.destoryChart(this.chatChart);
    this.destoryChart(this.usersChart);
    this.destoryChart(this.feedbackChart);
  }

  destoryChart(chart) {
    if (chart !== undefined) {
      chart.destroy();
    }
  }

  getRatingValue(value) {
    return (value / 10) * 100;
  }

  ngOnInit() {
    this.loading = true;
    this.getMonthlyReport();
    this.getSessionFeedback();

    this.authService.getProfile().subscribe((user) => {
      this.isMember = user["isMember"];
      this.company = user["company"];
      console.log("Company", this.company);

      if (!this.isMember) {
        if (this.company != null) {
          if (
            new Date(this.company["configs"]["membershipExpireAt"]) > new Date()
          ) {
            this.isMember = true;
          }
        }
      }
      if (this.isMember) {
        this.programmeService
          .getProgrammes(new Date().toISOString(), "", "desc", 0, 4)
          .subscribe((programmes) => {
            if (programmes.length > 0) {
              this.upcomingProgrammes = this.convertDateProperties(programmes);
            } else {
              this.upcomingProgrammes = [];
            }
            this.initializedLoading = true;
          });
        this.getViewershipData();
        this.getUtilisationData();
        this.fetchChallengeKPIs();
      } else {
        this.initializedLoading = true;
      }
    });
    this.userService.firstLoading("", "desc", 0, 20).subscribe((res) => {
      this.totalUsers = res[0];
      this.onboardedUsers = res[2];
      this.supportedMembers = res[3];
      this.initializedLoading = true;
    });
    this.getUtilisationCount();
  }

  getUtilisationCount() {
    this.sessionService
      .getTotalNumbersDocuments("eap", this.startDate, this.endDate)
      .subscribe((count) => {
        console.log("THERAPY NUMBERS", count);
        this.numOfTherapy = count;
      });
    this.sessionService
      .getTotalNumbersDocuments("worklife", this.startDate, this.endDate)
      .subscribe((count) => {
        this.numOfWL = count;
      });
    this.sessionService
      .getTotalNumbersDocuments("chat", this.startDate, this.endDate)
      .subscribe((count) => {
        this.numOfChat = count;
      });
  }

  getSessionFeedback() {
    this.sessionService
      .getFeedback(this.startDate, this.endDate)
      .subscribe((res) => {
        this.sessionsFeedback = res["results"];
        this.numOfResponses = res["numOfResponses"];
        console.log("FEEDBACK RESP >>", res);
        this.buildSessionFeedbackChart();
      });
  }

  getMonthlyReport() {
    this.userService.getUserMonthlyReport().subscribe((res) => {
      this.monthlyReport = res;
      this.monthlyReport = this.monthlyReport.reverse();
      console.log(this.monthlyReport);
      this.buildMonthlyReportChart();
    });
  }

  getDateToDisplay(month, year) {
    let date = new Date(parseInt(year), parseInt(month) - 1, 1);
    let shortMonth = date.toLocaleString("en-us", { month: "short" });
    return shortMonth + "-" + year;
  }

  buildMonthlyReportChart() {
    console.log("SETTING UP BAR GRAPH");
    var usersChart = this.elementRef.nativeElement
      .querySelector(`#usersChart`)
      .getContext("2d");
    this.usersChart = new Chart(usersChart, {
      type: "bar",
      data: {
        labels: this.monthlyReport.map((report) =>
          this.getDateToDisplay(report.month, report.year)
        ),

        datasets: [
          {
            label: "Total Users",
            backgroundColor: "#D3CEF8",
            data: this.monthlyReport.map((report) => report.totalUsers),
          },

          {
            label: "Active Users",
            backgroundColor: "#B3EBF7",
            data: this.monthlyReport.map((report) => report.totalActiveUsers),
          },
        ],
      },
      options: {},
    });
  }

  buildSessionFeedbackChart() {
    try {
      console.log("SETTING UP SESSION GRAPH");
      // let hovering = false,
      //   tooltip = document.getElementById("tooltip"),
      //   tooltips = ["such tooltip", "blah blah"];
      if (this.sessionsFeedback?.length > 0) {
        var feedbackChart = this.elementRef.nativeElement
          .querySelector(`#sessionFeedbackChart`)
          .getContext("2d");

        let labels = this.sessionsFeedback
          .filter((feedback, index) => index < 3)
          .map((f) => f.label);
        console.log("LABELS", labels);
        if (labels.length > 0) {
          if (labels[0] == undefined) {
            labels = ["Effectiveness", "Professional approval", "Satisfaction"];
          }
        }

        this.feedbackChart = new Chart(feedbackChart, {
          type: "polarArea",
          data: {
            labels: labels,

            datasets: [
              {
                label: "Average Rating",
                data: this.sessionsFeedback
                  .filter((feedback, index) => index < 3)
                  .map((f) => f.averageRating),
                backgroundColor: [
                  "#B3EBF7",
                  "#D3CEF8",
                  "#FF9C8D",
                  "rgb(255, 231, 163)",
                  "rgb(83, 90, 169)",
                  "rgb(169, 83, 83)",
                ],
              },

              // {
              //   label: "No. of Sessions",
              //   backgroundColor: "#B3EBF7",
              //   data: [4, 2, 2, 1],
              // },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                // onHover: function (event, legendItem) {
                //   if (hovering) {
                //     return;
                //   }
                //   hovering = true;
                //   tooltip.innerHTML = tooltips[legendItem.datasetIndex];
                //   tooltip.style.left = event.x + "px";
                //   tooltip.style.top = event.y + "px";
                // },
                // onLeave: function () {
                //   hovering = false;
                //   tooltip.innerHTML = "";
                // },
                position: "bottom",
                labels: {
                  usePointStyle: true,
                },
              },
            },
          },
        });
      }
    } catch (error) {
      console.log("SESSION ERROR", error);
    }
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
        if (
          Math.floor(current.registeredUsers.length / current.capacity) * 10 <
          5
        ) {
          isLower = true;
        }
        let convertedProgramme = {
          date: dateFns.format(dateFns.parseISO(current.startDate), "dd/MM/yy"),
          isLower,
          ...current,
        };
        return [convertedProgramme, ...acc];
      }, []);
      return convertedProgrammes;
    }
  }

  formatDate(date) {
    if (date) {
      return dateFns.format(new Date(date), "dd MMM yy");
    }
  }

  getUtilisationData() {
    this.sessionService
      .getUtilisation(this.startDate, this.endDate, this.company["_id"])
      .subscribe((data) => {
        console.log("UTITLISATION", data);
        this.utilisationData = data;
        var therapyChart = this.elementRef.nativeElement
          .querySelector(`#therapyChart`)
          .getContext("2d");
        var wlChart = this.elementRef.nativeElement
          .querySelector(`#wlChart`)
          .getContext("2d");
        var chatChart = this.elementRef.nativeElement
          .querySelector(`#chatChart`)
          .getContext("2d");
        if (
          data["eap"] !== undefined &&
          Object.keys(data["eap"]).length !== 0
        ) {
          this.therapyChart = new Chart(therapyChart, {
            type: "doughnut",
            data: {
              labels: Object.keys(data["eap"]),

              datasets: [
                {
                  label: "Therapy Sessions Top Concerns",
                  data: Object.values(data["eap"]),
                  backgroundColor: [
                    "#B3EBF7",
                    "#D3CEF8",
                    "#FF9C8D",
                    "rgb(255, 231, 163)",
                    "rgb(83, 90, 169)",
                    "rgb(169, 83, 83)",
                  ],
                  hoverOffset: 4,
                },
              ],
            },
            options: {
              cutout: "70%",
              plugins: {
                legend: {
                  position: "bottom",
                },
                title: {
                  display: true,
                  text: "Therapy Sessions Top Concerns",
                },
              },
            },
          });
        }
        if (
          data["worklife"] !== undefined &&
          Object.keys(data["worklife"]).length !== 0
        ) {
          this.wlChart = new Chart(wlChart, {
            type: "doughnut",
            data: {
              labels: Object.keys(data["worklife"]),

              datasets: [
                {
                  label: "Work Life Sessions Top Concerns",
                  data: Object.values(data["worklife"]),
                  backgroundColor: [
                    "#B3EBF7",
                    "#D3CEF8",
                    "#FF9C8D",
                    "rgb(255, 231, 163)",
                  ],
                  hoverOffset: 4,
                },
              ],
            },
            options: {
              cutout: "70%",
              plugins: {
                legend: {
                  position: "bottom",
                },
                title: {
                  display: true,
                  text: "Work Life Sessions Top Concerns",
                },
              },
            },
          });
        }
        if (
          data["chat"] !== undefined &&
          Object.keys(data["chat"]).length !== 0
        ) {
          this.chatChart = new Chart(chatChart, {
            type: "doughnut",
            data: {
              labels: Object.keys(data["chat"]),

              datasets: [
                {
                  label: "Chat Sessions Top Concerns",
                  data: Object.values(data["chat"]),
                  backgroundColor: [
                    "#B3EBF7",
                    "#D3CEF8",
                    "#FF9C8D",
                    "rgb(255, 231, 163)",
                  ],
                  hoverOffset: 4,
                },
              ],
            },
            options: {
              cutout: "70%",
              plugins: {
                legend: {
                  position: "bottom",
                },
                title: {
                  display: true,
                  text: "Chat Sessions Top Concerns",
                },
              },
            },
          });
        }
        this.loading = false;
        console.log(this.therapyChart);
      });
  }

  getViewershipData() {
    this.viewershipService
      .getViewershipStats(this.startDate, this.endDate, this.company["_id"])
      .subscribe((data) => {
        console.log("VIEWERSHIP", data);

        this.viewershipData = data;
      });
  }

  fetchChallengeKPIs() {
    if (!this.company || !this.company["_id"]) return;
    // this.kpiService
    //   .getCompanyChallengeStats({
    //     startDate: this.startDate,
    //     endDate: this.endDate,
    //     company: this.company["_id"],
    //     granularity: this.granularity,
    //   })
    //   .subscribe((stats) => {
    //     this.challengeStats = stats;
    //   });
  }

  onGranularityChange() {
    this.fetchChallengeKPIs();
  }

  exportKpiMetrics() {
    if (!this.challengeStats) return;
    const header = [
      [
        "Unique Participants",
        "Total Participants",
        "Total Completions",
        "% Completion",
        "Average Monthly Participation",
      ],
    ];
    const summaryRow = [
      this.challengeStats.uniqueParticipants ?? 0,
      this.challengeStats.totalParticipants ?? 0,
      this.challengeStats.totalCompletions ?? 0,
      this.challengeStats.pctCompletion ?? 0,
      this.challengeStats.averageMonthlyParticipation ?? 0,
    ];
    const bucketHeader = [["Year", "Quarter", "Month", "Participants", "Completions", "% Completion"]];
    const bucketRows = (this.challengeStats.buckets || []).map((b) => [
      b.year ?? "",
      b.quarter ?? "",
      b.month ?? "",
      b.participants ?? 0,
      b.completions ?? 0,
      b.pctCompletion ?? 0,
    ]);
    const data = [...header, summaryRow, [""], ...bucketHeader, ...bucketRows];
    this.excelService.exportExcel(data, "challenge-kpis");
  }

  changeDate(type, event) {
    console.log("CHANGE DATE");
    console.log(this.presetRange);
    console.log(type);
    this.loading = true;
    if (type == "preset") {
      switch (this.presetRange) {
        case "last7Days":
          console.log("LAST 7");

          this.endDate = new Date();
          this.startDate = dateFns.subDays(new Date(), 7);
          break;
        case "last30Days":
          console.log("LAST 30 DAYS");

          this.endDate = new Date();
          this.startDate = dateFns.subDays(new Date(), 30);
          break;
        case "lastYear":
          console.log("LAST YEAR");
          this.endDate = new Date();
          this.startDate = dateFns.subYears(new Date(), 1);
          break;
      }
    }
    if (this.startDate !== undefined && this.endDate !== undefined) {
      this.destoryChart(this.therapyChart);
      this.destoryChart(this.wlChart);
      this.destoryChart(this.chatChart);
      this.destoryChart(this.feedbackChart);
      this.getViewershipData();
      this.getSessionFeedback();
      this.getUtilisationData();
      this.getUtilisationCount();
      this.fetchChallengeKPIs();
    }
  }
}
