import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-summary-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './summary-card.html',
  styleUrl: './summary-card.css'
})
export class SummaryCard {

  @Input() title: string = '';
  @Input() value: number = 0;
  @Input() bgColor: string = 'primary';
  @Input() icon: string = '';

}