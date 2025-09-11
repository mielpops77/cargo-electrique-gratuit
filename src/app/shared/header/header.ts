import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'ceg-header',
  imports: [RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})

export class HeaderComponent {
  menuOpen = false;
  toggleMenu() { this.menuOpen = !this.menuOpen; }
  closeMenu() { this.menuOpen = false; }
}