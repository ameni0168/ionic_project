import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { trigger, transition, style, animate } from '@angular/animations';
import { ApiService } from '../../services/api.service';
import { FreelancerService } from 'src/app/services/freelancer.service';

interface Skill { name: string; level: number; }

@Component({
  selector: 'app-freelancer-profile',
  templateUrl: './freelancer-profile.page.html',
  styleUrls: ['./freelancer-profile.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class FreelancerProfilePage implements OnInit {

  isLoading = true;
  showEdit = false;
  isSaving = false;

  // ── Modal mot de passe ────────────────────────────────────────────────
  showPwModal = false;
  pwForm = { old_password: '', new_password: '', confirm_password: '' };
  pwError = '';
  pwSaving = false;

  // ── Données affichées ──────────────────────────────────────────────────────
  profile = {
    name: '', title: '', location: '', email: '',
    phone: '', hourlyRate: '', completedProjects: 0,
    rating: 0, reviews: 0, bio: '', portfolioUrl: '',
    memberSince: ''
  };
  profileInfo: { label: string; value: string; icon: string }[] = [];
  skills: Skill[] = [];

  // ── Formulaire d'édition ───────────────────────────────────────────────────
  editForm = {
    fullName: '',
    title: '',
    bio: '',
    location: '',
    phone: '',
    hourlyRate: 0,
    portfolioUrl: '',
    skills: [] as Skill[]
  };
  newSkillName = '';
  newSkillLevel = 80;

  constructor(
    private navCtrl: NavController,
    private api: ApiService,
    private toast: ToastController
  ) { }

  ngOnInit() { this.loadProfile(); }

  // ── Chargement ─────────────────────────────────────────────────────────────

  loadProfile() {
    this.isLoading = true;
    this.api.getFreelancerProfile().subscribe({
      next: (data: any) => {
        this.profile = {
          name: data.fullName,
          title: data.title || 'Freelancer',
          location: data.location || '',
          email: data.email,
          phone: data.phone || '',
          hourlyRate: data.hourlyRate ? `$${data.hourlyRate}` : '',
          completedProjects: data.completedProjects,
          rating: data.rating,
          reviews: data.reviews,
          bio: data.bio,
          portfolioUrl: data.portfolioUrl || '',
          memberSince: data.created_at ? new Date(data.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : ''
        };
        this.profileInfo = [
          { label: 'Email', value: data.email, icon: 'mail-outline' },
          { label: 'Phone', value: data.phone || 'Non renseigné', icon: 'call-outline' },
          { label: 'Location', value: data.location || 'Non renseigné', icon: 'location-outline' },
          { label: 'Hourly Rate', value: data.hourlyRate ? `$${data.hourlyRate}/h` : 'N/A', icon: 'cash-outline' },
          { label: 'Portfolio', value: data.portfolioUrl || 'Non renseigné', icon: 'globe-outline' }
        ];
        this.skills = data.skills || [];
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Profile error:', err);
        this.isLoading = false;
        this.showToast('Impossible de charger le profil', 'danger');
      }
    });
  }

  // ── Édition ────────────────────────────────────────────────────────────────

  openEdit() {
    // Pré-remplir le formulaire avec les données actuelles
    this.editForm = {
      fullName: this.profile.name,
      title: this.profile.title,
      bio: this.profile.bio,
      location: this.profile.location,
      phone: this.profile.phone,
      hourlyRate: parseFloat(this.profile.hourlyRate.replace('$', '')) || 0,
      portfolioUrl: this.profile.portfolioUrl,
      skills: this.skills.map(s => ({ ...s }))  // copie profonde
    };
    this.showEdit = true;
  }

  closeEdit() {
    this.showEdit = false;
  }

  saveProfile(): void {
    if (!this.editForm.fullName.trim()) {
      this.showToast('Le nom est obligatoire', 'warning');
      return;
    }

    this.isSaving = true;
    this.api.updateFreelancerProfile(this.editForm).subscribe({
      next: () => {
        this.isSaving = false;
        this.showEdit = false;
        this.showToast('Profil mis à jour !', 'success');
        this.loadProfile();   // recharger depuis l'API
      },
      error: (err: any) => {
        this.isSaving = false;
        const msg = err?.error?.error || 'Erreur lors de la mise à jour';
        this.showToast(msg, 'danger');
      }
    });
  }

  // ── Gestion des skills dans le formulaire ─────────────────────────────────

  addSkill(): void {
    const name = this.newSkillName.trim();
    if (!name) {
      this.showToast('Entrez un nom de compétence', 'warning');
      return;
    }
    if (this.editForm.skills.find(s => s.name.toLowerCase() === name.toLowerCase())) {
      this.showToast('Cette compétence existe déjà', 'warning');
      return;
    }
    this.editForm.skills.push({ name, level: this.newSkillLevel });
    this.newSkillName = '';
    this.newSkillLevel = 80;
  }

  removeSkill(index: number) {
    this.editForm.skills.splice(index, 1);
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  goBack() {
    this.navCtrl.navigateBack(['/freelancer-dashboard']);
  }

  // ── Modal mot de passe ─────────────────────────────────────────────────

  openPwModal() {
    this.pwForm = { old_password: '', new_password: '', confirm_password: '' };
    this.pwError = '';
    this.showPwModal = true;
  }

  closePwModal() { this.showPwModal = false; }

  submitChangePassword() {
    this.pwError = '';
    if (!this.pwForm.old_password || !this.pwForm.new_password) {
      this.pwError = 'Tous les champs sont obligatoires'; return;
    }
    if (this.pwForm.new_password.length < 6) {
      this.pwError = 'Le nouveau mot de passe doit avoir au moins 6 caractères'; return;
    }
    if (this.pwForm.new_password !== this.pwForm.confirm_password) {
      this.pwError = 'Les mots de passe ne correspondent pas'; return;
    }
    this.pwSaving = true;
    this.api.changeFreelancerPassword({
      old_password: this.pwForm.old_password,
      new_password: this.pwForm.new_password,
    }).subscribe({
      next: () => {
        this.pwSaving = false;
        this.closePwModal();
        this.showToast('Mot de passe modifié ✅', 'success');
      },
      error: (err: any) => {
        this.pwSaving = false;
        this.pwError = err?.error?.error || 'Erreur lors du changement';
      },
    });
  }

  // ── Déconnexion ─────────────────────────────────────────────────────────

  logout() {
    localStorage.clear();
    this.navCtrl.navigateRoot(['/auth/login']);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const t = await this.toast.create({ message, duration: 2500, color, position: 'top' });
    await t.present();
  }
}