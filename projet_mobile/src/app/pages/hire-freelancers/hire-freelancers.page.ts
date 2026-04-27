import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { FreelancerService } from 'src/app/services/freelancer.service';
import { MarketplaceContentService } from 'src/app/services/marketplace-content.service';

@Component({
  selector: 'app-hire-freelancers',
  templateUrl: './hire-freelancers.page.html',
  styleUrls: ['./hire-freelancers.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class HireFreelancersPage implements OnInit {
  searchQuery = '';
  selectedCategory = '';
  categories: string[] = [];
  freelancers: any[] = [];
  loading = false;

  constructor(
    private readonly freelancerService: FreelancerService,
    private readonly marketplaceContent: MarketplaceContentService,
    private readonly navCtrl: NavController
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadFreelancers();
  }

  onSearch() {
    this.loadFreelancers();
  }

  selectCategory(category: string) {
    this.selectedCategory = this.selectedCategory === category ? '' : category;
    this.loadFreelancers();
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.loadFreelancers();
  }

  openProfile(freelancer: any) {
    this.navCtrl.navigateForward(['/talent-profile', freelancer.id], {
      state: { talent: freelancer },
    });
  }

  goBack() {
    this.navCtrl.back();
  }

  private loadCategories() {
    this.marketplaceContent.getDynamicCategories(8).subscribe({
      next: (categories) => {
        this.categories = categories.map((category) => category.name);
      },
      error: () => {
        this.categories = [];
      },
    });
  }

  private loadFreelancers() {
    this.loading = true;

    this.freelancerService.searchTalents({
      q: this.searchQuery || undefined,
      category: this.selectedCategory || undefined,
      sort: 'rating',
      per_page: 12,
      page: 1,
    }).subscribe({
      next: (response: any) => {
        this.freelancers = (response?.freelancers || []).map((freelancer: any) => ({
          id: freelancer.id || freelancer._id,
          name: freelancer.full_name || 'Freelancer',
          title: freelancer.title || 'Freelancer',
          avatar: freelancer.avatar || '',
          location: freelancer.location || 'Remote',
          hourlyRate: freelancer.hourly_rate || 0,
          rating: Number(freelancer.stats?.rating || 0).toFixed(1),
          reviews: freelancer.stats?.review_count || 0,
          skills: (freelancer.skills || []).slice(0, 3),
          online: freelancer.is_available || false,
        }));
        this.loading = false;
      },
      error: () => {
        this.freelancers = [];
        this.loading = false;
      },
    });
  }
}
