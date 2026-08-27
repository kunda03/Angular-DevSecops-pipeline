import { Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';
import { StudentDetails } from './components/student-details/student-details';
import { EditStudent } from './components/edit-student/edit-student';

export const routes: Routes = [
  {
    path: '',
    component: Dashboard
  },
  {
    path: 'student/:id',
    component: StudentDetails
  },
  {
    path: 'edit/:id',
    component: EditStudent
  },
  {
    path: '**',
    redirectTo: ''
  }
];