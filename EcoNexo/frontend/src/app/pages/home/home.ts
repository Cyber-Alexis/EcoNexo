import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BusinessService } from '../../core/services/business.service';
import { ApiBusinessListItem } from '../../core/models/business.model';

@Component({
  selector: 'app-home',
  imports: [RouterLink, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  businesses: ApiBusinessListItem[] = [];

  constructor(private businessService: BusinessService) {}

  ngOnInit() {
    this.businessService.getAll().subscribe({
      next: (data) => {
        this.businesses = data.slice(0, 4);
      },
    });
  }

  businessImage(b: ApiBusinessListItem): string {
    return b.images?.[0]?.path ?? 'https://placehold.co/500x300?text=Sin+imagen';
  }
}

