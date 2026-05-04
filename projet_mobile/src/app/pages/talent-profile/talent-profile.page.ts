// src/app/pages/talent-profile/talent-profile.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { FreelancerService } from 'src/app/services/freelancer.service';
import { ApiService } from 'src/app/services/api.service';
import { ChatService } from 'src/app/services/chat.service';

@Component({
  selector: 'app-talent-profile',
  templateUrl: './talent-profile.page.html',
  styleUrls: ['./talent-profile.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class TalentProfilePage implements OnInit {

  // ── STATE ─────────────────────────────────────────────
  isLoading = true;
  talent: any = null;
  reviews: any[] = [];
  isFav = false;

  defaultSkillBars = [
    { name: 'React', level: 90, color: 'linear-gradient(90deg,#4f6ef7,#8b5cf6)' },
    { name: 'Node.js', level: 85, color: 'linear-gradient(90deg,#4f6ef7,#8b5cf6)' },
    { name: 'TypeScript', level: 88, color: 'linear-gradient(90deg,#06b6d4,#4f6ef7)' },
  ];

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private talentSvc: FreelancerService,
    private router: Router,
    private api: ApiService,
    private chatService: ChatService,
  ) {}

  // ── INIT ─────────────────────────────────────────────
  ngOnInit() {

    const nav = window.history.state;

    // CASE 1: data from navigation
    if (nav?.talent) {
      this.talent = this._enrichTalent(nav.talent);
      this.isLoading = false;

      const id = this.talent?.id;
      if (id) this._loadReviews(id);

      return;
    }

    // CASE 2: load from API
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this._loadFromBackend(id);
    } else {
      this.isLoading = false;
    }
  }

  // ── LOAD PROFILE ─────────────────────────────────────
  private _loadFromBackend(id: string) {
    this.isLoading = true;

    this.talentSvc.getTalentById(id).subscribe({
      next: (res: any) => {

        const freelancer = res?.freelancer || res?.data || res;

        this.talent = this._enrichTalent(freelancer);
        this.reviews = res?.reviews || [];

        this.isLoading = false;

        if (this.talent?.id) {
          this._loadReviews(this.talent.id);
        }
      },

      error: () => {
        this.isLoading = false;
        this.navCtrl.back();
      },
    });
  }

  // ── LOAD REVIEWS ─────────────────────────────────────
  private _loadReviews(talentId: string) {
    if (!talentId) return;

    this.talentSvc.getTalentById(talentId).subscribe({
      next: (res: any) => {

        this.reviews = res?.reviews || [];

        const freelancer = res?.freelancer;

        if (freelancer) {
          this.talent = {
            ...this.talent,
            ...this._enrichTalent(freelancer),
          };
        }
      },
      error: () => {},
    });
  }

  // ── ENRICH DATA ─────────────────────────────────────
  private _enrichTalent(t: any): any {

    if (!t) return null;

    return {
      id: t.id || t._id || null,
      profileId: t.profile_id || t.id || t._id || null,
      userId: t.user_id || t.userId || '',

      name: t.fullName || t.full_name || t.name || 'Freelancer',
      title: t.title || '',
      bio: t.bio || 'Freelancer expérimenté, prêt à prendre en charge votre projet.',
      avatar: t.avatar || '',
      location: t.location || '',

      hourlyRate: t.hourly_rate || t.hourlyRate || 0,
      category: t.category || '',

      skills: t.skills || [],

      isAvailable: t.is_available ?? t.isAvailable ?? true,

      phone: t.phone || '',
      email: t.email || '',

      // STATS
      rating: t.stats?.rating ?? t.rating ?? 0,
      reviews: t.stats?.review_count ?? t.reviews ?? 0,
      totalJobs: t.stats?.total_jobs ?? t.totalJobs ?? 0,
      totalEarned: t.stats?.total_earned ?? t.totalEarned ?? 0,
      jobSuccess: t.stats?.job_success ?? t.jobSuccess ?? 0,

      // SKILLS BARS
      skillBars: t.skill_bars?.length
        ? t.skill_bars
        : (t.skills || []).slice(0, 6).map((s: string, i: number) => ({
            name: s,
            level: 90 - i * 5,
            color: 'linear-gradient(90deg,#4f6ef7,#8b5cf6)',
          })),
    };
  }

  // ── FAVORITES ───────────────────────────────────────
  toggleFav() {
    this.isFav = !this.isFav;
  }

  // ── STARS HELPERS ───────────────────────────────────
  getStars(rating: number): any[] {
    return Array(Math.min(5, Math.round(rating || 0)));
  }

  getEmptyStars(rating: number): any[] {
    return Array(5 - Math.min(5, Math.round(rating || 0)));
  }

  // ── ACTIONS ─────────────────────────────────────────
  goBack() {
    this.navCtrl.back();
  }

  shareProfile() {
    // TODO
  }
//   createConversation(data: any) {
//   return this.http.post('http://localhost:5000/api/chat/conversation', data);
// }

  sendMessage() {
    if (!this.talent?.userId) return;

    const currentUserId = this.chatService.getCurrentUserId();
    if (!currentUserId) return;

    this.chatService.createConversation(currentUserId, this.talent.userId).subscribe({
      next: (res: any) => {
        this.navCtrl.navigateForward(['/chat', res.conversation_id], {
          state: {
            otherUser: {
              id: this.talent.userId,
              name: this.talent.name,
              avatar: this.talent.avatar
            }
          }
        });
      },
      error: () => {
        // fallback UX: rester sur la page si la conversation ne peut pas être initialisée
      }
    });
  }

  hireNow() {
    if (!this.talent?.id) return;

    if (!this.api.isLoggedIn() || this.api.getUserRole() !== 'client') {
      this.router.navigate(['/welcome'], { queryParams: { redirectTo: '/post-job' } });
      return;
    }

    this.navCtrl.navigateForward(['/post-job'], {
      queryParams: {
        talent_id: this.talent.id,
      },
    });
  }
  //Navigation
goTo(path: string)     { this.navCtrl.navigateForward([path]); }
}
