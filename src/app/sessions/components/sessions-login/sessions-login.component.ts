import { Component, OnDestroy, OnInit } from '@angular/core';
import { SessionsLoginService } from '../../services/sessions-login.service';
import { FormControl } from '@angular/forms';
import { noop, Observable, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { SessionsLoginPageComponent } from '../../containers/sessions-login-page/sessions-login-page.component';
import { Router } from '@angular/router';
import { UrlService } from '../../../services/url.service';
import { AngularFirestore } from '@angular/fire/firestore';

@Component({
  selector: 'sessions-login',
  templateUrl: './sessions-login.component.html',
  styleUrls: ['./sessions-login.component.scss']
})
export class SessionsLoginComponent implements OnInit, OnDestroy {

  unsubscriptions = [];
  email = new FormControl('');
  password: string;
  formControl: FormControl;
  userData;

  constructor(
    private loginService: SessionsLoginService,
    private sessionsLoginPage: SessionsLoginPageComponent,
    private router: Router,
    private urlService: UrlService,
    private angularFirestore: AngularFirestore
  ) {
  }

  ngOnInit(): void {
    if (localStorage.getItem('firebaseJWT')) {
      const token = JSON.parse(localStorage.getItem('firebaseJWT'));
      this.router.navigate([this.urlService.getHomeUrl()]);
    }
  }

  ngOnDestroy(): void {
    this.unsubscriptions.map(u => u.unsubscribe());
  }

  verifyEmail(): void {
    const fetchUsers = this.loginService.verifyEmail(this.email.value, 'users').pipe(
      tap(user => {
        [this.userData] = user;
        if (this.userData && this.userData.firstLogin) {
          this.sessionsLoginPage.setEmail(this.email.value);
          this.sessionsLoginPage.setShowInputPassword(true);
        } else if (this.userData) {
          // vai pro primeiro login (cadastro)
          // TODO: mandar usuário para o fluxo de cadastro
          console.log('banana');
        } else {
          // emite mensagem de erro
          // TODO: mostrar aviso
          console.log('caju');
        }
      })
    ).subscribe(noop);
    this.unsubscriptions.push(fetchUsers);
  }
}
