// src/app/pages/talent/talent.page.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { FreelancerService } from 'src/app/services/freelancer.service';

type SortType = 'rating' | 'rate_asc' | 'rate_desc' | 'newest' | 'top_success';

@Component({
  selector: 'app-talent',
  templateUrl: './talent.page.html',
  styleUrls: ['./talent.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class TalentPage implements OnInit, OnDestroy {

  readonly Math = Math;

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // ── LOADING ─────────────────────────────
  isLoadingLocal = true;
  isLoadingTop = true;
  isLoadingSearch = false;

  // ── SEARCH ──────────────────────────────
  searchQuery = '';
  isSearchMode = false;
  searchResults: any[] = [];
  searchTotal = 0;
  searchPage = 1;
  hasMoreResults = false;

  // ── DISCOVER ────────────────────────────
  discoverOpen = false;
  selectedDiscover = 'Discover';

  discoverOptions = [
    'Discover',
    'Talent in my area',
    'Top rated',
    'Recently active'
  ];

  browseCategories = [
  {
    name: 'Development & IT',
    subs: ['Web Development', 'Mobile Apps', 'AI & ML'],
  },
  {
    name: 'Design & Creative',
    subs: ['UI/UX Design', 'Logo Design', 'Video'],
  },
  {
    name: 'Marketing',
    subs: ['SEO', 'Social Media', 'Content Writing'],
  },
  {
    name: 'Business',
    subs: ['Finance', 'Consulting', 'Project Management'],
  }
];

  // ── FILTERS ─────────────────────────────
  showFilters = false;

  filters: {
    category: string;
    min_rate: number | null;
    max_rate: number | null;
    available_only: boolean;
    sort: SortType;
  } = {
    category: '',
    min_rate: null,
    max_rate: null,
    available_only: false,
    sort: 'rating',
  };

  sortOptions: { value: SortType; label: string }[] = [
    { value: 'rating', label: 'Mieux notés' },
    { value: 'top_success', label: 'Top Success' },
    { value: 'rate_asc', label: 'Prix croissant' },
    { value: 'rate_desc', label: 'Prix décroissant' },
    { value: 'newest', label: 'Plus récents' },
  ];

  activeFiltersCount = 0;

  // ── DATA ────────────────────────────────
  localTalents: any[] = [];
  topTalents: any[] = [];

  constructor(
    private talentSvc: FreelancerService,
    private navCtrl: NavController
  ) {}

  // ────────────────────────────────────────
  ngOnInit() {
    this.loadLocal();
    this.loadTop();
    this.setupSearch();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── SEARCH STREAM ───────────────────────
  private setupSearch() {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(q => {

      const query = q.trim();

      if (query.length >= 2) {
        this.isSearchMode = true;
        this.doSearch(query, true);
      }

      if (query.length === 0) {
        this.isSearchMode = false;
        this.searchResults = [];
      }
    });
  }

  onSearchInput() {
    this.searchSubject.next(this.searchQuery);
  }

  onSearch() {
    const q = this.searchQuery.trim();
    if (!q) return this.clearSearch();
    this.isSearchMode = true;
    this.doSearch(q, true);
  }

  // ── MAIN SEARCH ─────────────────────────
  private doSearch(q: string, reset = false) {

    if (reset) {
      this.searchPage = 1;
      this.searchResults = [];
    }

    this.isLoadingSearch = true;

    const params: any = {
      page: this.searchPage,
      per_page: 10,
      sort: this.filters.sort,
    };

    if (q) params.q = q;

    if (this.filters.category) {
      params.category = this.filters.category;
    }

    if (this.filters.min_rate !== null) {
      params.min_rate = this.filters.min_rate;
    }

    if (this.filters.max_rate !== null) {
      params.max_rate = this.filters.max_rate;
    }

    if (this.filters.available_only) {
      params.available_only = true;
    }

    this.talentSvc.searchTalents(params).subscribe({
      next: (res: any) => {

        this.isLoadingSearch = false;

        // ✅ BACKEND FIX: freelancers NOT talents
        const list = res.freelancers || [];

        const mapped = this.map(list);

        this.searchResults = reset
          ? mapped
          : [...this.searchResults, ...mapped];

        this.searchTotal = res.total || 0;
        this.hasMoreResults = this.searchPage < (res.pages || 1);
      },

      error: (err) => {
        console.error('Search error:', err);
        this.isLoadingSearch = false;
      }
    });
  }

  // ── LOCAL TALENTS ───────────────────────
  private loadLocal() {
    this.isLoadingLocal = true;

    this.talentSvc.getLocalTalents('Tunisia').subscribe({
      next: (res: any) => {
        this.isLoadingLocal = false;

        const list = res.freelancers || []; // FIXED

        this.localTalents = this.map(list);
      },
      error: () => this.isLoadingLocal = false,
    });
  }

  // ── TOP TALENTS ─────────────────────────
  private loadTop() {
    this.isLoadingTop = true;

    this.talentSvc.getTopRated().subscribe({
      next: (res: any) => {
        this.isLoadingTop = false;

        const list = res.freelancers || []; // FIXED

        this.topTalents = this.map(list);
      },
      error: () => this.isLoadingTop = false,
    });
  }

  // ── FILTERS ─────────────────────────────
  applyFilters() {
    this.showFilters = false;
    this.countFilters();
    this.doSearch(this.searchQuery.trim(), true);
  }

  resetFilters() {
    this.filters = {
      category: '',
      min_rate: null,
      max_rate: null,
      available_only: false,
      sort: 'rating',
    };

    this.activeFiltersCount = 0;
    this.doSearch('', true);
  }

  private countFilters() {
    let c = 0;
    if (this.filters.category) c++;
    if (this.filters.min_rate !== null) c++;
    if (this.filters.max_rate !== null) c++;
    if (this.filters.available_only) c++;
    if (this.filters.sort !== 'rating') c++;
    this.activeFiltersCount = c;
  }

  // ── DISCOVER ────────────────────────────
  selectDiscover(opt: string) {
    this.selectedDiscover = opt;
    this.discoverOpen = false;

    if (opt === 'Top rated') {
      this.filters.sort = 'rating';
      this.doSearch('', true);
    }

    if (opt === 'Talent in my area') {
      this.loadLocal();
      this.isSearchMode = false;
    }

    if (opt === 'Recently active') {
      this.filters.sort = 'newest';
      this.doSearch('', true);
    }
  }

  // ── PAGINATION ──────────────────────────
  loadMore() {
    this.searchPage++;
    this.doSearch(this.searchQuery.trim(), false);
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchResults = [];
    this.isSearchMode = false;
    this.searchTotal = 0;
  }

  // ── NAVIGATION ──────────────────────────
  goToProfile(talent: any) {
    this.navCtrl.navigateForward(
      ['/talent-profile', talent.id],
      { state: { talent } }
    );
  }

  goTo(path: string) {
    this.navCtrl.navigateForward([path]);
  }

  openMenu() {}

  // ── MAPPING BACKEND → FRONTEND ─────────
  private map(list: any[]) {
    return list.map(t => ({
      id: t.id || t._id,
      name: t.full_name || 'Freelancer',
      title: t.title || '',
      avatar: t.avatar || '',
      hourlyRate: t.hourly_rate || 0,
      location: t.location || '',
      rating: t.stats?.rating || 0,
      reviews: t.stats?.review_count || 0,
      jobSuccess: t.stats?.job_success || 0,
      online: t.is_available || false,
      fav: false,
    }));
  }

  // ── STARS ───────────────────────────────
  getStars(r: number) {
    return Array(Math.max(0, Math.round(r || 0)));
  }

  getEmptyStars(r: number) {
    return Array(Math.max(0, 5 - Math.round(r || 0)));
  }

  // ── UI ──────────────────────────────────
  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  toggleDiscover() {
    this.discoverOpen = !this.discoverOpen;
  }

  toggleFav(event: Event, talent: any) {
    event.stopPropagation();
    talent.fav = !talent.fav;
  }

  seeMoreLocal() {
    this.isSearchMode = true;
    this.isLoadingSearch = true;
    this.searchPage = 1;
    this.hasMoreResults = false;

    this.talentSvc.getLocalTalents('Tunisia').subscribe({
      next: (res: any) => {
        this.isLoadingSearch = false;
        const list = res.freelancers || [];
        this.searchResults = this.map(list);
        this.searchTotal = res.total ?? this.searchResults.length;
        this.hasMoreResults = false;
      },
      error: () => {
        this.isLoadingSearch = false;
      },
    });
  }

  seeMoreProfiles() {
    this.filters.sort = 'top_success';
    this.isSearchMode = true;
    this.doSearch('', true);
  }

  selectBrowseCategory(cat: any) {
    this.filters.category = cat.name;
    this.isSearchMode = true;
    this.searchQuery = '';
    this.doSearch('', true);
    this.countFilters();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  searchBySubCategory(sub: string) {
    this.searchQuery = sub;
    this.isSearchMode = true;
    this.doSearch(sub, true);
  }
}