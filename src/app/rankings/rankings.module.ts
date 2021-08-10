import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RankingsClassPageComponent } from './containers/rankings-class-page/rankings-class-page.component';
import { LayoutRankingsComponent } from './layout/layout-rankings/layout-rankings.component';
import { RouterModule } from '@angular/router';
import { RankingsRoutes } from '../rankings/rankings-routing.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { RankingsPageComponent } from './containers/rankings-page/rankings-page.component';



@NgModule({
  declarations: [
    LayoutRankingsComponent,
    RankingsClassPageComponent,
    RankingsPageComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    RouterModule.forChild(RankingsRoutes),
    FlexLayoutModule,
  ]
})
export class RankingsModule { }
