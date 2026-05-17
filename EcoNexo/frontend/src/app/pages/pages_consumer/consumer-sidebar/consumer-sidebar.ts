import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-consumer-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './consumer-sidebar.html',
  styleUrl: './consumer-sidebar.css',
})
export class ConsumerSidebar implements OnInit {
  @Input() userName = '';
  @Output() logout = new EventEmitter<void>();

  isOpen = false;

  ngOnInit(): void {
    // Forzar cierre del sidebar al iniciar (prevenir bugs en móvil/tablet)
    this.isOpen = false;
  }

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
