import { Component, inject, computed, signal, effect } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { DataService, LiveSession, ContentItem, VideoLecture } from '../services/data.service';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GeminiService } from '../services/gemini.service';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyPipe],
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
             <i class="fa-solid fa-chalkboard-user text-teal-500 text-xl"></i>
             <div>
               <h2 class="text-xl font-bold text-white tracking-tight leading-none">ExamEdge</h2>
               <span class="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Teacher Panel</span>
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
          
          <button (click)="setActive('content')" 
                  [class]="getNavClass('content')"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200">
            <i class="fa-solid fa-book-open-reader w-5 text-center"></i> My Content
          </button>

          <button (click)="setActive('live')" 
                  [class]="getNavClass('live')"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200">
            <i class="fa-solid fa-tower-broadcast w-5 text-center"></i> My Live Sessions
          </button>
          
          <button (click)="setActive('queries')" 
                  [class]="getNavClass('queries')"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200">
            <i class="fa-solid fa-comments w-5 text-center"></i> 
            Student Queries
            @if (pendingQueriesCount() > 0) {
              <span class="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{{ pendingQueriesCount() }}</span>
            }
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
            <h1 class="text-xl font-bold text-slate-800 capitalize">{{ activeTab() === 'content' ? 'My Content' : (activeTab() === 'live' ? 'My Live Sessions' : activeTab()) }}</h1>
          </div>
          <div class="flex items-center gap-4">
             <div class="hidden md:flex items-center gap-2 text-sm text-slate-600">
                Welcome back, <span class="font-bold">{{ teacherProfile()?.name }}</span>!
             </div>
             <img [src]="teacherProfile()?.avatarUrl" class="w-8 h-8 rounded-full border-2 border-slate-200">
          </div>
        </header>

        <div class="p-4 md:p-8">
          @switch (activeTab()) {
            @case ('dashboard') {
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <!-- Total Earnings Card -->
                <div class="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border flex flex-col">
                  <p class="text-slate-500 text-sm font-medium">Total Earnings</p>
                  <h3 class="text-3xl font-bold text-slate-800 mt-2">{{ teacherProfile()?.analytics.totalEarnings | currency }}</h3>
                  <p class="text-xs text-slate-400 mt-1">All-time net revenue</p>
                </div>
                
                <!-- Pending Queries Card -->
                <div class="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border">
                  <p class="text-slate-500 text-sm font-medium">Pending Queries</p>
                  <h3 class="text-3xl font-bold text-slate-800 mt-2">{{ pendingQueriesCount() }}</h3>
                  <p class="text-xs text-slate-400 mt-1">Awaiting your answers</p>
                </div>
                
                <!-- Content Stats Card -->
                <div class="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border">
                  <p class="text-slate-500 text-sm font-medium">My Content Stats</p>
                  <div class="flex justify-around items-end mt-3 text-center">
                      <div>
                        <h3 class="text-3xl font-bold text-slate-800">{{ myPdfsCount() }}</h3>
                        <p class="text-xs font-bold text-slate-400 uppercase">PDFs</p>
                      </div>
                       <div>
                        <h3 class="text-3xl font-bold text-slate-800">{{ myVideosCount() }}</h3>
                        <p class="text-xs font-bold text-slate-400 uppercase">Videos</p>
                      </div>
                       <div>
                        <h3 class="text-3xl font-bold text-slate-800">{{ myLiveSessionsCount() }}</h3>
                        <p class="text-xs font-bold text-slate-400 uppercase">Sessions</p>
                      </div>
                  </div>
                </div>
                
                <!-- PDF Revenue -->
                <div class="bg-blue-50 border-blue-200 p-6 rounded-xl shadow-sm border">
                  <p class="text-sm font-bold text-blue-800">PDF Revenue</p>
                  <h3 class="text-2xl font-bold text-blue-900 mt-2">{{ teacherProfile()?.analytics.pdfEarnings | currency }}</h3>
                </div>

                <!-- Video Revenue -->
                <div class="bg-purple-50 border-purple-200 p-6 rounded-xl shadow-sm border">
                  <p class="text-sm font-bold text-purple-800">Video Revenue</p>
                  <h3 class="text-2xl font-bold text-purple-900 mt-2">{{ teacherProfile()?.analytics.videoEarnings | currency }}</h3>
                </div>

                <!-- Live Session Revenue -->
                <div class="bg-red-50 border-red-200 p-6 rounded-xl shadow-sm border">
                  <p class="text-sm font-bold text-red-800">Live Session Revenue</p>
                  <h3 class="text-2xl font-bold text-red-900 mt-2">{{ teacherProfile()?.analytics.liveSessionEarnings | currency }}</h3>
                </div>
              </div>
            }
            @case ('content') {
              <div class="space-y-8">
                <!-- My PDFs & Notes Management -->
                <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                  <div class="p-6 border-b border-slate-100">
                    <h3 class="font-bold text-lg text-slate-800">My PDFs & Notes</h3>
                    <p class="text-sm text-slate-500">Upload and manage your written study materials.</p>
                  </div>
                  <div class="p-6 bg-slate-50/50 border-b border-slate-100">
                    <form [formGroup]="pdfUploadForm" (ngSubmit)="uploadPdf()" class="space-y-4">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input formControlName="title" type="text" placeholder="PDF Title" class="input-style">
                          <input formControlName="subject" type="text" placeholder="Subject / Topic" class="input-style">
                      </div>
                      <textarea formControlName="description" class="input-style min-h-[80px]" placeholder="A brief description of the content..."></textarea>
                      <input (change)="onPdfFileSelected($event)" type="file" accept="application/pdf" class="file-input-style" required>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <div class="flex items-center gap-2">
                           <input formControlName="isLocked" id="isPremiumPdf" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500">
                           <label for="isPremiumPdf" class="text-sm font-medium text-slate-700">Premium Content</label>
                        </div>
                        <input formControlName="price" type="number" class="input-style" placeholder="Price (if Premium)">
                      </div>
                      <button type="submit" [disabled]="pdfUploadForm.invalid" class="bg-teal-600 text-white font-medium py-2 px-5 rounded-lg hover:bg-teal-700 disabled:opacity-50">Upload PDF</button>
                    </form>
                  </div>
                  <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm text-slate-600">
                      <thead class="bg-slate-50 text-slate-700 uppercase text-xs font-bold">
                        <tr>
                          <th class="px-6 py-4">Title</th>
                          <th class="px-6 py-4">Price</th>
                          <th class="px-6 py-4">Subject</th>
                          <th class="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-100">
                        @for (item of myPdfs(); track item.id) {
                          <tr class="hover:bg-slate-50 align-middle">
                            @if (editingPdfId() === item.id) {
                              <td class="px-6 py-4"><input #titleInput [value]="item.title" class="input-style !py-1"></td>
                              <td class="px-6 py-4"><input #priceInput type="number" [value]="item.price" class="input-style !py-1 w-24"></td>
                              <td class="px-6 py-4"><input #subjectInput [value]="item.subject" class="input-style !py-1"></td>
                              <td class="px-6 py-4 text-right">
                                <button (click)="savePdf(item, titleInput.value, priceInput.value, subjectInput.value)" class="text-green-600 hover:text-green-800 p-2 rounded-full hover:bg-green-50"><i class="fa-solid fa-check"></i></button>
                                <button (click)="editingPdfId.set(null)" class="text-slate-500 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100"><i class="fa-solid fa-xmark"></i></button>
                              </td>
                            } @else {
                              <td class="px-6 py-4 font-bold text-slate-800">{{ item.title }}</td>
                              <td class="px-6 py-4">{{ item.price || 0 | currency}}</td>
                              <td class="px-6 py-4">{{ item.subject }}</td>
                              <td class="px-6 py-4 text-right">
                                <button (click)="editingPdfId.set(item.id)" class="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50"><i class="fa-solid fa-pen"></i></button>
                                <button (click)="dataService.deleteContent(item.id)" class="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50"><i class="fa-solid fa-trash"></i></button>
                              </td>
                            }
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- My Video Lectures Management -->
                <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                   <div class="p-6 border-b border-slate-100">
                    <h3 class="font-bold text-lg text-slate-800">My Video Lectures</h3>
                    <p class="text-sm text-slate-500">Upload and manage your recorded video lectures.</p>
                  </div>
                  <div class="p-6 bg-slate-50/50 border-b border-slate-100">
                     <form [formGroup]="videoUploadForm" (ngSubmit)="uploadVideo()" class="space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input formControlName="title" type="text" placeholder="Video Title" class="input-style">
                          <input formControlName="topic" type="text" placeholder="Topic" class="input-style">
                        </div>
                        <textarea formControlName="description" placeholder="Video Description..." class="w-full input-style min-h-[80px]"></textarea>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <input (change)="onVideoThumbnailSelected($event)" type="file" accept="image/*" class="file-input-style" required>
                           <input (change)="onVideoFileSelected($event)" type="file" accept="video/*" class="file-input-style" required>
                        </div>
                         <input formControlName="price" type="number" class="input-style" placeholder="Price (0 for free)">
                        <button type="submit" [disabled]="videoUploadForm.invalid" class="bg-teal-600 text-white font-medium py-2 px-5 rounded-lg hover:bg-teal-700 disabled:opacity-50">Upload Video</button>
                     </form>
                  </div>
                  <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm text-slate-600">
                      <thead class="bg-slate-50 text-slate-700 uppercase text-xs font-bold">
                        <tr>
                          <th class="px-6 py-4">Title</th>
                          <th class="px-6 py-4">Price</th>
                          <th class="px-6 py-4">Topic</th>
                          <th class="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-100">
                        @for (video of myVideos(); track video.id) {
                           <tr class="hover:bg-slate-50 align-middle">
                            @if (editingVideoId() === video.id) {
                              <td class="px-6 py-4"><input #vidTitleInput [value]="video.title" class="input-style !py-1"></td>
                              <td class="px-6 py-4"><input #vidPriceInput type="number" [value]="video.price" class="input-style !py-1 w-24"></td>
                              <td class="px-6 py-4"><input #vidTopicInput [value]="video.topic" class="input-style !py-1"></td>
                              <td class="px-6 py-4 text-right">
                                <button (click)="saveVideo(video, vidTitleInput.value, vidPriceInput.value, vidTopicInput.value)" class="text-green-600 hover:text-green-800 p-2 rounded-full hover:bg-green-50"><i class="fa-solid fa-check"></i></button>
                                <button (click)="editingVideoId.set(null)" class="text-slate-500 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100"><i class="fa-solid fa-xmark"></i></button>
                              </td>
                            } @else {
                              <td class="px-6 py-4 font-bold text-slate-800">{{ video.title }}</td>
                              <td class="px-6 py-4">{{ video.price || 0 | currency}}</td>
                              <td class="px-6 py-4">{{ video.topic }}</td>
                              <td class="px-6 py-4 text-right">
                                <button (click)="editingVideoId.set(video.id)" class="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50"><i class="fa-solid fa-pen"></i></button>
                                <button (click)="dataService.deleteVideoLecture(video.id)" class="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50"><i class="fa-solid fa-trash"></i></button>
                              </td>
                            }
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            }
            @case ('live') {
              <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <div>
                    <h3 class="font-bold text-lg text-slate-800">My Live Session Management</h3>
                    <p class="text-sm text-slate-500">Schedule and manage your live classes.</p>
                  </div>
                </div>
                <div class="p-6 border-b border-slate-100 bg-slate-50/50">
                  <form [formGroup]="liveSessionForm" (ngSubmit)="scheduleLiveSession()" class="space-y-4">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input formControlName="title" type="text" placeholder="Live Session Title" class="input-style">
                        <input formControlName="topic" type="text" placeholder="Topic (e.g. Physics)" class="input-style">
                      </div>
                      <textarea formControlName="description" placeholder="Session Description..." class="w-full input-style min-h-[80px]"></textarea>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input formControlName="scheduledTime" type="datetime-local" class="input-style">
                        <input formControlName="durationMinutes" type="number" placeholder="Duration (minutes)" class="input-style">
                      </div>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <input formControlName="price" type="number" placeholder="Price (0 for free)" class="input-style">
                         <input formControlName="pdfUrl" type="text" placeholder="Associated PDF Link (Optional)" class="input-style">
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
                        <th class="px-6 py-4">Title</th>
                        <th class="px-6 py-4">Status</th>
                        <th class="px-6 py-4">Scheduled Time</th>
                        <th class="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      @for (session of myLiveSessions(); track session.id) {
                        <tr class="hover:bg-slate-50 transition-colors">
                          <td class="px-6 py-4 font-medium text-slate-900">{{ session.title }}</td>
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
                      } @empty {
                         <tr><td colspan="4" class="text-center p-8 text-slate-500">You have not scheduled any live sessions.</td></tr>
                      }
                    </tbody>
                  </table>
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
                      <div class="bg-teal-50 p-4 rounded-lg border border-teal-100">
                        <p class="text-xs font-bold text-teal-800 mb-1">YOUR REPLY:</p>
                        <p class="text-slate-700 text-sm">{{ query.answer }}</p>
                      </div>
                    } @else {
                      <div class="space-y-3">
                        <textarea #replyInput class="w-full p-3 rounded-lg border border-slate-300 focus:border-teal-500 outline-none text-sm min-h-[80px]" placeholder="Type your reply here..."></textarea>
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
          }
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.2s ease-out; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .input-style { @apply w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all; }
    .file-input-style { @apply w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer; }
  `]
})
export class TeacherDashboardComponent {
  authService = inject(AuthService);
  dataService = inject(DataService);
  geminiService = inject(GeminiService);
  private fb = inject(FormBuilder);
  
  activeTab = signal<'dashboard' | 'content' | 'live' | 'queries'>('dashboard');
  isSidebarOpen = signal(false);
  isGenerating = signal(false);
  editingPdfId = signal<string | null>(null);
  editingVideoId = signal<string | null>(null);

  liveSessionForm: FormGroup;
  pdfUploadForm: FormGroup;
  videoUploadForm: FormGroup;

  teacherProfile = computed(() => 
    this.dataService.teachers().find(t => t.id === this.authService.currentUser()?.id)
  );

  myPdfs = computed(() => {
    const profile = this.teacherProfile();
    if (!profile) return [];
    return this.dataService.content().filter(c => c.teacherId === profile.id);
  });
  myPdfsCount = computed(() => this.myPdfs().length);

  myVideos = computed(() => {
    const profile = this.teacherProfile();
    if (!profile) return [];
    return this.dataService.videoLectures().filter(v => v.instructor === profile.name);
  });
  
  myVideosCount = computed(() => this.myVideos().length);
  
  myLiveSessions = computed(() =>
    this.dataService.liveSessions().filter(s => s.instructor === this.teacherProfile()?.name)
  );

  myLiveSessionsCount = computed(() => this.myLiveSessions().length);

  pendingQueriesCount = computed(() => this.dataService.queries().filter(q => !q.answer).length);

  constructor() {
    const teacherName = this.authService.currentUser()?.name || '';
    
    this.liveSessionForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      topic: ['', Validators.required],
      instructor: [teacherName, Validators.required],
      thumbnailUrl: ['https://picsum.photos/seed/liveclass/400/225', Validators.required],
      videoUrl: ['#', Validators.required],
      pdfUrl: [''],
      scheduledTime: ['', Validators.required],
      durationMinutes: [60, [Validators.required, Validators.min(1)]],
      price: [0, Validators.min(0)]
    });

    this.pdfUploadForm = this.fb.group({
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
      topic: ['', Validators.required],
      thumbnailUrl: ['', Validators.required],
      videoUrl: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
    });

     effect(() => {
      const isLocked = this.pdfUploadForm.get('isLocked')?.value;
      const priceControl = this.pdfUploadForm.get('price');
      if (isLocked) {
        priceControl?.enable();
      } else {
        priceControl?.disable();
        priceControl?.setValue(0);
      }
    });
  }
  
  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  setActive(tab: 'dashboard' | 'content' | 'live' | 'queries') {
    this.activeTab.set(tab);
    this.isSidebarOpen.set(false);
  }

  getNavClass(tab: 'dashboard' | 'content' | 'live' | 'queries') {
    return this.activeTab() === tab ? 'bg-teal-600 text-white shadow-lg' : 'hover:bg-slate-800 hover:text-white';
  }

  getLiveStatusClass(status: 'upcoming' | 'live' | 'ended') {
    switch(status) {
      case 'live': return 'bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold uppercase';
      case 'upcoming': return 'bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold uppercase';
      case 'ended': return 'bg-slate-200 text-slate-700 px-2 py-1 rounded-full text-xs font-bold uppercase';
    }
  }

  scheduleLiveSession() {
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
        instructor: this.authService.currentUser()?.name || '',
        thumbnailUrl: 'https://picsum.photos/seed/liveclass/400/225',
        videoUrl: '#',
        durationMinutes: 60,
        price: 0
      });
    }
  }
  
  onPdfFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.pdfUploadForm.patchValue({
          fileName: file.name,
          fileUrl: e.target.result,
        });
      };
      reader.readAsDataURL(file);
    }
  }

  uploadPdf() {
    if (this.pdfUploadForm.valid && this.teacherProfile()) {
      const val = this.pdfUploadForm.getRawValue();
      const newContent: ContentItem = {
        id: `pdf-${Date.now()}`,
        title: val.title,
        subject: val.subject,
        description: val.description,
        type: 'note',
        isLocked: val.isLocked,
        price: val.isLocked ? val.price : 0,
        date: new Date().toISOString().split('T')[0],
        fileName: val.fileName,
        fileUrl: val.fileUrl,
        instructor: this.teacherProfile()!.name,
        teacherId: this.teacherProfile()!.id,
      };
      this.dataService.addContent(newContent);
      this.pdfUploadForm.reset({ type: 'note', isLocked: false, price: 0 });
    }
  }

  savePdf(originalItem: ContentItem, title: string, priceStr: string, subject: string) {
    const price = parseFloat(priceStr) || 0;
    const updatedItem: ContentItem = {
      ...originalItem,
      title,
      price,
      subject,
      isLocked: price > 0,
    };
    this.dataService.updateContent(updatedItem);
    this.editingPdfId.set(null);
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
    if (this.videoUploadForm.valid && this.teacherProfile()) {
        const val = this.videoUploadForm.value;
        const newVideo: VideoLecture = {
            id: `vid-${Date.now()}`,
            title: val.title,
            description: val.description,
            topic: val.topic,
            instructor: this.teacherProfile()!.name,
            city: 'Online',
            duration: 'N/A',
            isPremium: val.price > 0,
            thumbnailUrl: val.thumbnailUrl,
            videoUrl: val.videoUrl,
            price: val.price,
        };
        this.dataService.addVideoLecture(newVideo);
        this.videoUploadForm.reset({ price: 0 });
    }
  }

  saveVideo(originalVideo: VideoLecture, title: string, priceStr: string, topic: string) {
    const price = parseFloat(priceStr) || 0;
    const updatedVideo: VideoLecture = {
      ...originalVideo,
      title,
      price,
      topic,
      isPremium: price > 0,
    };
    this.dataService.updateVideo(updatedVideo);
    this.editingVideoId.set(null);
  }

  async generateAiReply(question: string, textarea: HTMLTextAreaElement) {
    this.isGenerating.set(true);
    const context = `You are ${this.teacherProfile()?.name}, a teacher on the ExamEdge platform. ${this.teacherProfile()?.bio}`;
    const reply = await this.geminiService.draftReply(question, context);
    textarea.value = reply;
    this.isGenerating.set(false);
  }
}