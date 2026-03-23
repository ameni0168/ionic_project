// src/app/pages/talent-profile/talent-profile.page.ts
import { Component, OnInit }  from '@angular/core';
import { CommonModule }       from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { ActivatedRoute }     from '@angular/router';
import { TalentService }      from 'src/app/services/talent.service';

@Component({
  selector:    'app-talent-profile',
  templateUrl: './talent-profile.page.html',
  styleUrls:  ['./talent-profile.page.scss'],
  standalone:  true,
  imports:    [CommonModule, IonicModule],
})
export class TalentProfilePage implements OnInit {

  // ── State ─────────────────────────────────────────────────────
  isLoading = true;
  talent:   any = null;
  reviews:  any[] = [];
  isFav     = false;

  // Données par défaut si le backend ne les a pas encore
  defaultSkillBars = [
    { name: 'React',      level: 90, color: 'linear-gradient(90deg,#4f6ef7,#8b5cf6)' },
    { name: 'Node.js',    level: 85, color: 'linear-gradient(90deg,#4f6ef7,#8b5cf6)' },
    { name: 'TypeScript', level: 88, color: 'linear-gradient(90deg,#06b6d4,#4f6ef7)' },
  ];

  constructor(
    private route:      ActivatedRoute,
    private navCtrl:    NavController,
    private talentSvc:  TalentService,
  ) {}

  // ── LIFECYCLE ─────────────────────────────────────────────────
  ngOnInit() {
    // 1. Essayer de récupérer les données passées via navigation state
    const nav = window.history.state;
    if (nav?.talent) {
      this.talent   = this._enrichTalent(nav.talent);
      this.isLoading = false;
      // Charger quand même les reviews depuis le backend
      this._loadReviews(nav.talent.id);
    } else {
      // 2. Sinon charger depuis le backend avec l'ID de l'URL
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this._loadFromBackend(id);
      }
    }
  }

  // ── CHARGER DEPUIS LE BACKEND ─────────────────────────────────
  private _loadFromBackend(id: string) {
    this.isLoading = true;
    this.talentSvc.getTalentById(id).subscribe({
      next: (res: any) => {
        this.talent   = this._enrichTalent(res.talent);
        this.reviews  = res.reviews  || [];
        this.isLoading = false;
      },
      error: (err: any) => {
        this.isLoading = false;
        if (err.status === 404) {
          this.navCtrl.back();
        }
      },
    });
  }

  private _loadReviews(talentId: string) {
    this.talentSvc.getTalentById(talentId).subscribe({
      next: (res: any) => {
        this.reviews = res.reviews || [];
        // Mettre à jour les stats avec les données fraîches
        if (res.talent) {
          this.talent = { ...this.talent, ...this._enrichTalent(res.talent) };
        }
      },
      error: () => {},
    });
  }

  // ── ENRICHIR LES DONNÉES TALENT ───────────────────────────────
  // Normalise les données venant du backend ou du navigation state
  private _enrichTalent(t: any): any {
    return {
      id:           t.id       || t._id,
      name:         t.full_name || t.name || 'Freelancer',
      title:        t.title        || '',
      bio:          t.bio          || 'Freelancer expérimenté, prêt à prendre en charge votre projet.',
      avatar:       t.avatar       || '',
      location:     t.location     || '',
      hourlyRate:   t.hourly_rate  || t.hourlyRate  || 0,
      category:     t.category     || '',
      skills:       t.skills       || [],
      isAvailable:  t.is_available ?? t.isAvailable ?? true,
      phone:        t.phone        || '',
      email:        t.email        || '',

      // Stats
      rating:       t.stats?.rating       ?? t.rating       ?? 0,
      reviews:      t.stats?.review_count ?? t.reviews      ?? 0,
      totalJobs:    t.stats?.total_jobs   ?? t.totalJobs    ?? 0,
      totalEarned:  t.stats?.total_earned ?? t.totalEarned  ?? 0,
      jobSuccess:   t.stats?.job_success  ?? t.jobSuccess   ?? 0,

      // Skill bars — si pas présents, générer depuis skills[]
      skillBars: t.skill_bars?.length
        ? t.skill_bars
        : (t.skills || []).slice(0, 6).map((s: string, i: number) => ({
            name:  s,
            level: 90 - i * 5,
            color: 'linear-gradient(90deg,#4f6ef7,#8b5cf6)',
          })),
    };
  }

  // ── FAVORIS ───────────────────────────────────────────────────
  toggleFav() {
    this.isFav = !this.isFav;
    // TODO: appeler service favoris
  }

  // ── HELPERS ÉTOILES ───────────────────────────────────────────
  getStars(rating: number):      any[] { return Array(Math.min(5, Math.round(rating || 0))); }
  getEmptyStars(rating: number): any[] { return Array(5 - Math.min(5, Math.round(rating || 0))); }

  // ── ACTIONS ───────────────────────────────────────────────────
  goBack()       { this.navCtrl.back(); }
  shareProfile() { /* TODO: Share API */ }

  sendMessage() {
    if (!this.talent) return;
    this.navCtrl.navigateForward(['/messages'], {
      queryParams: { to: this.talent.id, name: this.talent.name },
    });
  }

  hireNow() {
    if (!this.talent) return;
    this.navCtrl.navigateForward(['/post-job'], {
      queryParams: { talent_id: this.talent.id },
    });
  }
}