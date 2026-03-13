import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { DataService, ContentItem, Attachment, VideoLecture } from '../services/data.service';
import { FormsModule } from '@angular/forms';
import { PaymentModalComponent } from './payment-modal.component';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, PaymentModalComponent],
  template: `
    <div class="h-screen bg-slate-50 flex flex-col relative overflow-hidden">
      <!-- Navbar -->
      <nav class="bg-white border-b border-slate-200 sticky top-0 z-40 flex-shrink-0">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <i class="fa-solid fa-graduation-cap"></i>
              </div>
              <span class="font-bold text-xl text-slate-900 tracking-tight">ExamEdge</span>
            </div>
            
            <div class="flex items-center gap-4">
              <button (click)="isFocusSliderOpen.set(true)" class="text-slate-400 hover:text-blue-500 transition-colors" title="Set Study Focus">
                <i class="fa-solid fa-crosshairs"></i>
              </button>
              <div class="flex items-center gap-3 pl-4 border-l border-slate-200">
                <span class="hidden md:block text-sm font-medium text-slate-700">{{ authService.currentUser()?.name }}</span>
                <button (click)="authService.logout()" class="text-slate-400 hover:text-red-500 transition-colors">
                  <i class="fa-solid fa-right-from-bracket"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      @if (viewMode() === 'study') {
        <!-- Main Content Scroll Area -->
        <main class="flex-grow overflow-y-auto pb-24 md:pb-20">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
            
            <!-- Study Focus Banner -->
            @if (currentFocusName(); as focusName) {
              <div class="mb-6 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
                <i class="fa-solid fa-bullseye text-lg"></i>
                <div>
                  <p class="text-sm font-bold">Showing content for: {{ focusName }}</p>
                  <p class="text-xs">Change this anytime using the <i class="fa-solid fa-crosshairs mx-1"></i> icon in the header.</p>
                </div>
              </div>
            }

            <!-- Mobile Tabs -->
            <div class="md:hidden flex mb-6 bg-white rounded-xl shadow-sm border border-slate-100 p-1">
              <button (click)="mobileTab.set('study')" [class]="mobileTab() === 'study' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'" class="flex-1 py-2 rounded-lg text-sm font-medium transition-all">
                Study
              </button>
              <button (click)="mobileTab.set('scores')" [class]="mobileTab() === 'scores' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'" class="flex-1 py-2 rounded-lg text-sm font-medium transition-all">
                Scores
              </button>
              <button (click)="mobileTab.set('ask')" [class]="mobileTab() === 'ask' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'" class="flex-1 py-2 rounded-lg text-sm font-medium transition-all">
                Ask
              </button>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              <!-- Left: Content Feed -->
              <div class="lg:col-span-2 space-y-6" [class.hidden]="mobileTab() !== 'study' && mobileTab() !== 'desktop'">
                
                <!-- Pro Plan Banner -->
                @if (!isPro()) {
                  <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
                      <div>
                          <h3 class="text-xl font-bold">Go Pro!</h3>
                          <p class="text-sm opacity-80">Get unlimited access to all study materials forever.</p>
                      </div>
                      <button (click)="openProPaymentModal()" class="bg-white text-blue-600 font-bold px-6 py-2 rounded-full hover:bg-slate-100 transition-colors flex-shrink-0 shadow-md">
                          Unlock All for $199
                      </button>
                  </div>
                }

                <!-- Filters -->
                <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  <button (click)="filter.set('all')" [class]="filter() === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'" class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0">
                    All Materials
                  </button>
                  <button (click)="filter.set('note')" [class]="filter() === 'note' ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'" class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0">
                    <i class="fa-solid fa-book mr-1"></i> Notes
                  </button>
                  <button (click)="filter.set('paper')" [class]="filter() === 'paper' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'" class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0">
                    <i class="fa-solid fa-file-pen mr-1"></i> Papers
                  </button>
                  <button (click)="filter.set('topic')" [class]="filter() === 'topic' ? 'bg-orange-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'" class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0">
                    <i class="fa-solid fa-star mr-1"></i> Important
                  </button>
                </div>

                <!-- Items List -->
                <div class="space-y-4">
                  @for (item of filteredContent(); track item.id) {
                    <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group relative overflow-hidden">
                      <div class="flex justify-between items-start mb-2">
                        <div class="flex items-center gap-2">
                          <span [class]="getBadgeClass(item.type)">{{ item.type }}</span>
                          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">{{ item.subject }}</span>
                        </div>
                         @if (item.isLocked) {
                           <span class="text-amber-500 text-xs font-bold flex items-center gap-1"><i class="fa-solid fa-crown"></i> PREMIUM</span>
                         }
                      </div>
                      
                      <h3 class="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">{{ item.title }}</h3>
                      <p class="text-slate-600 text-sm mb-4 leading-relaxed protected-content line-clamp-2">{{ item.description }}</p>
                      
                      <div class="flex items-center gap-4 pt-4 border-t border-slate-50 flex-wrap">
                        @if (!item.isLocked || isPro() || isPurchased(item.id)) {
                          <!-- UNLOCKED VIEW: Free, Pro, or Individually Purchased -->
                          <button (click)="viewContent(item)" class="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                            <i class="fa-regular fa-eye"></i> View
                          </button>
                          <button (click)="downloadFile(item)" class="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                            <i class="fa-solid fa-download"></i> Download PDF
                          </button>
                          <div class="ml-auto">
                            @if (item.isLocked) {
                              <span class="text-green-600 text-xs font-bold flex items-center gap-1">
                                <i class="fa-solid fa-check-circle"></i> Unlocked
                              </span>
                            }
                          </div>
                        } @else {
                          <!-- LOCKED VIEW: For non-pro users -->
                          <div class="flex flex-wrap items-center gap-2">
                            @if (item.price && item.price > 0) {
                              <button (click)="openItemPaymentModal(item)" class="bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                <i class="fa-solid fa-cart-shopping mr-2"></i> Buy for {{ item.price | currency }}
                              </button>
                            }
                             <button (click)="openProPaymentModal()" class="bg-purple-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                              <i class="fa-solid fa-crown mr-2"></i> Unlock All with Pro
                            </button>
                          </div>
                        }
                      </div>
                    </div>
                  } @empty {
                      <div class="col-span-full text-center py-16 px-4 bg-white rounded-xl border border-slate-100">
                        <i class="fa-solid fa-box-open text-4xl text-slate-300 mb-4"></i>
                        <h3 class="font-bold text-slate-700">No Study Materials Found</h3>
                        <p class="text-sm text-slate-500">Materials for your selected focus will appear here.</p>
                      </div>
                  }
                </div>
              </div>

              <!-- Scores View (Mobile Tab & Desktop Sidebar) -->
              <div class="lg:col-span-1 space-y-6" [class.hidden]="mobileTab() !== 'scores' && mobileTab() !== 'desktop'">
                 <!-- Scores List -->
                 <div class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div class="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                      <h3 class="font-bold text-slate-800 flex items-center gap-2">
                        <i class="fa-solid fa-trophy text-amber-500"></i> My Performance
                      </h3>
                    </div>
                    
                    <div class="max-h-[500px] overflow-y-auto p-2 space-y-2">
                      @for (result of dataService.results(); track result.id) {
                        <div class="bg-white p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors flex items-center justify-between">
                           <div class="flex-1 min-w-0 mr-4">
                              <p class="text-sm font-bold text-slate-700 truncate">{{ result.examTitle }}</p>
                              <p class="text-xs text-slate-500">{{ result.subject }} • {{ result.date }}</p>
                           </div>
                           <div class="text-right">
                              <div class="text-lg font-bold" [class]="getScoreColor(result.score, result.total)">
                                {{ result.score }}/{{ result.total }}
                              </div>
                              <div class="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Score</div>
                           </div>
                        </div>
                      }
                    </div>
                 </div>
              </div>

              <!-- Right: Helper & Queries (Ask Tab) -->
              <aside class="space-y-6 lg:block" [class.hidden]="mobileTab() !== 'ask' && mobileTab() !== 'desktop'">
                <!-- Ask Question Widget -->
                <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-100 sticky top-24">
                  <h3 class="font-bold text-slate-800 mb-1">Ask an Expert</h3>
                  <p class="text-xs text-slate-500 mb-4">Get answers directly from our top tutors.</p>
                  
                  <div class="space-y-3">
                    <textarea [(ngModel)]="questionText" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:border-blue-500 outline-none resize-none h-32" placeholder="What's your doubt?"></textarea>
                    <button (click)="submitQuery()" [disabled]="!questionText" class="w-full bg-slate-900 text-white font-medium py-2.5 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 text-sm">
                      Submit Query
                    </button>
                  </div>

                  <div class="mt-6 pt-6 border-t border-slate-100">
                     <h4 class="font-bold text-xs uppercase text-slate-400 mb-4">Your Recent Queries</h4>
                     <div class="space-y-4">
                       @for (q of myQueries(); track q.id) {
                         <div class="text-sm">
                           <p class="font-medium text-slate-700 mb-1">"{{ q.question }}"</p>
                           @if (q.answer) {
                             <div class="bg-green-50 text-green-800 p-2 rounded text-xs border border-green-100">
                               <i class="fa-solid fa-check-circle mr-1"></i> {{ q.answer }}
                             </div>
                           } @else {
                             <span class="text-xs text-orange-500 flex items-center gap-1">
                               <i class="fa-regular fa-clock"></i> Awaiting reply...
                             </span>
                           }
                         </div>
                       }
                     </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </main>
      } @else {
        <!-- Video Dashboard View -->
        <main class="flex-1 overflow-y-auto p-4 md:p-8">
          <!-- Filters -->
          <div class="mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="relative">
              <i class="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input [(ngModel)]="videoSearchQuery" type="text" placeholder="Search by topic, title, instructor..." class="w-full bg-slate-50 rounded-lg pl-9 pr-3 py-2 text-sm border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div class="relative">
               <i class="fa-solid fa-map-marker-alt absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <select [(ngModel)]="videoSelectedCity" class="w-full bg-slate-50 rounded-lg pl-9 pr-3 py-2 text-sm border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                <option value="All">All Cities</option>
                @for (city of uniqueVideoCities(); track city) {
                  <option [value]="city">{{ city }}</option>
                }
              </select>
            </div>
          </div>

          <!-- Video Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            @for (lecture of filteredLectures(); track lecture.id) {
              <div (click)="lecture.isPremium && !isPro() ? null : selectedVideo.set(lecture)" 
                   class="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                   [class.cursor-pointer]="!lecture.isPremium || isPro()">
                
                <div class="relative">
                  <img [src]="lecture.thumbnailUrl" alt="Thumbnail" class="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300">
                  <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <span class="absolute bottom-2 left-2 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded">{{ lecture.duration }}</span>
                  @if (lecture.isPremium) {
                    <span class="absolute top-2 right-2 bg-amber-400 text-black text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
                      <i class="fa-solid fa-crown"></i> PRO
                    </span>
                  }
                </div>
                
                <div class="p-4">
                  <p class="text-xs font-bold uppercase tracking-wider text-blue-600">{{ lecture.topic }}</p>
                  <h3 class="font-bold text-slate-800 leading-tight mt-1 mb-2">{{ lecture.title }}</h3>
                  <p class="text-xs text-slate-500">by {{ lecture.instructor }} in {{ lecture.city }}</p>
                </div>

                @if (lecture.isPremium && !isPro()) {
                  <div class="p-4 border-t border-slate-100 bg-slate-50 text-center">
                    <button (click)="openProPaymentModal()" class="text-sm font-bold text-blue-600 hover:underline">Unlock with Pro</button>
                  </div>
                }
              </div>
            } @empty {
              <div class="col-span-full text-center py-16 px-4 bg-white rounded-xl border border-slate-100">
                <i class="fa-solid fa-video-slash text-4xl text-slate-300 mb-4"></i>
                <h3 class="font-bold text-slate-700">No Lectures Found</h3>
                <p class="text-sm text-slate-500">Lectures for your selected focus will appear here.</p>
              </div>
            }
          </div>
        </main>
      }

      <!-- NEW Permanent Footer Bar -->
      <div class="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-sm border-t border-slate-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <button (click)="toggleNotes()" class="flex items-center gap-2 text-slate-600 font-medium text-sm hover:text-blue-600 transition-colors">
                <i class="fa-solid fa-pencil"></i>
                <span class="hidden sm:inline">Quick Notes</span>
            </button>
            @if (viewMode() === 'study') {
              <div class="flex items-center gap-3">
                <button (click)="viewMode.set('videos')" class="bg-blue-600 text-white font-bold px-4 py-2.5 rounded-full hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2 transform hover:scale-105">
                    <i class="fa-solid fa-clapperboard"></i>
                    <span>Video Lectures</span>
                </button>
                <button (click)="openYouTube()" class="bg-red-600 text-white font-bold px-4 py-2.5 rounded-full hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20 flex items-center gap-2 transform hover:scale-105">
                    <i class="fa-brands fa-youtube"></i>
                    <span>YouTube</span>
                </button>
                <button (click)="openAIAppMaker()" class="bg-blue-600 text-white font-bold px-4 py-2.5 rounded-full hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2 transform hover:scale-105">
                    <i class="fa-solid fa-wand-magic-sparkles"></i>
                    <span>AI App Maker</span>
                </button>
              </div>
            } @else {
               <button (click)="viewMode.set('study')" class="bg-slate-800 text-white font-bold px-4 py-2.5 rounded-full hover:bg-slate-700 transition-colors shadow-lg flex items-center gap-2 transform hover:scale-105">
                  <i class="fa-solid fa-book-open"></i>
                  <span>Study Dashboard</span>
              </button>
            }
        </div>
      </div>
      
      <!-- REVISED Bottom Sheet Quick Notes -->
      <div class="fixed bottom-0 left-0 right-0 z-50 pointer-events-none transition-transform duration-300 ease-in-out"
           [class.translate-y-full]="!isNoteOpen()" [class.translate-y-0]="isNoteOpen()">
          <div class="max-w-2xl mx-auto pointer-events-auto">
             <div class="bg-white rounded-t-2xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] border-t border-slate-200 h-80 flex flex-col">
                <div class="flex justify-between items-center p-4 border-b border-slate-100 flex-shrink-0">
                   <h3 class="font-bold text-slate-800">My Scratchpad</h3>
                   <button (click)="toggleNotes()" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <textarea class="flex-grow p-4 resize-none outline-none text-slate-700 leading-relaxed bg-yellow-50/50" placeholder="Type your quick study notes here..."></textarea>
             </div>
          </div>
      </div>

      <!-- Payment Modal -->
      @if (isPaymentModalOpen()) {
        <app-payment-modal 
          [itemName]="paymentItemName()"
          [itemPrice]="paymentItemPrice()"
          (paymentSuccess)="handlePaymentSuccess()"
          (close)="closePaymentModal()"
        ></app-payment-modal>
      }

       <!-- Video Player Modal -->
      @if (selectedVideo(); as video) {
        <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in" (click)="selectedVideo.set(null)">
          <div class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-slide-up" (click)="$event.stopPropagation()">
             <div class="bg-slate-900 aspect-video flex-shrink-0 flex items-center justify-center text-white relative">
                <video controls [src]="video.videoUrl" class="w-full h-full bg-black" [poster]="video.thumbnailUrl"></video>
             </div>
             <div class="p-6 overflow-y-auto flex-grow">
                <h2 class="text-2xl font-bold text-slate-900">{{ video.title }}</h2>
                <p class="text-sm text-slate-500">by {{ video.instructor }} | Topic: {{ video.topic }} | City: {{ video.city }}</p>
                <p class="text-sm text-slate-700 mt-3">{{ video.description }}</p>
                @if (video.externalLink) {
                  <a [href]="video.externalLink" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 bg-green-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-green-700 transition-colors mt-4 text-sm">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    {{ video.linkText || 'View Companion Material' }}
                  </a>
                }
             </div>
             <div class="p-4 bg-slate-50 border-t text-right">
                <button (click)="selectedVideo.set(null)" class="bg-slate-200 text-slate-800 font-bold px-5 py-2 rounded-lg hover:bg-slate-300">Close</button>
             </div>
          </div>
        </div>
      }

      <!-- Study Focus Slider -->
      @if (isFocusSliderOpen()) {
        <div class="fixed inset-0 bg-black/50 z-[60] animate-fade-in" (click)="isFocusSliderOpen.set(false)"></div>
        <div class="fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-[70] flex flex-col animate-slide-in-right">
            <!-- Header -->
            <div class="p-4 border-b flex justify-between items-center flex-shrink-0">
                <h3 class="font-bold text-lg text-slate-800">Customize Your Dashboard</h3>
                <button (click)="isFocusSliderOpen.set(false)" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark"></i></button>
            </div>

            <!-- Content -->
            <div class="flex-grow p-4 overflow-y-auto">
                <p class="text-sm text-slate-600 mb-6">Select your primary field of study. This will personalize the content you see on your dashboard.</p>
                <div class="space-y-2">
                    @for (topic of dataService.careerTopics(); track topic.id) {
                        <!-- Topic Accordion -->
                        <div>
                            <button (click)="toggleTopic(topic.id)" class="w-full flex justify-between items-center p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-left transition-colors">
                                <span class="font-bold text-slate-700">{{ topic.name }}</span>
                                <i class="fa-solid fa-chevron-down transition-transform duration-200" [class.rotate-180]="expandedTopicId() === topic.id"></i>
                            </button>
                            @if (expandedTopicId() === topic.id) {
                                <div class="pl-4 mt-2 space-y-1 animate-fade-in-slow">
                                    @for (subTopic of topic.subTopics; track subTopic.id) {
                                        <button (click)="selectSubTopic(topic.id, subTopic.id, subTopic.name)" [class]="isSelected(topic.id, subTopic.id) ? 'bg-blue-600 text-white' : 'hover:bg-blue-50 text-slate-600'" class="w-full text-left p-2.5 rounded-md transition-colors text-sm font-medium">
                                            {{ subTopic.name }}
                                        </button>
                                    }
                                </div>
                            }
                        </div>
                    }
                </div>
            </div>

            <!-- Footer -->
            <div class="p-4 border-t bg-slate-50 flex-shrink-0">
                <p class="text-xs text-slate-500 text-center mb-2">Your selection will be applied on your next login.</p>
                <button (click)="saveFocusAndLogout()" [disabled]="!selectedFocus()" class="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    Save & Logout
                </button>
            </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .protected-content {
       -webkit-user-select: none;
       -moz-user-select: none;
       -ms-user-select: none;
       user-select: none;
    }
    .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
    .animate-fade-in-slow { animation: fadeIn 0.4s ease-out forwards; }
    .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .animate-slide-in-right { animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp {
       from { opacity: 0; transform: translateY(20px); scale: 0.95; }
       to { opacity: 1; transform: translateY(0); scale: 1; }
    }
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(100%); }
      to { opacity: 1; transform: translateX(0); }
    }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    .rotate-180 { transform: rotate(180deg); }
  `]
})
export class StudentDashboardComponent {
  authService = inject(AuthService);
  dataService = inject(DataService);

  // Main Dashboard State
  filter = signal<'all' | 'note' | 'paper' | 'topic'>('all');
  mobileTab = signal<'study' | 'scores' | 'ask' | 'desktop'>('study');
  questionText = '';
  isNoteOpen = signal(false);

  // View Mode
  viewMode = signal<'study' | 'videos'>('study');

  // Video Dashboard State
  videoSearchQuery = signal('');
  videoSelectedCity = signal('All');
  selectedVideo = signal<VideoLecture | null>(null);

  // Study Focus State
  isFocusSliderOpen = signal(false);
  expandedTopicId = signal<string | null>(null);
  selectedFocus = signal<{ topicId: string; subTopicId: string; subTopicName: string; } | null>(null);

  // Payment State
  isPaymentModalOpen = signal(false);
  paymentItemName = signal('');
  paymentItemPrice = signal(0);
  purchaseContext = signal<'pro' | 'item' | null>(null);
  itemForPurchase = signal<ContentItem | null>(null);


  isPro = computed(() => !!this.authService.currentUser()?.isPro);

  isPurchased(itemId: string): boolean {
    return this.authService.currentUser()?.purchasedItemIds?.includes(itemId) ?? false;
  }

  private studyFocusMap: { [key: string]: string[] } = {
    'mech-eng': ['Physics', 'Mathematics'],
    'elec-eng': ['Physics', 'Mathematics', 'Computer Science'],
    'cs-eng': ['Computer Science', 'Mathematics'],
    'civil-eng': ['Physics', 'Mathematics'],
    'pre-med': ['Biology', 'Chemistry'],
    'pharma': ['Biology', 'Chemistry'],
    'grade12-sci': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
    'grade12-arts': ['History', 'English', 'Political Science', 'Economics'],
    'grade12-comm': ['Economics', 'Mathematics'],
  };

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        if (window.innerWidth >= 1024) {
          this.mobileTab.set('desktop');
        } else if (this.mobileTab() === 'desktop') {
          this.mobileTab.set('study');
        }
      });
      if (window.innerWidth >= 1024) this.mobileTab.set('desktop');
    }
  }

  // --- Computeds for Study Focus ---
  currentFocus = computed(() => this.authService.currentUser()?.studyFocus);
  currentFocusName = computed(() => this.currentFocus()?.subTopicName);

  relevantSubjects = computed(() => {
    const focus = this.currentFocus();
    if (!focus) return null; // null means show everything
    return this.studyFocusMap[focus.subTopicId] || [];
  });

  // --- Computeds for Main Dashboard ---
  baseFilteredContent = computed(() => {
    const allContent = this.dataService.content();
    const subjects = this.relevantSubjects();
    if (subjects === null) return allContent;
    return allContent.filter(item => subjects.includes(item.subject));
  });

  filteredContent = computed(() => {
    const f = this.filter();
    const baseContent = this.baseFilteredContent();
    if (f === 'all') return baseContent;
    return baseContent.filter(item => item.type === f);
  });

  myQueries = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return [];
    return this.dataService.queries().filter(q => q.studentName.includes(user.name) || q.studentName.includes('Alex'));
  });

  // --- Computeds for Video Dashboard ---
  uniqueVideoCities = computed(() => {
    const cities = this.dataService.videoLectures().map(l => l.city);
    return [...new Set(cities)];
  });

  baseFilteredLectures = computed(() => {
    const allLectures = this.dataService.videoLectures();
    const subjects = this.relevantSubjects();
    if (subjects === null) return allLectures;
    return allLectures.filter(lecture => subjects.includes(lecture.topic));
  });

  filteredLectures = computed(() => {
    const query = this.videoSearchQuery().toLowerCase().trim();
    const city = this.videoSelectedCity();
    const lectures = this.baseFilteredLectures();

    return lectures.filter(lecture => {
      const cityMatch = city === 'All' || lecture.city === city;

      const queryMatch = !query ||
        lecture.title.toLowerCase().includes(query) ||
        lecture.topic.toLowerCase().includes(query) ||
        lecture.instructor.toLowerCase().includes(query);

      return cityMatch && queryMatch;
    });
  });

  // --- Methods ---
  getBadgeClass(type: string) {
    switch (type) {
      case 'note': return 'text-purple-600 bg-purple-50 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-purple-100';
      case 'paper': return 'text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-blue-100';
      case 'topic': return 'text-orange-600 bg-orange-50 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-orange-100';
      default: return 'text-gray-600 bg-gray-50 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-gray-100';
    }
  }

  getAttachmentIcon(fileType: Attachment['fileType']): string {
    switch (fileType) {
      case 'pdf': return 'fa-solid fa-file-pdf text-red-500';
      case 'doc': return 'fa-solid fa-file-word text-blue-500';
      case 'img': return 'fa-solid fa-file-image text-purple-500';
      default: return 'fa-solid fa-file';
    }
  }

  getScoreColor(score: number, total: number) {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-amber-600';
    return 'text-red-600';
  }

  submitQuery() {
    if (!this.questionText.trim()) return;

    this.dataService.addQuery({
      id: Math.random().toString(36).substr(2, 9),
      studentName: this.authService.currentUser()?.name || 'Anonymous',
      question: this.questionText,
      answer: null,
      timestamp: new Date()
    });

    this.questionText = '';
  }

  toggleNotes() {
    this.isNoteOpen.update(v => !v);
  }

  // --- Study Focus Methods ---
  toggleTopic(topicId: string) {
    this.expandedTopicId.update(current => current === topicId ? null : topicId);
  }

  selectSubTopic(topicId: string, subTopicId: string, subTopicName: string) {
    this.selectedFocus.set({ topicId, subTopicId, subTopicName });
  }

  isSelected(topicId: string, subTopicId: string): boolean {
    const selection = this.selectedFocus();
    return selection?.topicId === topicId && selection?.subTopicId === subTopicId;
  }

  saveFocusAndLogout() {
    const selection = this.selectedFocus();
    if (selection) {
      this.authService.setStudyFocusAndLogout(selection);
    }
  }

  // --- Payment Methods ---
  openProPaymentModal() {
    this.purchaseContext.set('pro');
    this.paymentItemName.set('ExamEdge Pro - All Access');
    this.paymentItemPrice.set(199);
    this.isPaymentModalOpen.set(true);
  }

  openItemPaymentModal(item: ContentItem) {
    if (!item.price) return;
    this.purchaseContext.set('item');
    this.itemForPurchase.set(item);
    this.paymentItemName.set(item.title);
    this.paymentItemPrice.set(item.price);
    this.isPaymentModalOpen.set(true);
  }

  closePaymentModal() {
    this.isPaymentModalOpen.set(false);
    this.purchaseContext.set(null);
    this.itemForPurchase.set(null);
  }

  handlePaymentSuccess() {
    const context = this.purchaseContext();
    if (context === 'pro') {
      this.authService.purchaseProPlan(this.paymentItemPrice());
    } else if (context === 'item') {
      const item = this.itemForPurchase();
      if (item) {
        this.authService.purchaseItem(item.id, item.price!);
      }
    }
    this.closePaymentModal();
  }

  // --- Content Interaction ---
  viewContent(item: ContentItem) {
    alert(`Viewing content: ${item.title}`);
  }

  viewAttachment(attachment: Attachment) {
    alert(`Viewing attachment: ${attachment.fileName}`);
  }

  downloadFile(item: ContentItem) {
    if (item.fileUrl && item.fileName) {
      const element = document.createElement('a');
      element.setAttribute('href', item.fileUrl);
      element.setAttribute('download', item.fileName);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } else {
      alert(`This content (${item.title}) does not have a directly downloadable file.`);
    }
  }

  openYouTube() {
    window.open('http://localhost:5174', '_blank');
  }

  openAIAppMaker() {
    window.open('http://localhost:5173', '_blank');
  }
}