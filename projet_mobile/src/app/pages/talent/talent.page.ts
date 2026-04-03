import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-talent',
  templateUrl: './talent.page.html',
  styleUrls: ['./talent.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class TalentPage implements OnInit {

  // ── Search ──────────────────────────────────────────────────
  searchQuery    = '';
  discoverOpen   = false;
  selectedDiscover = 'Discover';
  discoverOptions = [
    'Discover',
    'Talent in my area',
    'Top rated',
    'Rising talents',
    'Recently active',
  ];

  // ── Talent local (Tunisia) ───────────────────────────────────
  localTalents = [
    {
      id: 1,
      name:        'Khalil B.',
      title:       'Web Scraping & Big Data Analyst',
      avatar:      'assets/talents/khalil.jpg',
      hourlyRate:  20,
      earned:      null,
      jobSuccess:  null,
      online:      false,
      fav:         false,
    },
    {
      id: 2,
      name:        'Sana M.',
      title:       'React & Vue.js Developer',
      avatar:      'assets/talents/sana.jpg',
      hourlyRate:  25,
      earned:      '$5K+',
      jobSuccess:  88,
      online:      true,
      fav:         false,
    },
    {
      id: 3,
      name:        'Yassine T.',
      title:       'Mobile Developer · Flutter',
      avatar:      'assets/talents/yassine.jpg',
      hourlyRate:  30,
      earned:      '$8K+',
      jobSuccess:  91,
      online:      true,
      fav:         false,
    },
    {
      id: 4,
      name:        'Ines R.',
      title:       'UI/UX Designer & Figma Expert',
      avatar:      'assets/talents/ines.jpg',
      hourlyRate:  22,
      earned:      '$3K+',
      jobSuccess:  85,
      online:      false,
      fav:         false,
    },
  ];

  // ── Talent high Job Success ──────────────────────────────────
  topTalents = [
    {
      id: 10,
      name:        'Kareem M.',
      title:       'Video Editor',
      avatar:      'assets/talents/kareem.jpg',
      hourlyRate:  20,
      earned:      '$10K+',
      jobSuccess:  93,
      online:      true,
      fav:         false,
    },
    {
      id: 11,
      name:        'Sarah J.',
      title:       'Full-Stack Developer',
      avatar:      'assets/talents/sarah.jpg',
      hourlyRate:  85,
      earned:      '$50K+',
      jobSuccess:  98,
      online:      true,
      fav:         false,
    },
    {
      id: 12,
      name:        'Ahmed K.',
      title:       'SEO & Digital Marketing',
      avatar:      'assets/talents/ahmed.jpg',
      hourlyRate:  40,
      earned:      '$20K+',
      jobSuccess:  96,
      online:      false,
      fav:         false,
    },
    {
      id: 13,
      name:        'Maria L.',
      title:       'Copywriter & Content Strategist',
      avatar:      'assets/talents/maria.jpg',
      hourlyRate:  35,
      earned:      '$15K+',
      jobSuccess:  94,
      online:      true,
      fav:         false,
    },
  ];

  // ── Browse by category ──────────────────────────────────────
  browseCategories = [
    {
      name: 'Accounting & Consulting',
      subs: ['Accounting', 'Bookkeeping', 'Business Analysis & Strategy', 'Career Coaching', 'Financial Planning', 'Management Consulting'],
    },
    {
      name: 'Development & IT',
      subs: ['Web Development', 'Mobile Apps', 'DevOps & Cloud', 'Cybersecurity', 'AI & Machine Learning', 'Database Administration'],
    },
    {
      name: 'Design & Creative',
      subs: ['Logo Design', 'UI/UX Design', 'Illustration', 'Video Production', 'Animation', 'Photography'],
    },
    {
      name: 'Sales & Marketing',
      subs: ['Digital Marketing', 'SEO / SEM', 'Social Media', 'Email Marketing', 'Influencer Marketing', 'Lead Generation'],
    },
    {
      name: 'Writing & Translation',
      subs: ['Content Writing', 'Copywriting', 'Translation', 'Proofreading', 'Technical Writing', 'Ghost Writing'],
    },
    {
      name: 'Admin & Customer Support',
      subs: ['Virtual Assistant', 'Data Entry', 'Customer Service', 'Project Management', 'Online Research'],
    },
  ];
  menu: any;

  constructor(private router: Router) {}

  ngOnInit() {
    // TODO: charger depuis vos services
  }
  openMenu() {
    this.menu.open(); // ouvre le menu latéral
  }

  // ── Search ──────────────────────────────────────────────────
  onSearch() {
    if (!this.searchQuery.trim()) return;
    this.router.navigate(['/talent/search'], {
      queryParams: { q: this.searchQuery.trim() },
    });
  }

  toggleDiscover() { this.discoverOpen = !this.discoverOpen; }

  selectDiscover(opt: string) {
    this.selectedDiscover = opt;
    this.discoverOpen = false;
    // TODO: filtrer les résultats selon opt
  }

  // ── Navigation ───────────────────────────────────────────────
  goTo(path: string) { this.router.navigate([path]); }


  /**
   * Navigue vers le profil du talent.
   * La page de profil sera /talent-profile/:id
   */
  goToProfile(talent: any) {
    this.router.navigate(['/talent-profile', talent.id], { state: { talent } });
  }

  // ── Favoris ─────────────────────────────────────────────────
  toggleFav(event: Event, talent: any) {
    event.stopPropagation();
    talent.fav = !talent.fav;
    // TODO: appeler votre service favoris
  }

  // ── See more ─────────────────────────────────────────────────
  seeMoreLocal()    { this.router.navigate(['/talent/local']);    }
  seeMoreProfiles() { this.router.navigate(['/talent/top-rated']); }

  // ── Browse category ──────────────────────────────────────────
  selectBrowseCategory(cat: any) {
    this.router.navigate(['/talent'], { queryParams: { category: cat.name } });
  }

  searchBySubCategory(sub: string) {
    this.router.navigate(['/talent/search'], { queryParams: { q: sub } });
  }

}