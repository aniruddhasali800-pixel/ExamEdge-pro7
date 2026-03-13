import { Routes } from '@angular/router';
import { LoginComponent } from './components/login.component';
import { AdminDashboardComponent } from './components/admin-dashboard.component';
import { StudentDashboardComponent } from './components/student-dashboard.component';
import { TeacherDashboardComponent } from './components/teacher-dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'admin', component: AdminDashboardComponent },
  { path: 'student', component: StudentDashboardComponent },
  { path: 'teacher', component: TeacherDashboardComponent },
];
