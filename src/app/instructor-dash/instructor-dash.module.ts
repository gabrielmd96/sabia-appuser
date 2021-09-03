import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClassroomsPageComponent } from './containers/classrooms-page/classrooms-page.component';
import { RouterModule } from '@angular/router';
import { InstructorDashRoutes } from './instructor-dash-routing.module';
import { LayoutInstructorDashComponent } from './layout/layout-instructor-dash/layout-instructor-dash.component';
import { CollactDesignSystemModule } from 'collact-design-system';
import { FlexLayoutModule } from '@angular/flex-layout';
import { InstructorDashUploadClassroomService } from './services/instructor-dash-upload-classroom.service';
import { ClassroomPageComponent } from './containers/classroom-page/classroom-page.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CreateNewClassroomPageComponent } from './containers/create-new-classroom-page/create-new-classroom-page.component';



@NgModule({
  declarations: [
    LayoutInstructorDashComponent,
    ClassroomsPageComponent,
    ClassroomPageComponent,
    CreateNewClassroomPageComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    RouterModule.forChild(InstructorDashRoutes),
    CollactDesignSystemModule,
    FlexLayoutModule,
    MatProgressSpinnerModule,
  ],
  providers: [
    InstructorDashUploadClassroomService
  ]
})
export class InstructorDashModule { }
