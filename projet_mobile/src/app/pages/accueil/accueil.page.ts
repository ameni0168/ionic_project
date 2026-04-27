import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  CategoryOption,
  HomeContent,
  HomeFreelancer,
  HomeStat,
  MarketplaceContentService,
} from 'src/app/services/marketplace-content.service';

@Component({
  selector: 'app-accueil',
  templateUrl: './accueil.page.html',
  styleUrls: ['./accueil.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
})
export class AccueilPage implements OnInit {
  showContent = true;
  homeContent: HomeContent;
  homeStats: HomeStat[] = [];
  categories: CategoryOption[] = [];
  freelancers: HomeFreelancer[] = [];
  isLoadingCategories = true;
  isLoadingFreelancers = true;
  isLoadingStats = true;
  searchQuery = '';

  constructor(
    private readonly navCtrl: NavController,
    private readonly router: Router,
    private readonly marketplaceContent: MarketplaceContentService
  ) {
    this.homeContent = this.marketplaceContent.getHomeContent();
  }

  ngOnInit(): void {
    this.homeStats = this.homeContent.stats;
    this.loadStats();
    this.loadCategories();
    this.loadFreelancers();
  }

  goToPostJob() {
    this.router.navigate(['/post-job']);
  }

  goToSignIn() {
    this.router.navigate(['/auth/login']);
  }

  goToSignUp() {
    this.router.navigate(['/welcome']);
  }

  goToFindWork() {
    this.router.navigate(['/jobs']);
  }

  submitSearch() {
    const q = this.searchQuery.trim();

    this.router.navigate(['/jobs'], {
      queryParams: q ? { q } : undefined,
    });
  }

  searchByTag(tag: string) {
    this.searchQuery = tag;
    this.submitSearch();
  }

  goToHireFreelancer() {
    this.router.navigate(['/hire-freelancers']);
  }

  trackByName(_: number, item: { name: string }) {
    return item.name;
  }

  private loadCategories() {
    this.isLoadingCategories = true;
    this.marketplaceContent.getDynamicCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.isLoadingCategories = false;
      },
      error: () => {
        this.isLoadingCategories = false;
      },
    });
  }

  private loadStats() {
    this.isLoadingStats = true;
    this.marketplaceContent.getHomeStats().subscribe({
      next: (stats) => {
        this.homeStats = stats;
        this.isLoadingStats = false;
      },
      error: () => {
        this.homeStats = this.homeContent.stats;
        this.isLoadingStats = false;
      },
    });
  }

  private loadFreelancers() {
    this.isLoadingFreelancers = true;
    this.marketplaceContent.getTopFreelancers().subscribe({
      next: (freelancers) => {
        this.freelancers = freelancers;
        this.isLoadingFreelancers = false;
      },
      error: () => {
        this.isLoadingFreelancers = false;
      },
    });
  }
}
