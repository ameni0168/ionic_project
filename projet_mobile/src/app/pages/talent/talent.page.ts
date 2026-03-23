// src/app/pages/talent/talent.page.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { TalentService } from 'src/app/services/talent.service';

@Component({
  selector:    'app-talent',
  templateUrl: './talent.page.html',
  styleUrls:  ['./talent.page.scss'],
  standalone:  true,
  imports:    [CommonModule, FormsModule, IonicModule],
})
export class TalentPage implements OnInit, OnDestroy {

  // ── Expose Math pour le template ──────────────────────────────
  readonly Math = Math;

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // ── Loading states ────────────────────────────────────────────
  isLoadingLocal    = true;
  isLoadingTop      = true;
  isLoadingSearch   = false;

  // ── Search ────────────────────────────────────────────────────
  searchQuery      = '';
  isSearchMode     = false;   // true quand l'user a tapé quelque chose
  searchResults:   any[] = [];
  searchTotal      = 0;
  searchPage       = 1;
  hasMoreResults   = false;

  // ── Discover dropdown ─────────────────────────────────────────
  discoverOpen     = false;
  selectedDiscover = 'Discover';
  discoverOptions  = ['Discover', 'Talent in my area', 'Top rated', 'Rising talents', 'Recently active'];

  // ── Filter panel ──────────────────────────────────────────────
  showFilters      = false;
  filters = {
    category:       '',
    min_rate:       null as number | null,
    max_rate:       null as number | null,
    available_only: false,
    sort:           'rating' as 'rating' | 'rate_asc' | 'rate_desc' | 'newest' | 'top_success',
  };
  sortOptions: { value: 'rating' | 'rate_asc' | 'rate_desc' | 'newest' | 'top_success', label: string }[] = [
    { value: 'rating',      label: 'Mieux notés'    },
    { value: 'top_success', label: 'Top Success'    },
    { value: 'rate_asc',    label: 'Prix croissant' },
    { value: 'rate_desc',   label: 'Prix décroissant'},
    { value: 'newest',      label: 'Plus récents'   },
  ];
  activeFiltersCount = 0;

  // ── Local talents ────────────────────────────────────────────
  localTalents: any[] = [];

  // ── Top rated talents ────────────────────────────────────────
  topTalents: any[] = [];

  // ── Browse categories ────────────────────────────────────────
  browseCategories = [
    {
      name: 'Accounting & Consulting',
      subs: ['Accounting', 'Bookkeeping', 'Business Analysis & Strategy', 'Career Coaching', 'Financial Planning'],
    },
    {
      name: 'Development & IT',
      subs: ['Web Development', 'Mobile Apps', 'DevOps & Cloud', 'Cybersecurity', 'AI & Machine Learning'],
    },
    {
      name: 'Design & Creative',
      subs: ['Logo Design', 'UI/UX Design', 'Illustration', 'Video Production', 'Animation'],
    },
    {
      name: 'Sales & Marketing',
      subs: ['Digital Marketing', 'SEO / SEM', 'Social Media', 'Email Marketing', 'Lead Generation'],
    },
    {
      name: 'Writing & Translation',
      subs: ['Content Writing', 'Copywriting', 'Translation', 'Proofreading', 'Technical Writing'],
    },
    {
      name: 'Admin & Customer Support',
      subs: ['Virtual Assistant', 'Data Entry', 'Customer Service', 'Project Management'],
    },
  ];

  constructor(
    private talentSvc: TalentService,
    private navCtrl:   NavController,
  ) {}

  // ── LIFECYCLE ─────────────────────────────────────────────────
  ngOnInit() {
    this._loadLocalTalents();
    this._loadTopRated();
    this._setupSearchDebounce();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── SETUP DEBOUNCE SEARCH (auto-search pendant la frappe) ────
  private _setupSearchDebounce() {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(q => {
      if (q.trim().length >= 2) {
        this.isSearchMode = true;
        this._doSearch(q.trim(), true);
      } else if (q.trim().length === 0) {
        this.isSearchMode = false;
        this.searchResults = [];
      }
    });
  }

  // ── CHARGER TALENTS LOCAUX ────────────────────────────────────
  private _loadLocalTalents() {
    this.isLoadingLocal = true;
    this.talentSvc.getLocalTalents('Tunisia').subscribe({
      next: (res: any) => {
        this.isLoadingLocal = false;
        this.localTalents   = this._map(res.talents || []);
      },
      error: () => { this.isLoadingLocal = false; },
    });
  }

  // ── CHARGER TOP RATED ─────────────────────────────────────────
  private _loadTopRated() {
    this.isLoadingTop = true;
    this.talentSvc.getTopRated().subscribe({
      next: (res: any) => {
        this.isLoadingTop = false;
        this.topTalents   = this._map(res.talents || []);
      },
      error: () => { this.isLoadingTop = false; },
    });
  }

  // ── SEARCH (depuis bouton ou debounce) ────────────────────────
  onSearchInput() {
    this.searchSubject.next(this.searchQuery);
  }

  onSearch() {
    const q = this.searchQuery.trim();
    if (!q) {
      this.clearSearch();
      return;
    }
    this.isSearchMode = true;
    this._doSearch(q, true);
  }

  private _doSearch(q: string, reset = false) {
    if (reset) {
      this.searchPage    = 1;
      this.searchResults = [];
    }
    this.isLoadingSearch = true;

    this.talentSvc.searchTalents({
      q,
      category:       this.filters.category       || undefined,
      min_rate:       this.filters.min_rate        || undefined,
      max_rate:       this.filters.max_rate        || undefined,
      available_only: this.filters.available_only  || undefined,
      sort:           this.filters.sort,
      page:           this.searchPage,
      per_page:       10,
    }).subscribe({
      next: (res: any) => {
        this.isLoadingSearch = false;
        const mapped = this._map(res.talents || []);
        this.searchResults  = reset ? mapped : [...this.searchResults, ...mapped];
        this.searchTotal    = res.total || 0;
        this.hasMoreResults = this.searchPage < (res.pages || 1);
      },
      error: () => { this.isLoadingSearch = false; },
    });
  }

  clearSearch() {
    this.searchQuery   = '';
    this.isSearchMode  = false;
    this.searchResults = [];
    this.searchTotal   = 0;
    this.hasMoreResults= false;
  }

  loadMore() {
    this.searchPage++;
    this._doSearch(this.searchQuery.trim(), false);
  }

  // ── FILTRES ───────────────────────────────────────────────────
  toggleFilters() { this.showFilters = !this.showFilters; }

  applyFilters() {
    this.showFilters = false;
    this._countActiveFilters();
    if (this.searchQuery.trim()) {
      this._doSearch(this.searchQuery.trim(), true);
    } else {
      // Recherche avec filtres seulement
      this.isSearchMode = true;
      this._doSearch('', true);
    }
  }

  resetFilters() {
    this.filters = { category: '', min_rate: null, max_rate: null, available_only: false, sort: 'rating' };
    this.activeFiltersCount = 0;
    this.showFilters = false;
    if (this.searchQuery.trim()) {
      this._doSearch(this.searchQuery.trim(), true);
    } else {
      this.clearSearch();
    }
  }

  private _countActiveFilters() {
    let count = 0;
    if (this.filters.category)       count++;
    if (this.filters.min_rate)       count++;
    if (this.filters.max_rate)       count++;
    if (this.filters.available_only) count++;
    if (this.filters.sort !== 'rating') count++;
    this.activeFiltersCount = count;
  }

  // ── DISCOVER DROPDOWN ─────────────────────────────────────────
  toggleDiscover() { this.discoverOpen = !this.discoverOpen; }

  selectDiscover(opt: string) {
    this.selectedDiscover = opt;
    this.discoverOpen     = false;
    switch (opt) {
      case 'Top rated':
        this.filters.sort = 'rating';
        this.isSearchMode = true;
        this._doSearch('', true);
        break;
      case 'Talent in my area':
        this._loadLocalTalents();
        this.isSearchMode = false;
        break;
      case 'Recently active':
        this.filters.sort = 'newest';
        this.isSearchMode = true;
        this._doSearch('', true);
        break;
      default:
        this.clearSearch();
        break;
    }
  }

  // ── NAVIGATION VERS PROFIL TALENT ────────────────────────────
  goToProfile(talent: any) {
    // Passe les données du talent via le state de navigation
    // La page talent-profile les récupère via router.getCurrentNavigation()
    this.navCtrl.navigateForward(
      ['/talent-profile', talent.id],
      { state: { talent } }
    );
  }

  // ── BROWSE BY CATEGORY ────────────────────────────────────────
  selectBrowseCategory(cat: any) {
    this.filters.category = cat.name;
    this.isSearchMode     = true;
    this.searchQuery      = '';
    this._doSearch('', true);
    this._countActiveFilters();
    // Scroll vers le haut
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  searchBySubCategory(sub: string) {
    this.searchQuery  = sub;
    this.isSearchMode = true;
    this._doSearch(sub, true);
  }

  seeMoreLocal() {
    this.isSearchMode = true;
    this.searchQuery  = '';
    this.filters      = { ...this.filters, category: '' };
    this.talentSvc.getLocalTalents('Tunisia').subscribe({
      next: (res: any) => {
        this.searchResults  = this._map(res.talents || []);
        this.searchTotal    = res.total || this.searchResults.length;
        this.hasMoreResults = false;
        this.isLoadingSearch = false;
      },
    });
  }

  seeMoreProfiles() {
    this.filters.sort = 'top_success';
    this.isSearchMode = true;
    this._doSearch('', true);
  }

  // ── FAVORIS ───────────────────────────────────────────────────
  toggleFav(event: Event, talent: any) {
    event.stopPropagation();
    talent.fav = !talent.fav;
    // TODO: appeler service favoris
  }

  // ── NAVIGATION TABS ───────────────────────────────────────────
  goTo(path: string) { this.navCtrl.navigateForward([path]); }
  openMenu() {}

  // ── HELPER MAP API → UI ───────────────────────────────────────
  private _map(talents: any[]): any[] {
    return talents.map((t: any) => ({
      id:         t.id || t._id,
      name:       t.full_name    || 'Freelancer',
      title:      t.title        || '',
      avatar:     t.avatar       || '',
      hourlyRate: t.hourly_rate  || 0,
      location:   t.location     || '',
      earned:     t.stats?.total_earned
                    ? '$' + this._fmt(t.stats.total_earned)
                    : null,
      jobSuccess: t.stats?.job_success
                    ? Math.round(t.stats.job_success)
                    : null,
      rating:     t.stats?.rating       || 0,
      reviews:    t.stats?.review_count || 0,
      online:     t.is_available        || false,
      fav:        false,
    }));
  }

  private _fmt(val: number): string {
    return val >= 1000 ? (val / 1000).toFixed(0) + 'K+' : String(val);
  }

  // ── Helpers étoiles (utilisés dans le template) ───────────────
  getStars(rating: number):      any[] { return Array(Math.min(5, Math.round(rating || 0))); }
  getEmptyStars(rating: number): any[] { return Array(5 - Math.min(5, Math.round(rating || 0))); }
}