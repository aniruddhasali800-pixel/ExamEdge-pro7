import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-payment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" (click)="close.emit()">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md m-4 p-8 animate-slide-up" (click)="$event.stopPropagation()">
        
        <div class="flex justify-between items-start mb-4">
          <div>
            <h2 class="text-2xl font-bold text-slate-800">Complete Your Purchase</h2>
            <p class="text-slate-500 text-sm">Unlock premium content instantly.</p>
          </div>
          <button (click)="close.emit()" class="text-slate-400 hover:text-slate-600 transition-colors">
             <i class="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div class="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
          <p class="text-sm font-medium text-slate-600">You are purchasing:</p>
          <p class="font-bold text-slate-800">{{ itemName() }}</p>
          <div class="flex justify-between items-center mt-2 pt-2 border-t border-slate-200">
            <span class="font-bold text-slate-500">Total</span>
            <span class="text-xl font-bold text-blue-600">{{ itemPrice() | currency }}</span>
          </div>
        </div>

        <form (ngSubmit)="processPayment()">
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1 uppercase">Card Number</label>
              <div class="relative">
                 <input type="text" class="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" placeholder="0000 0000 0000 0000" required>
                 <i class="fa-solid fa-credit-card absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
              </div>
            </div>
             <div>
              <label class="block text-xs font-bold text-slate-600 mb-1 uppercase">Cardholder Name</label>
              <input type="text" class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" placeholder="John Doe" required>
            </div>
            <div class="grid grid-cols-2 gap-4">
               <div>
                <label class="block text-xs font-bold text-slate-600 mb-1 uppercase">Expiry Date</label>
                <input type="text" class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" placeholder="MM / YY" required>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-600 mb-1 uppercase">CVC</label>
                <input type="text" class="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" placeholder="123" required>
              </div>
            </div>
          </div>
          
          <button type="submit" class="w-full bg-blue-600 text-white font-bold py-3.5 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 mt-8 flex items-center justify-center gap-2">
            <i class="fa-solid fa-lock"></i>
            Pay Securely
          </button>
          
          <p class="text-center text-xs text-slate-400 mt-4">
            Powered by ExamEdge Secure Payments.
          </p>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out forwards;
    }
    .animate-slide-up {
      animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class PaymentModalComponent {
  itemName = input.required<string>();
  itemPrice = input.required<number>();
  close = output<void>();
  paymentSuccess = output<void>();

  processPayment() {
    // In a real app, you'd integrate with a payment gateway here.
    // For this simulation, we'll just emit success.
    console.log(`Processing payment for ${this.itemName()} for $${this.itemPrice()}`);
    this.paymentSuccess.emit();
  }
}
