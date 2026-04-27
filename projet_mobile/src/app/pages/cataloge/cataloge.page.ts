// src/app/pages/catalog/catalog.page.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { CatalogService } from '../../services/catalog.service';
import { MarketplaceContentService } from '../../services/marketplace-content.service';

@Component({
  selector:    'app-catalog',
  templateUrl: './cataloge.page.html',
  styleUrls:  ['./cataloge.page.scss'],
  standalone:  true,
  imports:    [CommonModule, FormsModule, IonicModule],
})
export class CatalogPage implements OnInit, OnDestroy {

  private destroy$      = new Subject<void>();
  private searchSubject = new Subject<string>();

  // ── Loading ───────────────────────────────────────────────────
  isLoadingFeatured = true;
  isLoadingSearch   = false;

  // ── Search / Filter ───────────────────────────────────────────
  searchQuery  = '';
  isSearchMode = false;
  showFilters  = false;

  filters = {
    category:      '',
    min_price:     null as number | null,
    max_price:     null as number | null,
    delivery_time: '',
    sort:          'popular',
  };

  sortOptions = [
    { value: 'popular',    label: 'Les plus populaires' },
    { value: 'rating',     label: 'Mieux notés'         },
    { value: 'price_asc',  label: 'Prix croissant'      },
    { value: 'price_desc', label: 'Prix décroissant'    },
    { value: 'newest',     label: 'Plus récents'        },
  ];

  categories: string[] = [];

  activeFiltersCount = 0;

  // ── Data ──────────────────────────────────────────────────────
  featuredGigs:  any[] = [];
  searchResults: any[] = [];
  searchTotal   = 0;
  searchPage    = 1;
  hasMore       = false;

  constructor(
    private catalogSvc: CatalogService,
    private marketplaceContent: MarketplaceContentService,
    private navCtrl:    NavController,
  ) {}

  ngOnInit() {
    this._loadCategories();
    this._loadFeatured();
    this._setupDebounce();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── FEATURED ──────────────────────────────────────────────────
  private _loadFeatured() {
    this.isLoadingFeatured = true;
    this.catalogSvc.getFeatured(6).subscribe({
      next:  (res: any) => { this.featuredGigs = res.gigs || []; this.isLoadingFeatured = false; },
      error: ()         => { this.isLoadingFeatured = false; },
    });
  }

  private _loadCategories() {
    this.marketplaceContent.getDynamicCategories(8).subscribe({
      next: (categories) => {
        this.categories = categories.map((category) => category.name);
      },
      error: () => {
        this.categories = [];
      },
    });
  }

  // ── DEBOUNCE ──────────────────────────────────────────────────
  private _setupDebounce() {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(q => {
      if (q.trim().length >= 2) { this.isSearchMode = true; this._doSearch(true); }
      else if (!q.trim())       { this.clearSearch(); }
    });
  }

  // ── SEARCH ────────────────────────────────────────────────────
  onSearchInput() { this.searchSubject.next(this.searchQuery); }

  onSearch() {
    if (!this.searchQuery.trim()) { this.clearSearch(); return; }
    this.isSearchMode = true;
    this._doSearch(true);
  }

   _doSearch(reset = false) {
    if (reset) { this.searchPage = 1; this.searchResults = []; }
    this.isLoadingSearch = true;

    this.catalogSvc.listGigs({
      q:             this.searchQuery.trim() || undefined,
      category:      this.filters.category      || undefined,
      min_price:     this.filters.min_price      || undefined,
      max_price:     this.filters.max_price      || undefined,
      delivery_time: this.filters.delivery_time  || undefined,
      sort:          this.filters.sort,
      page:          this.searchPage,
      per_page:      10,
    }).subscribe({
      next: (res: any) => {
        this.isLoadingSearch = false;
        const items = res.gigs || [];
        this.searchResults = reset ? items : [...this.searchResults, ...items];
        this.searchTotal   = res.total || 0;
        this.hasMore       = this.searchPage < (res.pages || 1);
      },
      error: () => { this.isLoadingSearch = false; },
    });
  }

  clearSearch() {
    this.searchQuery   = '';
    this.isSearchMode  = false;
    this.searchResults = [];
    this.searchTotal   = 0;
    this.hasMore       = false;
  }

  loadMore() { this.searchPage++; this._doSearch(false); }

  // ── FILTERS ───────────────────────────────────────────────────
  toggleFilters() { this.showFilters = !this.showFilters; }

  applyFilters() {
    this.showFilters   = false;
    this.isSearchMode  = true;
    this._countFilters();
    this._doSearch(true);
  }

  resetFilters() {
    this.filters = { category: '', min_price: null, max_price: null, delivery_time: '', sort: 'popular' };
    this.activeFiltersCount = 0;
    this.showFilters = false;
    if (this.searchQuery.trim()) this._doSearch(true);
    else this.clearSearch();
  }

  selectCategory(cat: string) {
    this.filters.category = cat;
    this.isSearchMode     = true;
    this.searchQuery      = '';
    this._countFilters();
    this._doSearch(true);
  }

  private _countFilters() {
    let n = 0;
    if (this.filters.category)      n++;
    if (this.filters.min_price)     n++;
    if (this.filters.max_price)     n++;
    if (this.filters.delivery_time) n++;
    if (this.filters.sort !== 'popular') n++;
    this.activeFiltersCount = n;
  }

  // ── NAVIGATION ────────────────────────────────────────────────
  viewGig(gig: any) {
    this.navCtrl.navigateForward(['/service-details', gig.id], { state: { gig } });
  }

  goTo(path: string) { this.navCtrl.navigateForward([path]); }

  // ── HELPERS ───────────────────────────────────────────────────
  getStars(rating: number): any[] { return Array(Math.min(5, Math.round(rating || 0))); }
}
