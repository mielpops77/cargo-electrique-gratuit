import { NgIf } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'ceg-faq',
  imports: [NgIf],
  templateUrl: './faq.html',
  styleUrl: './faq.scss'
})
export class Faq {

  openIndex: number | null = 0; // 1er item ouvert par défaut
  toggle(i: number) {
    this.openIndex = this.openIndex === i ? null : i;
  }
}
