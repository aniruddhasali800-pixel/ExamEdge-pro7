
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './src/app.component';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { routes } from './src/app.routes';
import { inject } from '@vercel/analytics';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withHashLocation())
  ]
}).catch(err => console.error(err));

// Initialize Vercel Web Analytics
inject();

// AI Studio always uses an `index.tsx` file for all project types.
