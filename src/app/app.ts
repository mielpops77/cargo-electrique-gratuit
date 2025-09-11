import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/header/header';
import { Hero } from './shared/hero/hero';
import { Demande } from './shared/demande/demande';
import { Etapes } from './shared/etapes/etapes';
import { Faq } from './shared/faq/faq';

@Component({
  selector: 'ceg-root',
  imports: [RouterOutlet, HeaderComponent, Hero, Demande, Etapes, Faq],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('cargo-electrique-gratuit-spa');
}
