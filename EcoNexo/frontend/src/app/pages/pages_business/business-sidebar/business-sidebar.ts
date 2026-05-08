import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-business-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './business-sidebar.html',
  styleUrl: './business-sidebar.css',
})
export class BusinessSidebar implements OnInit {
  @Input() businessName = '';
  @Output() logout = new EventEmitter<void>();

  isOpen = false;

  ngOnInit(): void {
    // FIX: Forzar cierre del sidebar al iniciar (prevenir bugs en móvil/tablet)
    this.isOpen = false;
    console.log('[BUSINESS-SIDEBAR] ngOnInit - isOpen:', this.isOpen);
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    console.log('[BUSINESS-SIDEBAR] toggle - isOpen:', this.isOpen);
  }

  close(): void {
    this.isOpen = false;
    console.log('[BUSINESS-SIDEBAR] close - isOpen:', this.isOpen);
  }

  onLogout(): void {
    this.close();
    this.logout.emit();
  }
}
