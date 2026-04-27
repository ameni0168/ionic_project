// src/app/pages/client-profile/client-profile.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, ToastController, LoadingController } from '@ionic/angular';
import {
  ClientProfileService,
  ClientProfile,
} from '../../services/client-profile.service';

@Component({
  selector: 'app-client-profile',
  templateUrl: './client-profile.page.html',
  styleUrls: ['./client-profile.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class ClientProfilePage implements OnInit {

  // ── Données ───────────────────────────────────────────────────
  profile: ClientProfile | null = null;
  isLoading = true;
  isEditing = false;
  isSaving = false;

  // ── Formulaire d'édition ──────────────────────────────────────
  editForm = {
    full_name: '',
    phone: '',
    location: '',
    company: '',
    website: '',
    bio: '',
    avatar: '',
  };

  // ── Modal mot de passe ────────────────────────────────────────
  showPwModal = false;
  pwForm = { old_password: '', new_password: '', confirm_password: '' };
  pwError = '';
  pwSaving = false;

  constructor(
    private profileSvc: ClientProfileService,
    private navCtrl: NavController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
  ) { }

  ngOnInit() { this.loadProfile(); }

  // ── CHARGER LE PROFIL DEPUIS LE BACKEND ───────────────────────
  loadProfile() {
    this.isLoading = true;
    this.profileSvc.getProfile().subscribe({
      next: (data: any) => {
        this.profile = data;
        this.isLoading = false;
        this.fillForm();
      },
      error: (err: { status: number; }) => {
        this.isLoading = false;
        if (err.status === 401) {
          this.navCtrl.navigateRoot(['/auth/login']);
        } else {
          this.showToast('Erreur chargement du profil', 'danger');
        }
      },
    });
  }

  // ── REMPLIR LE FORMULAIRE ─────────────────────────────────────
  private fillForm() {
    if (!this.profile) return;
    this.editForm = {
      full_name: this.profile.user.full_name || '',
      phone: this.profile.client.phone || '',
      location: this.profile.client.location || '',
      company: this.profile.client.company || '',
      website: this.profile.client.website || '',
      bio: this.profile.client.bio || '',
      avatar: this.profile.client.avatar || '',
    };
  }

  // ── ACTIVER L'ÉDITION ─────────────────────────────────────────
  startEdit() {
    this.fillForm();
    this.isEditing = true;
  }

  cancelEdit() {
    this.isEditing = false;
    this.fillForm();
  }

  // ── SAUVEGARDER LE PROFIL ─────────────────────────────────────
  saveProfile() {
    this.isSaving = true;

    // Filtrer les champs vides pour n'envoyer que ce qui a changé
    const payload: any = {};
    const fields = ['full_name', 'phone', 'location', 'company', 'website', 'bio', 'avatar'];
    fields.forEach(f => {
      if ((this.editForm as any)[f] !== undefined) {
        payload[f] = (this.editForm as any)[f];
      }
    });

    this.profileSvc.updateProfile(payload).subscribe({
      next: (data: any) => {
        this.profile = data;
        this.isSaving = false;
        this.isEditing = false;
        this.showToast('Profil mis à jour ✅', 'success');
      },
      error: (err: { error: { error: any; }; }) => {
        this.isSaving = false;
        this.showToast(err.error?.error || 'Erreur lors de la mise à jour', 'danger');
      },
    });
  }

  // ── AVATAR PLACEHOLDER ────────────────────────────────────────
  // Pour l'instant on accepte une URL saisie manuellement
  // TODO: remplacer par Capacitor Camera / file picker
  get avatarSrc(): string {
    const av = this.isEditing
      ? this.editForm.avatar
      : this.profile?.client?.avatar;
    return av || 'assets/default-avatar.png';
  }

  // ── MODAL MOT DE PASSE ────────────────────────────────────────
  openPwModal() {
    this.pwForm = { old_password: '', new_password: '', confirm_password: '' };
    this.pwError = '';
    this.showPwModal = true;
  }

  closePwModal() { this.showPwModal = false; }

  submitChangePassword() {
    this.pwError = '';

    if (!this.pwForm.old_password || !this.pwForm.new_password) {
      this.pwError = 'Tous les champs sont obligatoires';
      return;
    }
    if (this.pwForm.new_password.length < 6) {
      this.pwError = 'Le nouveau mot de passe doit avoir au moins 6 caractères';
      return;
    }
    if (this.pwForm.new_password !== this.pwForm.confirm_password) {
      this.pwError = 'Les mots de passe ne correspondent pas';
      return;
    }

    this.pwSaving = true;
    this.profileSvc.changePassword({
      old_password: this.pwForm.old_password,
      new_password: this.pwForm.new_password,
    }).subscribe({
      next: () => {
        this.pwSaving = false;
        this.closePwModal();
        this.showToast('Mot de passe modifié ✅', 'success');
      },
      error: (err: { error: { error: string; }; }) => {
        this.pwSaving = false;
        this.pwError = err.error?.error || 'Erreur';
      },
    });
  }

  // ── DÉCONNEXION ───────────────────────────────────────────────
  logout() {
    localStorage.clear();
    this.navCtrl.navigateRoot(['/auth/login']);
  }

  // ── RETOUR ────────────────────────────────────────────────────
  goBack() { this.navCtrl.back(); }

  // ── TOAST HELPER ──────────────────────────────────────────────
  private async showToast(msg: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 2500,
      position: 'top',
      color,
    });
    toast.present();
  }
}