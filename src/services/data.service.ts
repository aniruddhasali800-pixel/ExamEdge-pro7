import { Injectable, signal, effect, computed } from '@angular/core';

export interface Attachment {
  id: string;
  fileName: string;
  fileType: 'pdf' | 'doc' | 'img' | 'other';
}

export interface ContentItem {
  id: string;
  title: string;
  type: 'note' | 'paper' | 'topic';
  subject: string;
  isLocked: boolean;
  date: string;
  description: string;
  fileName?: string;
  fileUrl?: string;
  price?: number;
  attachments?: Attachment[];
  instructor: string;
  teacherId: string;
}

export interface Query {
  id: string;
  studentName: string;
  question: string;
  answer: string | null;
  timestamp: Date;
}

export interface VideoLecture {
  id: string;
  title: string;
  description: string;
  topic: string; // Corresponds to subject
  city: string;
  instructor: string;
  thumbnailUrl: string;
  videoUrl?: string; // Can be a data URL or blob URL
  duration: string; // e.g., "45:12"
  isPremium: boolean;
  originatingLiveSessionId?: string;
  publishTime?: string; // ISO String for scheduled release
  pdfUrl?: string;
  price?: number;
  externalLink?: string;
  linkText?: string;
}

export interface LiveSession {
  id: string;
  title: string;
  description: string;
  topic: string; // For study focus filtering
  instructor: string;
  thumbnailUrl: string;
  videoUrl: string;
  pdfUrl?: string;
  status: 'upcoming' | 'live' | 'ended';
  scheduledTime: string; // ISO String
  durationMinutes: number;
  price?: number;
  isArchived?: boolean;
}

export interface Analytics {
  totalUsers: number;
  activeUsers: number;
  totalSales: number;
  monthlyEarnings: number[];
  videoEarnings: number;
  liveSessionEarnings: number;
  pdfEarnings: number;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  bio: string;
  commissionRate: number; // Value from 0 to 1 (e.g., 0.3 for 30%)
  analytics: {
    totalEarnings: number; // Net earnings
    monthlyEarnings: number[];
    pdfEarnings: number; // Net
    videoEarnings: number; // Net
    liveSessionEarnings: number; // Net
  };
}

export interface ExamResult {
  id: string;
  examTitle: string;
  score: number;
  total: number;
  date: string;
  subject: string;
}

export interface ActivityLog {
  id: string;
  userEmail: string;
  action: 'Sign In' | 'Sign Out' | 'Purchase' | 'Upload';
  timestamp: string;
  ip: string;
}

export interface Transaction {
  id: string;
  userEmail: string;
  amount: number;
  status: 'Success' | 'Failed' | 'Pending';
  date: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  status: 'Active' | 'Inactive';
  joinDate: string;
  lastLogin: string;
  country: string;
}

export interface CareerSubTopic {
  id: string;
  name: string;
}

export interface CareerTopic {
  id: string;
  name: string;
  icon: string;
  subTopics: CareerSubTopic[];
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private STORAGE_KEY = 'examedge_data_v3';

  // Real-world Content Data
  content = signal<ContentItem[]>([
    { id: 'c1', title: 'Advanced Calculus: Limits & Continuity', type: 'note', subject: 'Mathematics', isLocked: true, date: '2024-03-15', description: 'Comprehensive notes covering epsilon-delta definitions, continuity on intervals, and intermediate value theorem applications.', fileName: 'calc_limits_v2.pdf', price: 9.99, attachments: [
      { id: 'att1', fileName: 'Formula_Sheet.pdf', fileType: 'pdf' },
      { id: 'att2', fileName: 'Key_Theorems.docx', fileType: 'doc' }
    ], instructor: 'Dr. Evelyn Reed', teacherId: 't1'},
    { id: 'c2', title: 'JEE Main 2024 - Physics Full Solution', type: 'paper', subject: 'Physics', isLocked: true, date: '2024-03-10', description: 'Complete step-by-step solutions for the April session. Includes free body diagrams and formula derivations.', fileName: 'jee_phys_2024.pdf', price: 14.99, instructor: 'Prof. John Alistair', teacherId: 't2' },
    { id: 'c3', title: 'Organic Chemistry: Named Reactions Cheat Sheet', type: 'topic', subject: 'Chemistry', isLocked: false, date: '2024-03-08', description: 'A quick revision guide for 50+ essential named reactions including Cannizzaro, Aldol, and Wurtz reactions.', fileName: 'org_chem_cheat.pdf', attachments: [
      { id: 'att3', fileName: 'Reaction_Mechanisms.png', fileType: 'img' }
    ], instructor: 'Admin', teacherId: 'admin'},
  ]);

  // Real-world Queries
  queries = signal<Query[]>([
    { id: 'q1', studentName: 'Sarah Jenkins', question: 'Does the Advanced Calculus note cover partial differentiation?', answer: null, timestamp: new Date() },
    { id: 'q2', studentName: 'Rahul Verma', question: 'I found a typo in the Physics solution, question 4. Should be 9.8 m/s^2.', answer: 'Thanks Rahul! We have verified and updated the document.', timestamp: new Date(Date.now() - 3600000 * 2) },
  ]);

  careerTopics = signal<CareerTopic[]>([
    {
      id: 'career-eng',
      name: 'Engineering',
      icon: 'fa-solid fa-gears',
      subTopics: [
        { id: 'mech-eng', name: 'Mechanical Engineering' },
        { id: 'elec-eng', name: 'Electrical Engineering' },
        { id: 'cs-eng', name: 'Computer Engineering' },
        { id: 'civil-eng', name: 'Civil Engineering' },
      ],
    },
    {
      id: 'career-med',
      name: 'Medical',
      icon: 'fa-solid fa-stethoscope',
      subTopics: [
        { id: 'pre-med', name: 'Pre-Medical' },
        { id: 'pharma', name: 'Pharmacy' },
      ],
    },
    {
      id: 'grade12',
      name: 'Grade 12',
      icon: 'fa-solid fa-school',
      subTopics: [
        { id: 'grade12-sci', name: 'Science Stream' },
        { id: 'grade12-arts', name: 'Arts Stream' },
        { id: 'grade12-comm', name: 'Commerce Stream' },
      ],
    },
  ]);

  videoLectures = signal<VideoLecture[]>([
    { id: 'v1', title: 'Calculus 1: Derivatives', description: 'Master the fundamentals of derivatives, from first principles to advanced rules like chain and product rules.', topic: 'Mathematics', city: 'New York', instructor: 'Dr. Evelyn Reed', thumbnailUrl: 'https://picsum.photos/seed/calculus/400/225', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '58:30', isPremium: false },
    { id: 'v2', title: 'Newtonian Mechanics', description: 'An in-depth look at Newton\'s Laws of Motion with practical examples and problem-solving sessions.', topic: 'Physics', city: 'London', instructor: 'Prof. John Alistair', thumbnailUrl: 'https://picsum.photos/seed/physics1/400/225', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '1:12:15', isPremium: true, price: 19.99 },
    { id: 'v3', title: 'Organic Chemistry: Alkanes', description: 'Nomenclature, properties, and reactions of alkanes. Perfect for first-year chemistry students.', topic: 'Chemistry', city: 'Mumbai', instructor: 'Dr. Anjali Sharma', thumbnailUrl: 'https://picsum.photos/seed/chem1/400/225', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '45:22', isPremium: false },
    { id: 'v4', title: 'Data Structures in Python', description: 'Explore lists, dictionaries, sets, and tuples, with a focus on time complexity and practical applications.', topic: 'Computer Science', city: 'San Francisco', instructor: 'Ben Carter', thumbnailUrl: 'https://picsum.photos/seed/python/400/225', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '1:35:40', isPremium: true },
  ]);

  liveSessions = signal<LiveSession[]>([
    { 
      id: 'ls1', 
      title: 'Live Q&A: Solving Difficult Integrals',
      description: 'Join Prof. Reed as she tackles the most challenging integration problems submitted by students. Bring your questions!',
      topic: 'Mathematics',
      instructor: 'Dr. Evelyn Reed',
      thumbnailUrl: 'https://picsum.photos/seed/livemath/400/225',
      videoUrl: '#',
      pdfUrl: '#',
      status: 'live',
      scheduledTime: new Date().toISOString(),
      durationMinutes: 60,
      price: 10,
      isArchived: false,
    },
    { 
      id: 'ls2', 
      title: 'Upcoming: Quantum Physics Explained',
      description: 'A beginner-friendly introduction to the weird and wonderful world of quantum mechanics.',
      topic: 'Physics',
      instructor: 'Prof. John Alistair',
      thumbnailUrl: 'https://picsum.photos/seed/livephysics/400/225',
      videoUrl: '#',
      status: 'upcoming',
      scheduledTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
      durationMinutes: 75,
      isArchived: false,
    },
     { 
      id: 'ls3', 
      title: 'NEET Biology Crash Course',
      description: 'A rapid revision of the most important topics for the upcoming NEET exam.',
      topic: 'Biology',
      instructor: 'Dr. Anjali Sharma',
      thumbnailUrl: 'https://picsum.photos/seed/livebio/400/225',
      videoUrl: '#',
      pdfUrl: '#',
      status: 'ended',
      scheduledTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // yesterday
      durationMinutes: 90,
      isArchived: false,
    }
  ]);

  teachers = signal<Teacher[]>([
    {
      id: 't1',
      name: 'Dr. Evelyn Reed',
      email: 'evelyn.reed@examedge.pro',
      avatarUrl: 'https://i.pravatar.cc/150?u=evelynreed',
      bio: 'PhD in Mathematics with over 15 years of teaching experience. Specializes in advanced calculus and linear algebra.',
      commissionRate: 0.3,
      analytics: {
        totalEarnings: 22500,
        monthlyEarnings: [3200, 3500, 4100, 3800, 4500, 3400],
        pdfEarnings: 5000,
        videoEarnings: 10000,
        liveSessionEarnings: 7500
      }
    },
    {
      id: 't2',
      name: 'Prof. John Alistair',
      email: 'john.alistair@examedge.pro',
      avatarUrl: 'https://i.pravatar.cc/150?u=johnalistair',
      bio: 'Renowned physicist and author. My passion is making complex topics like quantum mechanics accessible to all.',
      commissionRate: 0.3,
      analytics: {
        totalEarnings: 18750,
        monthlyEarnings: [2800, 3100, 2900, 3500, 3250, 3200],
        pdfEarnings: 4000,
        videoEarnings: 9000,
        liveSessionEarnings: 5750
      }
    }
  ]);

  results = signal<ExamResult[]>([
    { id: 'r1', examTitle: 'Full Mock Test: Physics', score: 88, total: 100, date: '2024-03-12', subject: 'Physics' },
    { id: 'r2', examTitle: 'Math: Calculus Quiz 3', score: 45, total: 50, date: '2024-03-05', subject: 'Mathematics' },
  ]);

  analytics = computed<Analytics>(() => {
    const teachersData = this.teachers();

    const teacherStats = teachersData.map(teacher => {
        const { totalEarnings, pdfEarnings, videoEarnings, liveSessionEarnings } = teacher.analytics;
        const commissionRate = teacher.commissionRate;
        
        const getGross = (net: number) => (commissionRate < 1) ? net / (1 - commissionRate) : net;

        return { 
          grossRevenue: getGross(totalEarnings), 
          grossPdfEarnings: getGross(pdfEarnings), 
          grossVideoEarnings: getGross(videoEarnings), 
          grossLiveSessionEarnings: getGross(liveSessionEarnings) 
        };
    });

    const totalSales = teacherStats.reduce((acc, stat) => acc + stat.grossRevenue, 0);
    const pdfEarnings = teacherStats.reduce((acc, stat) => acc + stat.grossPdfEarnings, 0);
    const videoEarnings = teacherStats.reduce((acc, stat) => acc + stat.grossVideoEarnings, 0);
    const liveSessionEarnings = teacherStats.reduce((acc, stat) => acc + stat.grossLiveSessionEarnings, 0);

    return {
        totalUsers: 2453,
        activeUsers: 892,
        totalSales: totalSales,
        monthlyEarnings: [4200, 5100, 4800, 6200, 5900, 7800], // Keep mock for chart
        videoEarnings: videoEarnings,
        liveSessionEarnings: liveSessionEarnings,
        pdfEarnings: pdfEarnings
    };
  });

  activityLogs = signal<ActivityLog[]>([]);
  transactions = signal<Transaction[]>([]);
  students = signal<StudentProfile[]>([]);

  constructor() {
    this.loadFromStorage();
    this.updateLiveSessionStatuses();
    this.archiveEndedLiveSessions();
  }

  updateLiveSessionStatuses() {
    this.liveSessions.update(sessions => {
      const now = new Date();
      return sessions.map(session => {
        if (session.status === 'ended') return session;

        const scheduledTime = new Date(session.scheduledTime);
        const endTime = new Date(scheduledTime.getTime() + session.durationMinutes * 60000);

        if (now >= endTime) {
          return { ...session, status: 'ended' };
        } else if (now >= scheduledTime && session.status !== 'live') {
          return { ...session, status: 'live' };
        } else if (now < scheduledTime && session.status !== 'upcoming') {
          return { ...session, status: 'upcoming' };
        }
        return session;
      });
    });
    this.saveToStorage();
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.content) this.content.set(parsed.content);
          if (parsed.queries) this.queries.set(parsed.queries);
          if (parsed.videoLectures) this.videoLectures.set(parsed.videoLectures);
          if (parsed.liveSessions) this.liveSessions.set(parsed.liveSessions);
          if (parsed.teachers) this.teachers.set(parsed.teachers);
          if (parsed.results) this.results.set(parsed.results);
          if (parsed.activityLogs) this.activityLogs.set(parsed.activityLogs);
          if (parsed.transactions) this.transactions.set(parsed.transactions);
          if (parsed.students) this.students.set(parsed.students);
        } catch (e) {
          console.error('Failed to load local storage data', e);
        }
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
       // Filter out lectures with blob or data URLs to avoid storage quota errors.
      // This means user-uploaded videos are not persisted across page reloads.
      const lecturesToSave = this.videoLectures().filter(v => 
        !v.videoUrl?.startsWith('blob:') && !v.videoUrl?.startsWith('data:')
      );

      const payload = {
        content: this.content(),
        queries: this.queries(),
        videoLectures: lecturesToSave,
        liveSessions: this.liveSessions(),
        teachers: this.teachers(),
        results: this.results(),
        activityLogs: this.activityLogs(),
        transactions: this.transactions(),
        students: this.students()
      };
      
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
      } catch (e) {
        console.error("Failed to save to localStorage. The data might be too large.", e);
      }
    }
  }

  addContent(item: ContentItem) {
    this.content.update(items => [item, ...items]);
    this.saveToStorage();
  }
  
  updateContent(updatedItem: ContentItem) {
    this.content.update(items => 
      items.map(item => item.id === updatedItem.id ? updatedItem : item)
    );
    this.saveToStorage();
  }
  
  deleteContent(id: string) {
    this.content.update(items => items.filter(i => i.id !== id));
    this.saveToStorage();
  }
  
  addVideoLecture(video: VideoLecture) {
    this.videoLectures.update(videos => [video, ...videos]);
    this.saveToStorage();
  }

  updateVideo(updatedLecture: VideoLecture) {
    this.videoLectures.update(videos => 
      videos.map(video => video.id === updatedLecture.id ? updatedLecture : video)
    );
    this.saveToStorage();
  }

  deleteVideoLecture(id: string) {
    this.videoLectures.update(videos => videos.filter(v => v.id !== id));
    this.saveToStorage();
  }

  addLiveSession(session: LiveSession) {
    this.liveSessions.update(sessions => [session, ...sessions]);
    this.saveToStorage();
  }

  deleteLiveSession(id: string) {
    this.liveSessions.update(sessions => sessions.filter(s => s.id !== id));
    this.saveToStorage();
  }
  
  startLiveSession(sessionId: string) {
    this.liveSessions.update(sessions => 
      sessions.map(s => s.id === sessionId ? { ...s, status: 'live', scheduledTime: new Date().toISOString() } : s)
    );
    this.saveToStorage();
  }

  endLiveSession(sessionId: string) {
    this.liveSessions.update(sessions => 
      sessions.map(s => s.id === sessionId && s.status === 'live' ? { ...s, status: 'ended' } : s)
    );
    this.saveToStorage();
  }

  archiveEndedLiveSessions() {
    this.updateLiveSessionStatuses();
    const now = new Date().getTime();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);

    const sessionsToArchive = this.liveSessions().filter(s => {
      const endTime = new Date(s.scheduledTime).getTime() + s.durationMinutes * 60000;
      return s.status === 'ended' && !s.isArchived && endTime < twentyFourHoursAgo;
    });

    if (sessionsToArchive.length === 0) return;

    const existingVideoSessionIds = new Set(this.videoLectures().map(v => v.originatingLiveSessionId));
    
    const newVideos: VideoLecture[] = [];
    sessionsToArchive.forEach(session => {
      if (!existingVideoSessionIds.has(session.id)) {
        const minutes = session.durationMinutes % 60;
        const hours = Math.floor(session.durationMinutes / 60);
        const durationString = `${hours}:${minutes.toString().padStart(2, '0')}`;

        newVideos.push({
          id: `vid-from-${session.id}`,
          title: `[RECORDING] ${session.title}`,
          description: `Archived recording of the live session held on ${new Date(session.scheduledTime).toLocaleDateString()}. ${session.description}`,
          topic: session.topic,
          city: 'Online',
          instructor: session.instructor,
          thumbnailUrl: session.thumbnailUrl,
          videoUrl: session.videoUrl,
          duration: durationString,
          isPremium: true, // Archived sessions are always premium
          originatingLiveSessionId: session.id,
          pdfUrl: session.pdfUrl,
          price: session.price,
          externalLink: session.pdfUrl,
          linkText: 'Download Session PDF'
        });
      }
    });

    if (newVideos.length > 0) {
      this.videoLectures.update(current => [...newVideos, ...current]);
    }

    this.liveSessions.update(sessions =>
      sessions.map(s => {
        if (sessionsToArchive.some(ats => ats.id === s.id)) {
          return { ...s, isArchived: true };
        }
        return s;
      })
    );

    this.saveToStorage();
  }

  addQuery(query: Query) {
    this.queries.update(qs => [query, ...qs]);
    this.saveToStorage();
  }

  answerQuery(id: string, answer: string) {
    this.queries.update(qs => qs.map(q => q.id === id ? { ...q, answer } : q));
    this.saveToStorage();
  }

  updateTeacherCommission(teacherId: string, newRate: number) {
    this.teachers.update(teachers => 
      teachers.map(t => t.id === teacherId ? { ...t, commissionRate: newRate } : t)
    );
    this.saveToStorage();
  }

  recordTransaction(email: string, amount: number) {
    const transaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      userEmail: email,
      amount,
      status: 'Success',
      date: new Date().toISOString().split('T')[0],
    };
    this.transactions.update(transactions => [transaction, ...transactions]);
    this.logActivity(email, 'Purchase');
    this.saveToStorage();
  }

  logActivity(email: string, action: 'Sign In' | 'Sign Out' | 'Purchase' | 'Upload') {
    const log: ActivityLog = {
      id: Math.random().toString(36).substr(2, 9),
      userEmail: email,
      action: action,
      timestamp: new Date().toISOString(),
      ip: '127.0.0.1' // Mock IP
    };
    this.activityLogs.update(logs => [log, ...logs]);
    this.saveToStorage();
  }
}