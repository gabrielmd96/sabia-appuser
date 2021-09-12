import { Component, OnDestroy, OnInit } from '@angular/core';
import { tap } from 'rxjs/operators';
import { noop, Subscription } from 'rxjs';
import { InstructorDashClassroom } from '../../models/instructor-dash-models';
import { InstructorDashUploadClassroomService } from '../../services/instructor-dash-upload-classroom.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UrlService } from '../../../services/url.service';

@Component({
  selector: 'classroom-page',
  templateUrl: './classroom-page.component.html',
  styleUrls: ['../../../../assets/styles/instructor-dash.scss']
})
export class ClassroomPageComponent implements OnInit, OnDestroy {

  classroom: InstructorDashClassroom;
  students: string[] = [];
  subscriptions: Subscription[] = [];
  loadingClassroom = true;
  isAddingStudents = false;
  addStudents = false;

  constructor(
    private instructorDashUploadClassroomService: InstructorDashUploadClassroomService,
    private route: ActivatedRoute,
    private router: Router,
    private urlService: UrlService
  ) {
  }

  ngOnInit(): void {
    const classroomId = this.route.snapshot.paramMap.get('classroomId');
    const fetchClassroom = this.instructorDashUploadClassroomService.fetchClassroom(classroomId).pipe(
      tap((classroom) => {
        this.classroom = classroom;
        this.instructorDashUploadClassroomService.setClassroom(this.classroom);
        this.students = this.classroom.students;
        this.loadingClassroom = false;
      })
    ).subscribe(noop);
    this.subscriptions.push(fetchClassroom);
  }

  ngOnDestroy(): void {
    this.subscriptions.map(u => u.unsubscribe);
  }

  openAddStudentsForm(): void {
    this.addStudents = true;
  }

  addedStudents($event): void {
    this.students = this.students.concat($event);
    this.isAddingStudents = true;
  }

  uploadStudents(): void {
    this.isAddingStudents = false;
    this.addStudents = false;
    this.instructorDashUploadClassroomService.addStudents(this.students);
  }

  goToRanking(): void {
    this.router.navigate([this.urlService.getClassroomRanking(this.classroom.classroomId)]);
  }

}
