import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from './shared/footer/footer';
import { Nav } from './shared/nav/nav';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Nav, Footer],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App implements OnInit {
  protected readonly title = signal('ITI-Front');
  private themeService = inject(ThemeService);

  ngOnInit() {
    // Theme service is initialized automatically via constructor
    // This ensures the theme is applied on app load
  }
}
