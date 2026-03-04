import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';

import { AuthUserService } from '../../../core/auth/auth-user.service';
import { AuthMeResponse } from '../../../core/auth/auth-user.model';
import { AuthService } from '../../../core/auth/auth.service';

type SidebarPreferenceKey = 'compactSidebar' | 'reduceMotion' | 'confirmLogout';
type SidebarPreferences = Record<SidebarPreferenceKey, boolean>;

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent {
  private readonly preferencesStorageKey = 'frotapro.sidebar.preferences';

  user$!: Observable<AuthMeResponse | null>;
  settingsOpen = false;
  prefs: SidebarPreferences = {
    compactSidebar: false,
    reduceMotion: false,
    confirmLogout: true,
  };

  open = {
    oficina: true,
    integracoes: false,
    administracao: false,
  };

  constructor(
    public authUser: AuthUserService,
    private authService: AuthService,
    private router: Router,
  ) {
    this.user$ = this.authUser.user$;
    this.loadPreferences();
  }

  toggle(key: keyof typeof this.open) {
    this.open[key] = !this.open[key];
  }

  togglePreferences(event: MouseEvent): void {
    event.stopPropagation();
    this.settingsOpen = !this.settingsOpen;
  }

  updatePreference(key: SidebarPreferenceKey, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.prefs = { ...this.prefs, [key]: checked };
    this.persistPreferences();
    this.applyPreferences();
  }

  resetPreferences(): void {
    this.prefs = {
      compactSidebar: false,
      reduceMotion: false,
      confirmLogout: true,
    };
    this.persistPreferences();
    this.applyPreferences();
  }

  logout() {
    if (this.prefs.confirmLogout) {
      const confirmed = window.confirm('Deseja realmente sair da sua conta?');
      if (!confirmed) return;
    }

    this.authService.logout().subscribe({
      next: () => {
        this.authUser.clear();
        this.settingsOpen = false;
        this.router.navigate(['/login'], { replaceUrl: true });
      },
      error: () => {
        this.authUser.clear();
        this.settingsOpen = false;
        this.router.navigate(['/login'], { replaceUrl: true });
      },
    });
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.settingsOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.settingsOpen = false;
  }

  private loadPreferences(): void {
    const raw = localStorage.getItem(this.preferencesStorageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<SidebarPreferences>;
        this.prefs = {
          compactSidebar: !!parsed.compactSidebar,
          reduceMotion: !!parsed.reduceMotion,
          confirmLogout: parsed.confirmLogout !== false,
        };
      } catch {
        this.prefs = {
          compactSidebar: false,
          reduceMotion: false,
          confirmLogout: true,
        };
      }
    }

    this.applyPreferences();
  }

  private applyPreferences(): void {
    document.body.classList.toggle('reduce-motion', this.prefs.reduceMotion);
  }

  private persistPreferences(): void {
    localStorage.setItem(this.preferencesStorageKey, JSON.stringify(this.prefs));
  }
}
