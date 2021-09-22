import * as functions from 'firebase-functions';
import { PreEnrollment, UserData } from './models';
import * as admin from 'firebase-admin';
import { firestore } from 'firebase-admin';
import WriteResult = firestore.WriteResult;

async function createEnrollmentFromPreEnrollment(preEnrollment: PreEnrollment, userId: string): Promise<WriteResult> {
  return admin.firestore().doc(`/enrollments/${ userId + '-' + preEnrollment.classroomId }`)
    .create({
      courseId: preEnrollment.courseId,
      courseName: preEnrollment.courseName,
      courseDescription: preEnrollment.courseDescription,
      courseLink: preEnrollment.courseLink,
      classroomName: preEnrollment.classroomName,
      institutionName: preEnrollment.institutionName,
      score: 0,
      classroomId: preEnrollment.classroomId,
      userId
    });
}

async function updateRanking(classroomId: string, userData: UserData): Promise<WriteResult> {
  return admin.firestore().doc(`/classRankings/${ classroomId }`)
    .update({
      ranking: admin.firestore.FieldValue.arrayUnion({
        userId: userData.userId,
        userName: userData.firstName + ' ' + userData.lastName,
        userScore: 0
      })
    });
}

async function createModuleProgress(moduleTemplate: any, userId: string, enrollment: any): Promise<WriteResult> {
  return admin.firestore().doc(`moduleProgress/${ userId + '-' + moduleTemplate.moduleId }`)
    .create({
      userId,
      moduleId: moduleTemplate.moduleId,
      moduleName: moduleTemplate.moduleName,
      institutionName: enrollment.institutionName,
      lessons: moduleTemplate.lessons,
      score: 0,
      classroomId: enrollment.classroomId,
      moduleProgressPercentage: 0,
      courseId: enrollment.courseId,
    });
}

async function createEnrollmentFromClassroom(classroom: any, userId: string): Promise<WriteResult> {
  return admin.firestore().doc(`/enrollments/${ userId + '-' + classroom.classroomId }`)
    .create({
      courseId: classroom.courseId,
      courseName: classroom.courseName,
      classroomName: classroom.classroomName,
      institutionName: classroom.institutionName,
      courseDescription: classroom.courseDescription,
      courseLink: classroom.courseLink,
      score: 0,
      classroomId: classroom.classroomId,
      userId,
    });
}

export const createEnrollmentWhenCreateUserData = functions.firestore
  .document('userData/{userId}')
  .onCreate(async (snap) => {
    const userData: UserData = {
      userId: snap.data().userId,
      email: snap.data().email,
      firstName: snap.data().firstName,
      lastName: snap.data().lastName
    };
    const userDoc = await admin.firestore().doc(`users/${ userData.email }`).get();
    const data = userDoc?.data() ?? null;
    if (data !== null) {
      const preEnrollments: PreEnrollment[] = data.preEnrollments;
      const promises: Promise<WriteResult>[] = [];
      preEnrollments.forEach(preEnrollment => {
        const p1 = createEnrollmentFromPreEnrollment(preEnrollment, userData.userId);
        const p2 = updateRanking(preEnrollment.classroomId, userData);
        promises.push(p1, p2);
      });
      return Promise.all(promises);
    } else {
      return null;
    }
  });

// ToDo: Refactor
export const createEnrollmentWhenCreateOrUpdateClassroombackup = functions.firestore
  .document('classrooms/{classroomId}')
  .onWrite((change) => {
    const data = change.after.data();
    // Verifica se os dados existem
    if (data) {
      const students = data.students;
      const classroomId = data.classroomId;
      const classroom = data;
      // Cria o Ranking da turma com array vazio
      admin.firestore().doc(`/classRankings/${ classroomId }`)
        .create({
          classroomId,
          courseId: classroom.courseId,
          courseName: classroom.courseName,
          classroomName: classroom.classroomName,
          institutionName: classroom.institutionName,
        }).then(() => console.log(`criou o ranking da turma ${ classroomId }`));
      // Itera no array de students dos dados para criar as matrículas de cada aluno
      students.map((studentEmail: any) => {
        admin.firestore().collection('userData')
          .where('email', '==', studentEmail).get()
          .then((querySnapshot: any) => {
            // Verifica se o usuário existe no userData
            if (!querySnapshot.empty) {
              querySnapshot.forEach((user: any) => {
                const userData = user.data();
                const userId = user.id;
                // Cria o enrollment do aluno
                admin.firestore().doc(`/enrollments/${ userId + '-' + classroomId }`)
                  .create({
                    courseId: classroom.courseId,
                    courseName: classroom.courseName,
                    classroomName: classroom.classroomName,
                    institutionName: classroom.institutionName,
                    courseDescription: classroom.courseDescription,
                    courseLink: classroom.courseLink,
                    score: 0,
                    classroomId,
                    userId,
                  })
                  .then(() => {
                    // Atualiza o ranking com o aluno novo
                    admin.firestore().doc(`/classRankings/${ classroomId }`)
                      .update({
                        ranking: admin.firestore.FieldValue.arrayUnion({
                          userId,
                          userName: userData.firstName + ' ' + userData.lastName,
                          userScore: 0
                        })
                      });
                  })
                  .catch((err) => console.log('erro:', err));
              });
            } else {
              // Aluno não é um usuário (adiciona em users sem conta com pre-enrollment: classroomId)
              admin.firestore().collection('users').doc(studentEmail).set(
                {
                  email: studentEmail,
                  preEnrollments: admin.firestore.FieldValue.arrayUnion({
                    courseId: classroom.courseId,
                    courseName: classroom.courseName,
                    classroomName: classroom.classroomName,
                    institutionName: classroom.institutionName,
                    courseDescription: classroom.courseDescription,
                    courseLink: classroom.courseLink,
                    classroomId
                  })
                }
                , { merge: true })
                .then(() => console.log('adicionou um novo usuário'))
                .catch((err) => console.log(err));
            }
          })
          .catch((err: any) => console.log(err));
      });
    } else {
      functions.logger
        .info('Dados da classe não existem', { structuredData: true });
    }
  });

export const createEnrollmentWhenCreateOrUpdateClassroom = functions.firestore
  .document('classrooms/{classroomId}')
  .onWrite((change) => {
    const data = change.after.data();
    // Verifica se os dados existem
    if (data) {
      const students = data.students;
      const classroomId = data.classroomId;
      const classroom = data;
      const promises = [];
      // Cria o Ranking da turma com array vazio
      const createClassRanking = admin.firestore().doc(`/classRankings/${ classroomId }`)
        .create({
          classroomId,
          courseId: classroom.courseId,
          courseName: classroom.courseName,
          classroomName: classroom.classroomName,
          institutionName: classroom.institutionName,
        }).then(() => console.log(`criou o ranking da turma ${ classroomId }`));
      promises.push(createClassRanking);
      // Itera no array de students dos dados para criar as matrículas de cada aluno
      students.map((studentEmail: string) => {
        admin.firestore().collection('userData')
          .where('email', '==', studentEmail).get()
          .then((querySnapshot: any) => {
            // Verifica se o usuário existe no userData
            if (!querySnapshot.empty) {
              querySnapshot.forEach((user: any) => {
                const userData = user.data();
                const userId = user.id;
                // Cria o enrollment do aluno
                const p1 = createEnrollmentFromClassroom(classroom, userId);
                const p2 = updateRanking(classroom.classroomId, userData);
                promises.push(p1, p2);
              });
            } else {
              // Aluno não é um usuário (adiciona em users sem conta com pre-enrollment: classroomId)
              const createNewUser = admin.firestore().collection('users').doc(studentEmail).set(
                {
                  email: studentEmail,
                  preEnrollments: admin.firestore.FieldValue.arrayUnion({
                    courseId: classroom.courseId,
                    courseName: classroom.courseName,
                    classroomName: classroom.classroomName,
                    institutionName: classroom.institutionName,
                    courseDescription: classroom.courseDescription,
                    courseLink: classroom.courseLink,
                    classroomId
                  })
                }
                , { merge: true })
                .then(() => console.log('adicionou um novo usuário'))
                .catch((err) => console.log(err));
              promises.push(createNewUser);
            }
          })
          .catch((err: any) => console.log(err));
      });
      return Promise.all(promises);
    } else {
      functions.logger
        .info('Dados da classe não existem', { structuredData: true });
      return null;
    }
  });

export const createmoduleProgressWhenCreateEnrollment = functions.firestore
  .document('enrollments/{enrollmentId}')
  .onCreate(async (snap) => {
    const enrollment = snap.data();
    if (enrollment) {
      const userId = enrollment.userId;
      const courseQuery = await admin.firestore().doc(`courseTemplate/${ enrollment.courseId }`).get();
      const course = courseQuery.data();
      if (course) {
        const promises: Promise<WriteResult>[] = [];
        course.modules.forEach((moduleId: string) => {
          admin.firestore().doc(`moduleTemplate/${ moduleId }`).get()
            .then((module) => {
              const moduleData = module?.data() ?? null;
              if (moduleData) {
                const p = createModuleProgress(moduleData, userId, enrollment);
                promises.push(p);
              } else {
                throw Error('No Module Data');
              }
            })
            .catch(err => console.log(err));
        });
        return Promise.all(promises);
      } else {
        throw Error('No Course Data');
        return null;
      }
    } else {
      functions.logger
        .info('Dados da matrícula não existem', { structuredData: true });
      return null;
    }
  });

export const createmoduleProgressWhenCreateEnrollmentBackup = functions.firestore
  .document('enrollments/{enrollmentId}')
  .onCreate((snap) => {
    const enrollment = snap.data();
    if (enrollment) {
      const userId = enrollment.userId;
      admin.firestore().doc(`courseTemplate/${ enrollment.courseId }`).get()
        .then((query) => {
          const course = query.data();
          if (course) {
            course.modules.forEach((moduleId: string) => {
              admin.firestore().doc(`moduleTemplate/${ moduleId }`).get()
                .then((module) => {
                  const moduleData = module.data();
                  if (moduleData) {
                    admin.firestore().doc(`moduleProgress/${ userId + '-' + moduleData.moduleId }`)
                      .create({
                        userId,
                        moduleId,
                        moduleName: moduleData.moduleName,
                        institutionName: enrollment.institutionName,
                        lessons: moduleData.lessons,
                        score: 0,
                        classroomId: enrollment.classroomId,
                        moduleProgressPercentage: 0,
                        courseId: enrollment.courseId,
                      });
                  } else {
                    throw Error('No Module Data');
                  }
                })
                .catch(err => console.log(err));
            });
          } else {
            throw Error('No Course Data');
          }
        })
        .catch(err => console.log(err));
    } else {
      functions.logger
        .info('Dados da matrícula não existem', { structuredData: true });
    }
  });

// ToDo: Refactor
export const createQuestionnaireAnswerWhenCreateModuleProgressBackup = functions.firestore
  .document('moduleProgress/{moduleProgressId}')
  .onCreate((snap) => {
    const moduleProgress = snap.data();
    if (moduleProgress) {
      const lessons = moduleProgress.lessons;
      lessons.forEach((lesson: any) => {
        if (lesson.lessonType === 'QUESTIONNAIRE') {
          const questionnaireId = lesson.questionnaireId;
          admin.firestore().doc(`questionnaireTemplate/${ questionnaireId }`).get()
            .then(doc => {
              const questionnaireTemplate = doc.data();
              if (questionnaireTemplate) {
                // O "in" limita a query a 10 objetos. Assim, um questionário não pode ter mais de 10 questões.
                admin.firestore().collection('questionTemplate')
                  .where('questionId', 'in', questionnaireTemplate.questions)
                  .get()
                  .then((questionsData) => {
                    const questions: any[] = [];
                    questionsData.docs.forEach(questionDoc => questions.push(questionDoc.data()));
                    admin.firestore().doc(`questionnaireAnswers/${ moduleProgress.userId + '-' + questionnaireId }`)
                      .create({
                        userId: moduleProgress.userId,
                        questionnaireId,
                        questionnaireName: questionnaireTemplate.questionnaireName,
                        questions,
                        classroomId: moduleProgress.classroomId,
                        moduleId: moduleProgress.moduleId
                      });
                  })
                  .catch(err => console.log('erro:', err));
              } else {
                functions.logger
                  .info('Questionnaire não existe', { structuredData: true });
              }
            }).catch((err) => console.log('erro:', err));
        }
      });
    } else {
      functions.logger
        .info('Dados do moduleProgress não existem', { structuredData: true });
    }
  });

export const createQuestionnaireAnswerWhenCreateModuleProgress = functions.firestore
  .document('moduleProgress/{moduleProgressId}')
  .onCreate((snap) => {
    const moduleProgress = snap.data();
    if (moduleProgress) {
      const lessons = moduleProgress.lessons;
      lessons.forEach((lesson: any) => {
        if (lesson.lessonType === 'QUESTIONNAIRE') {
          const questionnaireId = lesson.questionnaireId;
          admin.firestore().doc(`questionnaireTemplate/${ questionnaireId }`).get()
            .then(doc => {
              const questionnaireTemplate = doc.data();
              if (questionnaireTemplate) {
                // O "in" limita a query a 10 objetos. Assim, um questionário não pode ter mais de 10 questões.
                admin.firestore().collection('questionTemplate')
                  .where('questionId', 'in', questionnaireTemplate.questions)
                  .get()
                  .then((questionsData) => {
                    const questions: any[] = [];
                    questionsData.docs.forEach(questionDoc => questions.push(questionDoc.data()));
                    admin.firestore().doc(`questionnaireAnswers/${ moduleProgress.userId + '-' + questionnaireId }`)
                      .create({
                        userId: moduleProgress.userId,
                        questionnaireId,
                        questionnaireName: questionnaireTemplate.questionnaireName,
                        questions,
                        classroomId: moduleProgress.classroomId,
                        moduleId: moduleProgress.moduleId
                      });
                  })
                  .catch(err => console.log('erro:', err));
              } else {
                functions.logger
                  .info('Questionnaire não existe', { structuredData: true });
              }
            }).catch((err) => console.log('erro:', err));
        }
      });
    } else {
      functions.logger
        .info('Dados do moduleProgress não existem', { structuredData: true });
    }
  });
