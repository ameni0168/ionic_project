import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CatalogService } from './catalog.service';
import { FreelancerService } from './freelancer.service';
import { JobService } from './job.service';

export interface CategoryOption {
  name: string;
  icon: string;
  count: number;
}

export interface HomeStep {
  number: string;
  icon: string;
  title: string;
  description: string;
}

export interface HomeStat {
  value: string;
  label: string;
}

export interface HomeFreelancer {
  id: string;
  initials: string;
  name: string;
  title: string;
  tags: string[];
  rate: string;
  rating: string;
  reviews: number;
}

export interface HomeContent {
  heroBadge: string;
  heroTitlePrefix: string;
  heroTitleAccent: string;
  heroSubtitle: string;
  searchPlaceholder: string;
  popularTags: string[];
  stats: HomeStat[];
  steps: HomeStep[];
  ctaTitle: string;
  ctaAccent: string;
  ctaSubtitle: string;
}

@Injectable({
  providedIn: 'root',
})
export class MarketplaceContentService {
  private readonly fallbackCategories: Array<{ name: string; icon: string }> = [
    { name: 'Development', icon: 'code-slash-outline' },
    { name: 'Design', icon: 'color-palette-outline' },
    { name: 'Marketing', icon: 'megaphone-outline' },
    { name: 'Writing', icon: 'create-outline' },
    { name: 'Video', icon: 'videocam-outline' },
    { name: 'Data', icon: 'bar-chart-outline' },
    { name: 'Finance', icon: 'cash-outline' },
    { name: 'Mobile Apps', icon: 'phone-portrait-outline' },
  ];

  constructor(
    private readonly jobService: JobService,
    private readonly catalogService: CatalogService,
    private readonly freelancerService: FreelancerService
  ) {}

  getHomeContent(): HomeContent {
    return {
      heroBadge: 'Trusted by growing teams worldwide',
      heroTitlePrefix: 'Find the perfect',
      heroTitleAccent: 'freelance talent',
      heroSubtitle: 'Connect with skilled professionals, publish an offer, and launch your project faster.',
      searchPlaceholder: 'Search for a skill or service...',
      popularTags: ['Web Dev', 'UI Design', 'Mobile', 'Data'],
      stats: [
        { value: '50K+', label: 'Freelancers' },
        { value: '12K+', label: 'Jobs Posted' },
        { value: '98%', label: 'Satisfaction' },
      ],
      steps: [
        { number: '01', icon: 'document-text-outline', title: 'Post a Job', description: 'Describe your project and set a budget in a few minutes.' },
        { number: '02', icon: 'search-outline', title: 'Review Proposals', description: 'Compare qualified freelancers and explore their profiles.' },
        { number: '03', icon: 'chatbubbles-outline', title: 'Collaborate', description: 'Discuss details, share files, and track the work.' },
        { number: '04', icon: 'shield-checkmark-outline', title: 'Pay Securely', description: 'Release payment only when the work matches your expectations.' },
      ],
      ctaTitle: 'Ready to get',
      ctaAccent: 'started?',
      ctaSubtitle: 'Thousands of companies and freelancers are already growing with us.',
    };
  }

  getHomeStats(): Observable<HomeStat[]> {
    return forkJoin({
      jobs: this.jobService.getAllJobs().pipe(catchError(() => of({ jobs: [] }))),
      gigs: this.catalogService
        .listGigs({ page: 1, per_page: 1 })
        .pipe(catchError(() => of({ gigs: [] }))),
      freelancers: this.freelancerService
        .searchTalents({ page: 1, per_page: 1 })
        .pipe(catchError(() => of({ freelancers: [] }))),
    }).pipe(
      map(({ jobs, gigs, freelancers }) => {
        const jobsList = jobs?.jobs || [];
        const openJobs = jobsList.filter((job: any) => job?.status === 'open').length;
        const freelancersTotal = Number(freelancers?.total ?? freelancers?.freelancers?.length ?? 0);
        const gigsTotal = Number(gigs?.total ?? gigs?.gigs?.length ?? 0);

        return [
          { value: this.formatCount(freelancersTotal), label: 'Freelancers' },
          { value: this.formatCount(openJobs), label: 'Open Jobs' },
          { value: this.formatCount(gigsTotal), label: 'Services' },
        ];
      }),
      catchError(() =>
        of([
          { value: '0', label: 'Freelancers' },
          { value: '0', label: 'Open Jobs' },
          { value: '0', label: 'Services' },
        ])
      )
    );
  }

  getDynamicCategories(limit = 8): Observable<CategoryOption[]> {
    return forkJoin({
      jobs: this.jobService.getAllJobs().pipe(catchError(() => of({ jobs: [] }))),
      gigs: this.catalogService.listGigs({ page: 1, per_page: 50 }).pipe(catchError(() => of({ gigs: [] }))),
    }).pipe(
      map(({ jobs, gigs }) => {
        const counts = new Map<string, number>();

        for (const job of jobs?.jobs || []) {
          const category = this.normalizeCategory(job?.category);
          if (category) {
            counts.set(category, (counts.get(category) || 0) + 1);
          }
        }

        for (const gig of gigs?.gigs || []) {
          const category = this.normalizeCategory(gig?.category);
          if (category) {
            counts.set(category, (counts.get(category) || 0) + 1);
          }
        }

        const items = Array.from(counts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, limit)
          .map(([name, count]) => ({
            name,
            count,
            icon: this.resolveCategoryIcon(name),
          }));

        if (items.length > 0) {
          return items;
        }

        return this.fallbackCategories.slice(0, limit).map((category, index) => ({
          ...category,
          count: Math.max(1, this.fallbackCategories.length - index),
        }));
      })
    );
  }

  getTopFreelancers(limit = 4): Observable<HomeFreelancer[]> {
    return this.freelancerService.getTopRated().pipe(
      map((response) =>
        (response?.freelancers || []).slice(0, limit).map((freelancer: any) => ({
          id: freelancer.id || '',
          initials: this.buildInitials(freelancer.full_name),
          name: freelancer.full_name || 'Freelancer',
          title: freelancer.title || 'Freelancer',
          tags: (freelancer.skills || []).slice(0, 3),
          rate: `$${freelancer.hourly_rate || 0}`,
          rating: Number(freelancer.stats?.rating || 0).toFixed(1),
          reviews: Number(freelancer.stats?.review_count || 0),
        }))
      ),
      catchError(() =>
        of([
          {
            id: '',
            initials: 'SM',
            name: 'Sarah M.',
            title: 'Full Stack Developer',
            tags: ['React', 'Node.js', 'AWS'],
            rate: '$85',
            rating: '4.9',
            reviews: 142,
          },
          {
            id: '',
            initials: 'CR',
            name: 'Carlos R.',
            title: 'UI/UX Designer',
            tags: ['Figma', 'Branding', 'Motion'],
            rate: '$70',
            rating: '5.0',
            reviews: 98,
          },
          {
            id: '',
            initials: 'AK',
            name: 'Ahmed K.',
            title: 'Data Scientist',
            tags: ['Python', 'ML', 'SQL'],
            rate: '$95',
            rating: '4.8',
            reviews: 76,
          },
          {
            id: '',
            initials: 'LT',
            name: 'Lea T.',
            title: 'Mobile Developer',
            tags: ['Flutter', 'Ionic', 'Firebase'],
            rate: '$80',
            rating: '4.9',
            reviews: 110,
          },
        ])
      )
    );
  }

  private normalizeCategory(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private resolveCategoryIcon(categoryName: string): string {
    const normalized = categoryName.toLowerCase();

    if (normalized.includes('design')) return 'color-palette-outline';
    if (normalized.includes('market')) return 'megaphone-outline';
    if (normalized.includes('write') || normalized.includes('translation')) return 'create-outline';
    if (normalized.includes('video') || normalized.includes('animation')) return 'videocam-outline';
    if (normalized.includes('data') || normalized.includes('analytics')) return 'bar-chart-outline';
    if (normalized.includes('finance') || normalized.includes('account')) return 'cash-outline';
    if (normalized.includes('mobile') || normalized.includes('app')) return 'phone-portrait-outline';
    if (normalized.includes('ai')) return 'hardware-chip-outline';
    return 'code-slash-outline';
  }

  private buildInitials(fullName: string): string {
    const words = (fullName || '')
      .split(' ')
      .map((word) => word.trim())
      .filter(Boolean)
      .slice(0, 2);

    if (words.length === 0) {
      return 'FH';
    }

    return words.map((word) => word[0].toUpperCase()).join('');
  }

  private formatCount(value: number): string {
    if (!Number.isFinite(value) || value <= 0) {
      return '0';
    }

    if (value >= 1000) {
      const shortened = value / 1000;
      return `${Number.isInteger(shortened) ? shortened : shortened.toFixed(1)}K+`;
    }

    return `${value}+`;
  }
}
