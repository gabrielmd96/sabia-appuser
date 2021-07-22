import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { QuestionaryService } from '../../services/questionary.service';
import { tap } from 'rxjs/operators';
import { noop } from 'rxjs';
import { Alternative, Question, QuestionaryAnswer } from '../../models/questionary-models';

@Component({
  selector: 'app-questionary-question-page',
  templateUrl: './questionary-question-page.component.html',
  styleUrls: ['./questionary-question-page.component.scss']
})
export class QuestionaryQuestionPageComponent implements OnInit {

  questionaryId: string;
  loadingQuestionary: boolean;
  questionary: QuestionaryAnswer;
  questions: Question[];
  currentQuestion: Question;
  currentQuestionNumber: number;
  score: number;

  constructor(
    private questionaryService: QuestionaryService,
    private route: ActivatedRoute
  ) {
    this.score = 0;
  }

  ngOnInit(): void {
    this.currentQuestionNumber = 1;
    this.loadingQuestionary = true;
    this.questionaryId = this.route.snapshot.paramMap.get('questionaryId');
    this.questionaryService.fetchQuestionary(this.questionaryId).pipe(
      tap((questionary) => {
        this.questionaryService.setQuestionary(questionary);
        this.questionary = questionary;
        this.questions = questionary.questions;
        this.currentQuestion = this.questions[this.currentQuestionNumber - 1];
        this.loadingQuestionary = false;
      })
    ).subscribe(noop);
  }

  nextQuestion(alternative: Alternative): void {
    this.questions[this.currentQuestionNumber - 1].gotRight = alternative.isRight;
    if (alternative.isRight) {
      this.score += 1;
    }
    if (this.currentQuestionNumber === this.questions.length) {
      this.questionary.questions = this.questions;
      this.questionary.score = this.score;
      if (this.questionary.tentatives) {
        this.questionary.tentatives += 1;
      } else {
        this.questionary.tentatives = 1;
      }
      this.questionaryService.updateQuestionary(this.questionaryId, this.questionary)
        .then(() => console.log('Ir pra página de questionário concluído'))
        .catch((error) => console.log(error));
    } else {
      this.currentQuestionNumber += 1;
      this.currentQuestion = this.questions[this.currentQuestionNumber - 1];
    }
  }
}
