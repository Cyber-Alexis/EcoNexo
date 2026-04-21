import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-business-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './business-sidebar.html',
  styleUrl: './business-sidebar.css',
})
export class BusinessSidebar {
  @Input() businessName = '';
  @Output() logout = new EventEmitter<void>();

  isOpen = false;

  toggle(): void {
    this.isOpen = !this.isOpen;
  }

  close(): void {
    this.isOpen = false;
  }

  onLogout(): void {
    this.close();
    this.logout.emit();
  }
}
