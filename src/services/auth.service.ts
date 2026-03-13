import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from './data.service';

export type UserRole = 'admin' | 'student' | 'teacher' | null;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isPro?: boolean;
  purchasedItemIds?: string[];
  studyFocus?: {
    topicId: string;
    subTopicId: string;
    subTopicName: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser = signal<User | null>(null);
  private dataService = inject(DataService);
  private USER_KEY = 'examedge_user_session';

  // Hardcoded allowed admins
  private ALLOWED_ADMINS = [
    { email: 'admin@examedge.pro', password: 'admin@examedge.pro', name: 'Dashboard Admin' },
    { email: 'support@examedge.pro', password: 'email_password', name: 'Support Admin' }
  ];

  private ALLOWED_TEACHERS = [
    { email: 'evelyn.reed@examedge.pro', password: 'password' },
    { email: 'john.alistair@examedge.pro', password: 'password' }
  ];


  constructor(private router: Router) {
    // Restore session
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem(this.USER_KEY);
      if (savedUser) {
        this.currentUser.set(JSON.parse(savedUser));
      }
    }
  }

  // Generic student login
  loginStudent() {
    const user: User = {
      id: 'student-free-01',
      name: 'Guest Student',
      email: 'guest@student.com',
      role: 'student',
      isPro: false,
      purchasedItemIds: []
    };
    this.dataService.logActivity(user.email, 'Sign In');
    this.currentUser.set(user);
    this.persistUser(user);
    this.router.navigate(['/student']);
  }

  // Specific admin login
  loginAdmin(email: string, password: string): boolean {
    const admin = this.ALLOWED_ADMINS.find(a => a.email.toLowerCase() === email.toLowerCase().trim() && a.password === password.trim());
    
    if (admin) {
      const user: User = {
        id: 'admin-' + admin.email,
        name: admin.name,
        email: admin.email,
        role: 'admin'
      };
      this.dataService.logActivity(user.email, 'Sign In');
      this.currentUser.set(user);
      this.persistUser(user);
      this.router.navigate(['/admin']);
      return true;
    }
    return false;
  }

  loginTeacher(email: string, password: string): boolean {
    const teacherAuth = this.ALLOWED_TEACHERS.find(t => t.email.toLowerCase() === email.toLowerCase().trim() && t.password === password.trim());
    if (teacherAuth) {
      const teacherProfile = this.dataService.teachers().find(t => t.email === teacherAuth.email);
      if (teacherProfile) {
        const user: User = {
          id: teacherProfile.id,
          name: teacherProfile.name,
          email: teacherProfile.email,
          role: 'teacher'
        };
        this.dataService.logActivity(user.email, 'Sign In');
        this.currentUser.set(user);
        this.persistUser(user);
        this.router.navigate(['/teacher']);
        return true;
      }
    }
    return false;
  }


  purchaseProPlan(price: number) {
    this.currentUser.update(user => {
      if (!user || user.role !== 'student' || user.isPro) return user;
      
      const updatedUser = { 
        ...user, 
        isPro: true
      };
      
      this.persistUser(updatedUser);
      this.dataService.recordTransaction(user.email, price);
      
      return updatedUser;
    });
  }
  
  purchaseItem(itemId: string, price: number) {
    this.currentUser.update(user => {
      if (!user || user.role !== 'student') return user;

      const purchasedItemIds = [...(user.purchasedItemIds || []), itemId];
      const updatedUser = { ...user, purchasedItemIds };
      
      this.persistUser(updatedUser);
      this.dataService.recordTransaction(user.email, price);

      return updatedUser;
    });
  }

  setStudyFocusAndLogout(focus: { topicId: string, subTopicId: string, subTopicName: string }) {
    this.currentUser.update(user => {
      if (!user) return null;
      const updatedUser = { ...user, studyFocus: focus };
      this.persistUser(updatedUser);
      return updatedUser;
    });
    // Logout after setting focus
    this.logout();
  }

  logout() {
    const user = this.currentUser();
    if (user) {
      this.dataService.logActivity(user.email, 'Sign Out');
    }
    this.currentUser.set(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.USER_KEY);
    }
    this.router.navigate(['/login']);
  }

  private persistUser(user: User) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }
}