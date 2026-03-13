import { Component, inject, computed, signal, ElementRef, viewChild, effect } from '@angular/core';
import { CommonModule, CurrencyPipe, PercentPipe } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { DataService, ContentItem, VideoLecture, LiveSession, Teacher } from '../services/data.service';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GeminiService } from '../services/gemini.service';
import * as d3 from 'd3';

interface TeacherRevenueStat {
  teacher: Teacher;
  grossRevenue: number;
  platformCut: number;
  netEarnings: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyPipe, PercentPipe],
  template: `
    <div class="flex h-screen bg-slate-100 font-sans relative overflow-hidden">
      <!-- Mobile Sidebar Overlay -->
      @if (isSidebarOpen()) {
        <div (click)="toggleSidebar()" class="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm animate-fade-in"></div>
      }

      <!-- Sidebar -->
      <aside [class.translate-x-0]="isSidebarOpen()" [class.-translate-x-full]="!isSidebarOpen()" class="fixed md:static inset-y-0 left-0 w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-30 transition-transform duration-300 ease-in-out md:translate-x-0">
        <div class="p-6 border-b border-slate-800 flex justify-between items-center">
          <div class="flex items-center gap-2">
             <i class="fa-solid fa-layer-group text-blue-500 text-xl"></i>
             <div>
               <h2 class="text-xl font-bold text-white tracking-tight leading-none">ExamEdge</h2>
               <span class="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Admin Panel</span>
             </div>
          </div>
          <button (click)="toggleSidebar()" class="md:hidden text-slate-400 hover:text-white">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>
        
        <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
          <button (click)="setActive('dashboard')" 
                  [class]="getNavClass('dashboard')"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200">
            <i class="fa-solid fa-chart-pie w-5 text-center"></i> Dashboard
          </button>
          
          <button (click)="setActive('revenue')" 
                  [class]="getNavClass('revenue')"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200">
            <i class="fa-solid fa-percent w-5 text-center"></i> Teacher Revenue
          </button>

          <button (click)="setActive('pdfs')" 
                  [class]="getNavClass('pdfs')"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200">
            <i class="fa-solid fa-file-pdf w-5 text-center"></i> PDFs & Notes
          </button>

          <button (click)="setActive('videos')" 
                  [class]="getNavClass('videos')"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200">
            <i class="fa-solid fa-video w-5 text-center"></i> Videos & Sessions
          </button>
          
          <button (click)="setActive('queries')" 
                  [class]="getNavClass('queries')"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200">
            <i class="fa-solid fa-comments w-5 text-center"></i> 
            Queries
            @if (pendingQueriesCount() > 0) {
              <span class="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{{ pendingQueriesCount() }}</span>
            }
          </button>

          <button (click)="setActive('users')" 
                  [class]="getNavClass('users')"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200">
            <i class="fa-solid fa-users-gear w-5 text-center"></i> Users
          </button>
          
           <button (click)="setActive('logs')" 
                  [class]="getNavClass('logs')"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200">
            <i class="fa-solid fa-clock-rotate-left w-5 text-center"></i> Logs
          </button>
        </nav>

        <div class="p-4 border-t border-slate-800">
          <button (click)="authService.logout()" class="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-800 rounded-lg transition-colors">
            <i class="fa-solid fa-right-from-bracket"></i> Logout
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto flex flex-col w-full">
        <header class="bg-white shadow-sm sticky top-0 z-10 px-4 md:px-8 py-4 flex justify-between items-center flex-shrink-0">
          <div class="flex items-center gap-3">
            <button (click)="toggleSidebar()" class="md:hidden text-slate-600 hover:text-slate-900">
              <i class="fa-solid fa-bars text-xl"></i>
            </button>
            <h1 class="text-xl font-bold text-slate-800 capitalize">{{ activeTab() === 'pdfs' ? 'PDFs & Notes' : (activeTab() === 'videos' ? 'Videos & Sessions' : (activeTab() === 'revenue' ? 'Teacher Revenue' : activeTab())) }}</h1>
          </div>
          <div class="flex items-center gap-4">
             <div class="hidden md:flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                System Operational
             </div>
             <img src="https://ui-avatars.com/api/?name={{ authService.currentUser()?.name }}&background=0D8ABC&color=fff" class="w-8 h-8 rounded-full border-2 border-slate-200">
          </div>
        </header>

        <div class="p-4 md:p-8">
          @switch (activeTab()) {
            @case ('dashboard') {
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                <!-- Total Revenue Card -->
                <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div class="flex justify-between items-start mb-4">
                    <div>
                      <p class="text-slate-500 text-sm font-medium">Total Revenue (Gross Sales)</p>
                      <h3 class="text-3xl font-bold text-slate-800">{{ dataService.analytics().totalSales | currency }}</h3>
                    </div>
                    <div class="p-2 bg-green-100 text-green-600 rounded-lg"><i class="fa-solid fa-dollar-sign"></i></div>
                  </div>
                   @if (isRevenueIncreasing()) {
                      <p class="text-xs text-green-600 flex items-center gap-1">
                        <i class="fa-solid fa-arrow-trend-up"></i> +{{ revenueChange() | number:'1.1-1' }}% this month
                      </p>
                   } @else {
                       <p class="text-xs text-red-600 flex items-center gap-1">
                        <i class="fa-solid fa-arrow-trend-down"></i> {{ revenueChange() | number:'1.1-1' }}% this month
                      </p>
                   }
                </div>
                
                <!-- Platform Earnings Card -->
                <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div class="flex justify-between items-start mb-4">
                    <div>
                      <p class="text-slate-500 text-sm font-medium">Platform Earnings</p>
                      <h3 class="text-3xl font-bold text-green-700">{{ totalPlatformCut() | currency }}</h3>
                    </div>
                    <div class="p-2 bg-teal-100 text-teal-600 rounded-lg"><i class="fa-solid fa-landmark"></i></div>
                  </div>
                  <p class="text-xs text-slate-500">Your share of total gross sales</p>
                </div>

                 <!-- Video Lectures Card -->
                <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div class="flex justify-between items-start">
                    <div>
                      <p class="text-slate-500 text-sm font-medium">Video Lectures</p>
                      <h3 class="text-3xl font-bold text-slate-800">{{ totalVideos() }}</h3>
                      <p class="text-lg font-semibold text-green-600 mt-1">{{ dataService.analytics().videoEarnings | currency }}</p>
                    </div>
                    <div class="p-2 bg-purple-100 text-purple-600 rounded-lg"><i class="fa-solid fa-clapperboard"></i></div>
                  </div>
                  <p class="text-xs text-slate-500 mt-2">Total videos & earnings</p>
                </div>

                <!-- Live Sessions Card -->
                <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div class="flex justify-between items-start">
                    <div>
                      <p class="text-slate-500 text-sm font-medium">Live Sessions</p>
                      <h3 class="text-3xl font-bold text-slate-800">{{ liveSessionsCount() }}</h3>
                      <p class="text-lg font-semibold text-green-600 mt-1">{{ dataService.analytics().liveSessionEarnings | currency }}</p>
                    </div>
                    <div class="p-2 bg-red-100 text-red-600 rounded-lg"><i class="fa-solid fa-tower-broadcast"></i></div>
                  </div>
                  <p class="text-xs text-slate-500 mt-2">Active classes & total earnings</p>
                </div>

                <!-- PDFs & Notes Card -->
                 <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div class="flex justify-between items-start">
                    <div>
                      <p class="text-slate-500 text-sm font-medium">PDFs & Notes</p>
                      <h3 class="text-3xl font-bold text-slate-800">{{ totalPDFs() }}</h3>
                      <p class="text-lg font-semibold text-green-600 mt-1">{{ dataService.analytics().pdfEarnings | currency }}</p>
                    </div>
                    <div class="p-2 bg-cyan-100 text-cyan-600 rounded-lg"><i class="fa-solid fa-file-zipper"></i></div>
                  </div>
                  <p class="text-xs text-slate-500 mt-2">Total documents & earnings</p>
                </div>

                <!-- Total Students Card -->
                <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div class="flex justify-between items-start mb-4">
                    <div>
                      <p class="text-slate-500 text-sm font-medium">Total Students</p>
                      <h3 class="text-3xl font-bold text-slate-800">{{ totalStudents() }}</h3>
                    </div>
                    <div class="p-2 bg-blue-100 text-blue-600 rounded-lg"><i class="fa-solid fa-users"></i></div>
                  </div>
                  <p class="text-xs text-slate-500">Platform-wide registered users</p>
                </div>

                <!-- Pending Queries Card -->
                <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div class="flex justify-between items-start mb-4">
                    <div>
                      <p class="text-slate-500 text-sm font-medium">Pending Queries</p>
                      <h3 class="text-3xl font-bold text-slate-800">{{ pendingQueriesCount() }}</h3>
                    </div>
                    <div class="p-2 bg-orange-100 text-orange-600 rounded-lg"><i class="fa-solid fa-circle-question"></i></div>
                  </div>
                  <p class="text-xs text-orange-600">Action required from teachers</p>
                </div>

                <!-- Active Teachers Card -->
                <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div class="flex justify-between items-start mb-4">
                    <div>
                      <p class="text-slate-500 text-sm font-medium">Active Teachers</p>
                      <h3 class="text-3xl font-bold text-slate-800">{{ activeTeachersCount() }}</h3>
                    </div>
                    <div class="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><i class="fa-solid fa-chalkboard-user"></i></div>
                  </div>
                  <p class="text-xs text-slate-500">Instructors currently live</p>
                </div>
              </div>

              <!-- Charts Section -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <h4 class="font-bold text-slate-800 mb-6">Monthly Revenue</h4>
                  <div #chartContainer class="h-64 w-full"></div>
                </div>
                 <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <h4 class="font-bold text-slate-800 mb-6">Recent Transactions</h4>
                  <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left text-slate-600">
                      <thead class="bg-slate-50 text-slate-700 uppercase font-bold text-xs">
                        <tr>
                          <th class="px-4 py-3">User</th>
                          <th class="px-4 py-3">Amount</th>
                          <th class="px-4 py-3">Status</th>
                          <th class="px-4 py-3">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for(tx of dataService.transactions().slice(0, 5); track tx.id) {
                          <tr class="border-b border-slate-100">
                            <td class="px-4 py-3 font-medium">{{ tx.userEmail }}</td>
                            <td class="px-4 py-3">{{ tx.amount | currency }}</td>
                            <td class="px-4 py-3"><span [class]="getStatusClass(tx.status)">{{ tx.status }}</span></td>
                            <td class="px-4 py-3 text-xs text-slate-400">{{ tx.date }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            }

            @case ('revenue') {
              <!-- Summary Cards -->
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div class="bg-white p-6 rounded-xl shadow-sm border">
                      <p class="text-slate-500 text-sm font-medium">Total Teachers</p>
                      <h3 class="text-3xl font-bold text-slate-800">{{ dataService.teachers().length }}</h3>
                  </div>
                  <div class="bg-white p-6 rounded-xl shadow-sm border">
                      <p class="text-slate-500 text-sm font-medium">Total Gross Revenue</p>
                      <h3 class="text-3xl font-bold text-slate-800">{{ totalGrossRevenue() | currency }}</h3>
                  </div>
                  <div class="bg-white p-6 rounded-xl shadow-sm border">
                      <p class="text-slate-500 text-sm font-medium">Platform Commission</p>
                      <h3 class="text-3xl font-bold text-green-600">{{ totalPlatformCut() | currency }}</h3>
                  </div>
                  <div class="bg-white p-6 rounded-xl shadow-sm border">
                      <p class="text-slate-500 text-sm font-medium">Net Teacher Payout</p>
                      <h3 class="text-3xl font-bold text-slate-800">{{ totalNetPayout() | currency }}</h3>
                  </div>
              </div>
              <!-- Teacher Revenue Table -->
              <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div class="overflow-x-auto">
                  <table class="w-full text-left text-sm text-slate-600">
                    <thead class="bg-slate-50 text-slate-700 uppercase text-xs font-bold">
                      <tr>
                        <th class="px-6 py-4">Teacher</th>
                        <th class="px-6 py-4">Gross Revenue</th>
                        <th class="px-6 py-4">Commission Rate</th>
                        <th class="px-6 py-4">Platform Cut</th>
                        <th class="px-6 py-4">Net Earnings</th>
                        <th class="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      @for (stat of teacherRevenueStats(); track stat.teacher.id) {
                        <tr class="hover:bg-slate-50">
                          <td class="px-6 py-4">
                            <div class="flex items-center gap-3">
                              <img [src]="stat.teacher.avatarUrl" class="w-8 h-8 rounded-full"/>
                              <div>
                                <p class="font-bold text-slate-900">{{ stat.teacher.name }}</p>
                                <p class="text-xs text-slate-500">{{ stat.teacher.email }}</p>
                              </div>
                            </div>
                          </td>
                          <td class="px-6 py-4 font-medium">{{ stat.grossRevenue | currency }}</td>
                          <td class="px-6 py-4">
                            <div class="flex items-center gap-2">
                              <input #commissionInput type="number" [value]="stat.teacher.commissionRate * 100" class="w-20 px-2 py-1 rounded-md border border-slate-300 text-center" />
                              <span class="font-bold text-slate-500">%</span>
                            </div>
                          </td>
                          <td class="px-6 py-4 text-orange-600 font-medium">{{ stat.platformCut | currency }}</td>
                          <td class="px-6 py-4 text-green-600 font-bold">{{ stat.netEarnings | currency }}</td>
                          <td class="px-6 py-4 text-right">
                            <button (click)="updateCommission(stat.teacher.id, commissionInput.value)" class="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-md hover:bg-blue-200">Save</button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }

            @case ('pdfs') {
              <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <div>
                    <h3 class="font-bold text-lg text-slate-800">PDF Content Management</h3>
                    <p class="text-sm text-slate-500">Upload and manage study materials</p>
                  </div>
                </div>
                
                <div class="p-6 border-b border-slate-100 bg-slate-50/50">
                   <form [formGroup]="contentForm" (ngSubmit)="uploadContent()" class="space-y-4">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label class="block text-xs font-bold text-slate-600 mb-1 uppercase">Title</label>
                          <input formControlName="title" type="text" class="input-style" placeholder="e.g. Physics Chapter 1">
                        </div>
                        <div>
                           <label class="block text-xs font-bold text-slate-600 mb-1 uppercase">Subject / Topic</label>
                          <input formControlName="subject" type="text" class="input-style" placeholder="e.g. Physics">
                        </div>
                      </div>

                      <div>
                          <label class="block text-xs font-bold text-slate-600 mb-1 uppercase">Description</label>
                          <textarea formControlName="description" class="input-style min-h-[80px]" placeholder="A brief description of the content..."></textarea>
                      </div>
                      
                      <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1 uppercase">PDF Document</label>
                        <input (change)="onFileSelected($event)" type="file" accept="application/pdf" class="file-input-style" required>
                        @if (contentForm.get('fileName')?.value) {
                          <p class="text-xs text-slate-500 mt-2 flex items-center gap-2">
                            <i class="fa-solid fa-file-pdf text-red-500"></i>
                            <span>{{ contentForm.get('fileName')?.value }}</span>
                          </p>
                        }
                      </div>

                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                         <div>
                           <label class="block text-xs font-bold text-slate-600 mb-1 uppercase">Type</label>
                          <select formControlName="type" class="input-style bg-white">
                            <option value="note">Note (PDF)</option>
                            <option value="paper">Question Paper</option>
                            <option value="topic">Important Topic</option>
                          </select>
                        </div>
                        <div class="flex items-center gap-2 pt-5">
                           <input formControlName="isLocked" id="isPremium" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500">
                           <label for="isPremium" class="text-sm font-medium text-slate-700">Make this a Premium document</label>
                        </div>
                      </div>
                      
                      <div>
                        <label class="block text-xs font-bold text-slate-600 mb-1 uppercase">Price (if Premium)</label>
                        <input formControlName="price" type="number" class="input-style" placeholder="e.g. 9.99">
                      </div>
                      
                      <div class="pt-2">
                        <button type="submit" [disabled]="contentForm.invalid" class="w-full md:w-auto bg-blue-600 text-white font-medium py-2.5 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          <i class="fa-solid fa-cloud-arrow-up mr-2"></i> Upload Content
                        </button>
                      </div>
                   </form>
                </div>

                <div class="overflow-x-auto">
                  <table class="w-full text-left text-sm text-slate-600">
                    <thead class="bg-slate-50 text-slate-700 uppercase text-xs font-bold">
                      <tr>
                        <th class="px-6 py-4">Title</th>
                        <th class="px-6 py-4">Status</th>
                        <th class="px-6 py-4">Type</th>
                        <th class="px-6 py-4">Subject</th>
                        <th class="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      @for (item of dataService.content(); track item.id) {
                        <tr class="hover:bg-slate-50 transition-colors">
                          <td class="px-6 py-4 font-medium text-slate-900">
                            {{ item.title }}
                             @if(item.price && item.price > 0) {
                               <span class="ml-2 text-blue-600 text-xs font-bold">{{ item.price | currency }}</span>
                             }
                          </td>
                          <td class="px-6 py-4">
                            @if (item.isLocked) {
                              <span class="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-full border border-amber-200">
                                <i class="fa-solid fa-crown text-amber-500 mr-1"></i> Premium
                              </span>
                            } @else {
                              <span class="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full border border-green-200">
                                Free
                              </span>
                            }
                          </td>
                          <td class="px-6 py-4">
                            <span [class]="getBadgeClass(item.type)">{{ item.type }}</span>
                          </td>
                          <td class="px-6 py-4">{{ item.subject }}</td>
                          <td class="px-6 py-4 text-right">
                            <button (click)="dataService.deleteContent(item.id)" class="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-all">
                              <i class="fa-solid fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }

            @case ('videos') {
               <div class="space-y-8">
                <!-- Live Session Section -->
                <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                  <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                      <h3 class="font-bold text-lg text-slate-800">Live Session Management</h3>
                      <p class="text-sm text-slate-500">Create, manage and monitor live classes.</p>
                    </div>
                  </div>
                  <div class="p-6 border-b border-slate-100 bg-slate-50/50">
                    <form [formGroup]="liveSessionForm" (ngSubmit)="uploadLiveSession()" class="space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input formControlName="title" type="text" placeholder="Live Session Title" class="input-style">
                          <input formControlName="instructor" type="text" placeholder="Instructor Name" class="input-style">
                        </div>
                        <textarea formControlName="description" placeholder="Session Description..." class="w-full input-style min-h-[80px]"></textarea>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <input formControlName="topic" type="text" placeholder="Topic (e.g. Physics)" class="input-style">
                          <input formControlName="thumbnailUrl" type="text" placeholder="Thumbnail URL" class="input-style">
                          <input formControlName="videoUrl" type="text" placeholder="Live Stream URL" class="input-style">
                        </div>
                         <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input formControlName="pdfUrl" type="text" placeholder="PDF Link (Optional)" class="input-style">
                          <input formControlName="scheduledTime" type="datetime-local" class="input-style">
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                           <input formControlName="durationMinutes" type="number" placeholder="Duration (minutes)" class="input-style">
                           <input formControlName="price" type="number" placeholder="Price (0 for free)" class="input-style">
                        </div>

                        <div class="pt-2">
                           <button type="submit" [disabled]="liveSessionForm.invalid" class="w-full md:w-auto bg-red-600 text-white font-medium py-2.5 px-6 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50">
                            <i class="fa-solid fa-tower-broadcast mr-2"></i> Schedule Live Session
                          </button>
                        </div>
                    </form>
                  </div>
                   <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm text-slate-600">
                      <thead class="bg-slate-50 text-slate-700 uppercase text-xs font-bold">
                        <tr>
                          <th class="px-6 py-4">Title / Instructor</th>
                          <th class="px-6 py-4">Status</th>
                          <th class="px-6 py-4">Scheduled Time</th>
                          <th class="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-100">
                        @for (session of dataService.liveSessions(); track session.id) {
                          <tr class="hover:bg-slate-50 transition-colors">
                            <td class="px-6 py-4">
                               <p class="font-medium text-slate-900">{{ session.title }}</p>
                               <p class="text-xs text-slate-500">{{ session.instructor }}</p>
                            </td>
                            <td class="px-6 py-4">
                               <span [class]="getLiveStatusClass(session.status)">{{ session.status }}</span>
                            </td>
                            <td class="px-6 py-4">{{ session.scheduledTime | date:'short' }}</td>
                            <td class="px-6 py-4 text-right">
                              <button (click)="dataService.deleteLiveSession(session.id)" class="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-all">
                                <i class="fa-solid fa-trash"></i>
                              </button>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Video Upload Section -->
                <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                   <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                     <div>
                       <h3 class="font-bold text-lg text-slate-800">Video Lecture Management</h3>
                       <p class="text-sm text-slate-500">Upload recorded video lectures for students.</p>
                     </div>
                   </div>
                   <div class="p-6 border-b border-slate-100 bg-slate-50/50">
                     <form [formGroup]="videoUploadForm" (ngSubmit)="uploadVideo()" class="space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input formControlName="title" type="text" placeholder="Video Title (e.g., 5R Class...)" class="input-style">
                          <input formControlName="instructor" type="text" placeholder="Instructor Name" class="input-style">
                        </div>
                        <input formControlName="topic" type="text" placeholder="Topic (e.g. Physics)" class="input-style">
                        <textarea formControlName="description" placeholder="Video Description..." class="w-full input-style min-h-[80px]"></textarea>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                             <label class="block text-xs font-bold text-slate-600 mb-1 uppercase">Thumbnail Image</label>
                             <input (change)="onVideoThumbnailSelected($event)" type="file" accept="image/*" class="file-input-style" required>
                           </div>
                           <div>
                             <label class="block text-xs font-bold text-slate-600 mb-1 uppercase">Video File</label>
                             <input (change)="onVideoFileSelected($event)" type="file" accept="video/*" class="file-input-style" required>
                           </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input formControlName="externalLink" type="text" placeholder="External Link (e.g. https://...)" class="input-style">
                          <input formControlName="linkText" type="text" placeholder="Link Button Text (e.g. Download PDF)" class="input-style">
                        </div>
                         <div>
                          <label class="block text-xs font-bold text-slate-600 mb-1 uppercase">Price (0 for free)</label>
                          <input formControlName="price" type="number" class="input-style" placeholder="e.g. 19.99">
                        </div>
                        <div class="pt-2">
                          <button type="submit" [disabled]="videoUploadForm.invalid" class="w-full md:w-auto bg-purple-600 text-white font-medium py-2.5 px-6 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            <i class="fa-solid fa-clapperboard mr-2"></i> Upload Video Lecture
                          </button>
                        </div>
                     </form>
                   </div>
                   <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm text-slate-600">
                      <thead class="bg-slate-50 text-slate-700 uppercase text-xs font-bold">
                        <tr>
                          <th class="px-6 py-4">Video Title</th>
                          <th class="px-6 py-4">Topic</th>
                          <th class="px-6 py-4">Price</th>
                          <th class="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-100">
                        @for (video of dataService.videoLectures(); track video.id) {
                          <tr class="hover:bg-slate-50 transition-colors">
                            <td class="px-6 py-4 font-medium text-slate-900">{{ video.title }}</td>
                            <td class="px-6 py-4">{{ video.topic }}</td>
                            <td class="px-6 py-4 font-bold text-blue-600">{{ (video.price || 0) > 0 ? (video.price | currency) : 'Free' }}</td>
                            <td class="px-6 py-4 text-right">
                              <button (click)="dataService.deleteVideoLecture(video.id)" class="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-all">
                                <i class="fa-solid fa-trash"></i>
                              </button>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            }

            @case ('queries') {
              <div class="max-w-4xl mx-auto space-y-6">
                @for (query of dataService.queries(); track query.id) {
                  <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                    <div class="flex justify-between items-start mb-4">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                          {{ query.studentName.charAt(0) }}
                        </div>
                        <div>
                          <h4 class="font-bold text-slate-800">{{ query.studentName }}</h4>
                          <p class="text-xs text-slate-500">{{ query.timestamp | date:'medium' }}</p>
                        </div>
                      </div>
                      @if (query.answer) {
                        <span class="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">Replied</span>
                      } @else {
                        <span class="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full">Pending</span>
                      }
                    </div>

                    <div class="bg-slate-50 p-4 rounded-lg mb-4 text-slate-700 italic border-l-4 border-slate-300">
                      "{{ query.question }}"
                    </div>

                    @if (query.answer) {
                      <div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <p class="text-xs font-bold text-blue-800 mb-1">ADMIN REPLY:</p>
                        <p class="text-slate-700 text-sm">{{ query.answer }}</p>
                      </div>
                    } @else {
                      <div class="space-y-3">
                        <textarea #replyInput class="w-full p-3 rounded-lg border border-slate-300 focus:border-blue-500 outline-none text-sm min-h-[80px]" placeholder="Type your reply here..."></textarea>
                        <div class="flex gap-2">
                           <button (click)="dataService.answerQuery(query.id, replyInput.value)" class="bg-slate-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors">
                            Send Reply
                          </button>
                          <button (click)="generateAiReply(query.question, replyInput)" [disabled]="isGenerating()" class="bg-purple-100 text-purple-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-2">
                            @if (isGenerating()) {
                              <i class="fa-solid fa-spinner fa-spin"></i>
                            } @else {
                              <i class="fa-solid fa-wand-magic-sparkles"></i>
                            }
                            AI Suggestion
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }

            @case ('logs') {
              <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <div>
                    <h3 class="font-bold text-lg text-slate-800">System Activity Logs</h3>
                    <p class="text-sm text-slate-500">Track user sign-ins and sign-outs</p>
                  </div>
                  <button class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                     <i class="fa-solid fa-download mr-1"></i> Export CSV
                  </button>
                </div>
                
                <div class="overflow-x-auto">
                   <table class="w-full text-left text-sm text-slate-600">
                     <thead class="bg-slate-50 text-slate-700 uppercase text-xs font-bold">
                       <tr>
                         <th class="px-6 py-4">User</th>
                         <th class="px-6 py-4">Action</th>
                         <th class="px-6 py-4">Timestamp</th>
                         <th class="px-6 py-4">IP Address</th>
                       </tr>
                     </thead>
                     <tbody class="divide-y divide-slate-100">
                       @for (log of dataService.activityLogs(); track log.id) {
                         <tr class="hover:bg-slate-50 transition-colors">
                           <td class="px-6 py-4 font-medium text-slate-900">{{ log.userEmail }}</td>
                           <td class="px-6 py-4">
                             <span [class]="getActionClass(log.action)" class="px-2 py-1 rounded-full text-xs font-bold">
                               {{ log.action }}
                             </span>
                           </td>
                           <td class="px-6 py-4">{{ log.timestamp | date:'medium' }}</td>
                           <td class="px-6 py-4 font-mono text-xs">{{ log.ip }}</td>
                         </tr>
                       }
                     </tbody>
                   </table>
                </div>
              </div>
            }

            @case ('users') {
              <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <div>
                    <h3 class="font-bold text-lg text-slate-800">Registered Students</h3>
                    <p class="text-sm text-slate-500">Manage student profiles, plans, and status.</p>
                  </div>
                  <div class="flex gap-2">
                     <button class="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50">
                       <i class="fa-solid fa-filter mr-1"></i> Filter
                     </button>
                     <button class="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-800">
                       <i class="fa-solid fa-plus mr-1"></i> Add User
                     </button>
                  </div>
                </div>
                
                <div class="overflow-x-auto">
                   <table class="w-full text-left text-sm text-slate-600">
                     <thead class="bg-slate-50 text-slate-700 uppercase text-xs font-bold">
                       <tr>
                         <th class="px-6 py-4">Name / Email</th>
                         <th class="px-6 py-4">Country</th>
                         <th class="px-6 py-4">Status</th>
                         <th class="px-6 py-4">Last Login</th>
                       </tr>
                     </thead>
                     <tbody class="divide-y divide-slate-100">
                       @for (student of dataService.students(); track student.id) {
                         <tr class="hover:bg-slate-50 transition-colors">
                           <td class="px-6 py-4">
                             <div class="flex items-center gap-3">
                               <div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                 {{ student.name.charAt(0) }}
                               </div>
                               <div>
                                 <div class="font-bold text-slate-900">{{ student.name }}</div>
                                 <div class="text-xs text-slate-400">{{ student.email }}</div>
                               </div>
                             </div>
                           </td>
                           <td class="px-6 py-4">{{ student.country }}</td>
                           <td class="px-6 py-4">
                             <span [class]="student.status === 'Active' ? 'text-green-600 bg-green-50 border-green-100' : 'text-slate-400 bg-slate-50 border-slate-100'" class="px-2 py-1 rounded text-xs font-bold border">
                               {{ student.status }}
                             </span>
                           </td>
                           <td class="px-6 py-4 text-xs">{{ student.lastLogin }}</td>
                         </tr>
                       }
                     </tbody>
                   </table>
                </div>
              </div>
            }
          }
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.2s ease-out; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .input-style { @apply w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all; }
    .file-input-style { @apply w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer; }
  `]
})
export class AdminDashboardComponent {
  authService = inject(AuthService);
  dataService = inject(DataService);
  geminiService = inject(GeminiService);
  private fb: FormBuilder = inject(FormBuilder);
  
  chartContainer = viewChild<ElementRef>('chartContainer');

  activeTab = signal<'dashboard' | 'pdfs' | 'videos' | 'queries' | 'users' | 'logs' | 'revenue'>('dashboard');
  isSidebarOpen = signal(false);
  isGenerating = signal(false);

  contentForm: FormGroup;
  videoUploadForm: FormGroup;
  liveSessionForm: FormGroup;

  // Dashboard Stats
  totalVideos = computed(() => this.dataService.videoLectures().length);
  liveSessionsCount = computed(() => this.dataService.liveSessions().filter(s => s.status === 'live').length);
  activeTeachersCount = computed(() => {
    const liveInstructors = this.dataService.liveSessions()
      .filter(s => s.status === 'live')
      .map(s => s.instructor);
    return new Set(liveInstructors).size;
  });
  totalPDFs = computed(() => this.dataService.content().length);
  totalStudents = computed(() => this.dataService.students().length);
  pendingQueriesCount = computed(() => this.dataService.queries().filter(q => !q.answer).length);
  
  revenueChange = computed(() => {
    const earnings = this.dataService.analytics().monthlyEarnings;
    if (earnings.length < 2) return 0;
    const lastMonth = earnings[earnings.length - 1];
    const prevMonth = earnings[earnings.length - 2];
    if (prevMonth === 0) return lastMonth > 0 ? 100 : 0;
    return ((lastMonth - prevMonth) / prevMonth) * 100;
  });
  isRevenueIncreasing = computed(() => this.revenueChange() >= 0);

  // Teacher Revenue Stats
  teacherRevenueStats = computed<TeacherRevenueStat[]>(() => {
    return this.dataService.teachers().map(teacher => {
      const netEarnings = teacher.analytics.totalEarnings;
      const commissionRate = teacher.commissionRate;

      // Prevent division by zero if commission is 100%
      const grossRevenue = (commissionRate < 1) ? netEarnings / (1 - commissionRate) : netEarnings;
      const platformCut = grossRevenue - netEarnings;

      return {
        teacher,
        netEarnings,
        grossRevenue,
        platformCut,
      };
    });
  });
  
  totalGrossRevenue = computed(() => this.teacherRevenueStats().reduce((acc, stat) => acc + stat.grossRevenue, 0));
  totalPlatformCut = computed(() => this.teacherRevenueStats().reduce((acc, stat) => acc + stat.platformCut, 0));
  totalNetPayout = computed(() => this.teacherRevenueStats().reduce((acc, stat) => acc + stat.netEarnings, 0));


  constructor() {
    this.contentForm = this.fb.group({
      title: ['', Validators.required],
      subject: ['', Validators.required],
      description: ['', Validators.required],
      type: ['note', Validators.required],
      isLocked: [false],
      fileName: ['', Validators.required],
      fileUrl: ['', Validators.required],
      price: [{ value: 0, disabled: true }, [Validators.min(0)]],
    });

    this.videoUploadForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      instructor: ['Admin', Validators.required],
      topic: ['', Validators.required],
      thumbnailUrl: ['', Validators.required],
      videoUrl: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      externalLink: [''],
      linkText: ['']
    });

    this.liveSessionForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      topic: ['', Validators.required],
      instructor: ['', Validators.required],
      thumbnailUrl: ['https://picsum.photos/seed/live/400/225', Validators.required],
      videoUrl: ['#', Validators.required],
      pdfUrl: [''],
      scheduledTime: ['', Validators.required],
      durationMinutes: [60, [Validators.required, Validators.min(1)]],
      price: [0, Validators.min(0)]
    });

    effect(() => {
      const isLocked = this.contentForm.get('isLocked')?.value;
      const priceControl = this.contentForm.get('price');
      if (isLocked) {
        priceControl?.enable();
      } else {
        priceControl?.disable();
        priceControl?.setValue(0);
      }
    });

    effect(() => {
      const chartEl = this.chartContainer();
      if (this.activeTab() === 'dashboard' && chartEl) {
        this.renderChart(chartEl.nativeElement);
      }
    });
  }
  
  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  setActive(tab: 'dashboard' | 'pdfs' | 'videos' | 'queries' | 'users' | 'logs' | 'revenue') {
    this.activeTab.set(tab);
    this.isSidebarOpen.set(false);
  }

  getNavClass(tab: string) {
    return this.activeTab() === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 hover:text-white';
  }

  updateCommission(teacherId: string, newRatePercent: string) {
    const rate = parseFloat(newRatePercent);
    if (!isNaN(rate) && rate >= 0 && rate <= 100) {
      this.dataService.updateTeacherCommission(teacherId, rate / 100);
    } else {
      alert('Please enter a valid percentage between 0 and 100.');
    }
  }

  renderChart(el: HTMLElement) {
    if (!el) return;
    d3.select(el).select('svg').remove();

    const data = this.dataService.analytics().monthlyEarnings;
    const width = el.clientWidth;
    const height = el.clientHeight;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    const svg = d3.select(el)
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${width} ${height}`);

    const x = d3.scaleBand()
      .domain(data.map((_, i) => `Month ${i + 1}`))
      .range([margin.left, width - margin.right])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data) || 8000])
      .range([height - margin.bottom, margin.top]);

    svg.append("g")
      .attr("fill", "#3b82f6")
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", (_, i) => x(`Month ${i + 1}`)!)
      .attr("y", d => y(d))
      .attr("height", d => y(0) - y(d))
      .attr("width", x.bandwidth())
      .attr("rx", 4);

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickSize(0).tickPadding(10))
      .select(".domain").remove();
      
    svg.selectAll(".label")
        .data(data)
        .enter()
        .append("text")
        .attr("x", (_, i) => x(`Month ${i + 1}`)! + x.bandwidth() / 2)
        .attr("y", d => y(d) - 5)
        .attr("text-anchor", "middle")
        .attr("class", "text-xs fill-slate-500")
        .text(d => `$${d}`);
  }

  getBadgeClass(type: string) {
    switch (type) {
      case 'note': return 'bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold uppercase';
      case 'paper': return 'bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold uppercase';
      case 'topic': return 'bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold uppercase';
      default: return 'bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold uppercase';
    }
  }

  getActionClass(action: string) {
      switch(action) {
          case 'Sign In': return 'bg-green-100 text-green-700 border border-green-200';
          case 'Sign Out': return 'bg-slate-200 text-slate-700 border border-slate-300';
          case 'Purchase': return 'bg-amber-100 text-amber-700 border border-amber-200';
          case 'Upload': return 'bg-blue-100 text-blue-700 border border-blue-200';
          default: return 'bg-gray-100 text-gray-600';
      }
  }

   getLiveStatusClass(status: 'upcoming' | 'live' | 'ended') {
    switch(status) {
      case 'live': return 'bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold uppercase';
      case 'upcoming': return 'bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold uppercase';
      case 'ended': return 'bg-slate-200 text-slate-700 px-2 py-1 rounded-full text-xs font-bold uppercase';
    }
  }

  getStatusClass(status: string) {
      switch(status) {
          case 'Success': return 'bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold';
          case 'Failed': return 'bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold';
          case 'Pending': return 'bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-bold';
          default: return 'bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-bold';
      }
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.contentForm.patchValue({
          fileName: file.name,
          fileUrl: e.target.result,
        });
      };
      reader.readAsDataURL(file);
    } else {
      this.contentForm.patchValue({
        fileName: '',
        fileUrl: '',
      });
    }
  }

  uploadContent() {
    if (this.contentForm.valid) {
      const val = this.contentForm.getRawValue();

      const newContent: ContentItem = {
        id: Math.random().toString(36).substr(2, 9),
        title: val.title!,
        subject: val.subject!,
        type: val.type as 'note' | 'paper' | 'topic',
        isLocked: !!val.isLocked,
        price: val.isLocked ? val.price || 0 : 0,
        date: new Date().toISOString().split('T')[0],
        description: val.description!,
        fileName: val.fileName!,
        fileUrl: val.fileUrl!,
        instructor: 'Admin',
        teacherId: 'admin'
      };
      
      this.dataService.addContent(newContent);
      this.contentForm.reset({ type: 'note', isLocked: false, price: 0 });
    }
  }

  onVideoFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.videoUploadForm.patchValue({ videoUrl: URL.createObjectURL(file) });
    }
  }

  onVideoThumbnailSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.videoUploadForm.patchValue({ thumbnailUrl: URL.createObjectURL(file) });
    }
  }

  uploadVideo() {
    if (this.videoUploadForm.valid) {
        const val = this.videoUploadForm.value;
        const newVideo: VideoLecture = {
            id: `vid-${Date.now()}`,
            title: val.title,
            description: val.description,
            topic: val.topic,
            instructor: val.instructor,
            city: 'Online',
            duration: 'N/A', // Duration could be read from video metadata if needed
            isPremium: val.price > 0,
            thumbnailUrl: val.thumbnailUrl,
            videoUrl: val.videoUrl,
            price: val.price,
            externalLink: val.externalLink,
            linkText: val.linkText
        };
        this.dataService.addVideoLecture(newVideo);
        this.videoUploadForm.reset({ instructor: 'Admin', price: 0 });
    }
  }

  uploadLiveSession() {
    if (this.liveSessionForm.valid) {
      const val = this.liveSessionForm.value;
      const newSession: LiveSession = {
        id: `ls-${Date.now()}`,
        status: 'upcoming',
        isArchived: false,
        ...val
      };
      this.dataService.addLiveSession(newSession);
      this.liveSessionForm.reset({
        thumbnailUrl: 'https://picsum.photos/seed/live/400/225',
        videoUrl: '#',
        durationMinutes: 60,
        price: 0
      });
    }
  }

  async generateAiReply(question: string, textarea: HTMLTextAreaElement) {
    this.isGenerating.set(true);
    const reply = await this.geminiService.draftReply(question);
    textarea.value = reply;
    this.isGenerating.set(false);
  }
}