// src/app/pages/create-gig/create-gig.page.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { IonicModule, NavController, LoadingController, ToastController, AlertController } from '@ionic/angular';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';

interface PricingPackage {
  price: number;
  title: string;
  description: string;
  deliveryTime: number;
  revisions: number;
}

interface GigFormData {
  title: string;
  category: string;
  subcategory: string;
  description: string;
  requirements: string;
  pricing: {
    basic: PricingPackage;
    standard?: PricingPackage;
    premium?: PricingPackage;
  };
  tags: string[];
  images: File[];
}

@Component({
  selector: 'app-create-gig',
  templateUrl: './create-gig.page.html',
  styleUrls: ['./create-gig.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class CreateGigPage implements OnInit {
  // Catégories disponibles
  categories: string[] = [
    'Development & IT',
    'Design & Creative',
    'Writing & Translation',
    'Marketing & Sales',
    'Admin Support',
    'Video & Animation',
    'Music & Audio',
    'Business'
  ];

  // Sous-catégories par catégorie
  subcategories: { [key: string]: string[] } = {
    'Development & IT': ['Web Development', 'Mobile Development', 'Desktop Apps', 'DevOps', 'Database', 'Cybersecurity'],
    'Design & Creative': ['Logo Design', 'Web Design', 'UX/UI', 'Graphic Design', 'Illustration', '3D Modeling'],
    'Writing & Translation': ['Content Writing', 'Copywriting', 'Translation', 'Proofreading', 'Technical Writing'],
    'Marketing & Sales': ['SEO', 'Social Media', 'Email Marketing', 'Ads', 'Market Research'],
    'Admin Support': ['Virtual Assistant', 'Data Entry', 'Customer Service', 'Transcription'],
    'Video & Animation': ['Video Editing', 'Animation', 'Motion Graphics', 'Explainer Videos'],
    'Music & Audio': ['Voice Over', 'Music Production', 'Mixing', 'Sound Design'],
    'Business': ['Consulting', 'Business Plans', 'Market Research', 'Legal']
  };

  // Données du formulaire
  gigData: GigFormData = {
    title: '',
    category: '',
    subcategory: '',
    description: '',
    requirements: '',
    pricing: {
      basic: {
        price: 50,
        title: 'Basic Package',
        description: 'Essential features to get started',
        deliveryTime: 3,
        revisions: 1
      }
    },
    tags: [],
    images: []
  };

  // Options pour packages supplémentaires
  includeStandard = false;
  includePremium = false;

  // Package standard
  standardPackage: PricingPackage = {
    price: 150,
    title: 'Standard Package',
    description: 'Everything in Basic plus additional features',
    deliveryTime: 5,
    revisions: 2
  };

  // Package premium
  premiumPackage: PricingPackage = {
    price: 300,
    title: 'Premium Package',
    description: 'Complete solution with maximum value',
    deliveryTime: 7,
    revisions: 3
  };

  // Tags
  currentTag = '';
  maxTags = 5;

  // Images
  imagePreviews: string[] = [];
  maxImages = 3;

  // Loading state
  isSubmitting = false;

  constructor(
    private navCtrl: NavController,
    private api: ApiService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private router: Router
  ) {}

  ngOnInit() {
    // Vérifier si l'utilisateur a un profil freelancer
    this.checkFreelancerProfile();
  }

  async checkFreelancerProfile() {
    try {
      const status = await this.api.getAccountStatus().toPromise();
      
      if (!status.hasProfile) {
        const alert = await this.alertCtrl.create({
          header: 'Profile Required',
          message: 'You need to create your freelancer profile before creating a gig.',
          buttons: [
            {
              text: 'Create Profile',
              handler: () => {
                this.navCtrl.navigateForward(['/freelancer-profile-setup']);
              }
            }
          ]
        });
        await alert.present();
      } else if (!status.isComplete) {
        const alert = await this.alertCtrl.create({
          header: 'Complete Your Profile',
          message: 'Please complete your profile before creating a gig.',
          buttons: ['OK']
        });
        await alert.present();
      }
    } catch (error) {
      console.error('Error checking profile:', error);
    }
  }

  // ========== CATEGORY METHODS ==========
  
  onCategoryChange() {
    // Reset subcategory when category changes
    this.gigData.subcategory = '';
  }

  // ========== TAGS METHODS ==========
  
  addTag() {
    const tag = this.currentTag.trim().toLowerCase();
    
    if (!tag) return;
    
    if (this.gigData.tags.length >= this.maxTags) {
      this.showToast(`Maximum ${this.maxTags} tags allowed`, 'warning');
      return;
    }
    
    if (this.gigData.tags.includes(tag)) {
      this.showToast('Tag already added', 'warning');
      return;
    }
    
    this.gigData.tags.push(tag);
    this.currentTag = '';
  }

  removeTag(index: number) {
    this.gigData.tags.splice(index, 1);
  }

  // ========== IMAGES METHODS ==========
  
  async onImageSelected(event: any) {
    const files: FileList = event.target.files;
    
    if (!files || files.length === 0) return;
    
    const totalImages = this.gigData.images.length + files.length;
    
    if (totalImages > this.maxImages) {
      this.showToast(`Maximum ${this.maxImages} images allowed`, 'warning');
      return;
    }
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        this.showToast('Only JPEG, PNG, and GIF images are allowed', 'danger');
        continue;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.showToast('Image must be less than 5MB', 'danger');
        continue;
      }
      
      this.gigData.images.push(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviews.push(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(index: number) {
    this.gigData.images.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  // ========== PACKAGE METHODS ==========
  
  toggleStandardPackage() {
    this.includeStandard = !this.includeStandard;
    if (this.includeStandard) {
      this.gigData.pricing.standard = { ...this.standardPackage };
    } else {
      delete this.gigData.pricing.standard;
    }
  }

  togglePremiumPackage() {
    this.includePremium = !this.includePremium;
    if (this.includePremium) {
      this.gigData.pricing.premium = { ...this.premiumPackage };
    } else {
      delete this.gigData.pricing.premium;
    }
  }

  // ========== SUBMIT METHODS ==========
  
  async onSubmit(form: NgForm) {
    if (!form.valid) {
      this.showToast('Please fill all required fields', 'warning');
      return;
    }

    if (this.gigData.tags.length === 0) {
      this.showToast('Add at least one tag', 'warning');
      return;
    }

    this.isSubmitting = true;
    
    const loading = await this.loadingCtrl.create({
      message: 'Creating your gig...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      // Préparer les données pour l'API
      const gigPayload = {
        title: this.gigData.title,
        category: this.gigData.category,
        subcategory: this.gigData.subcategory,
        description: this.gigData.description,
        requirements: this.gigData.requirements,
        pricing: this.gigData.pricing,
        tags: this.gigData.tags
      };

      // 1. Créer le gig
      const response = await this.api.createGig(gigPayload).toPromise();
      const gigId = response.gig._id;

      // 2. Uploader les images si présentes
      if (this.gigData.images.length > 0) {
        for (const image of this.gigData.images) {
          await this.api.uploadGigImage(gigId, image).toPromise();
        }
      }

      await loading.dismiss();
      this.isSubmitting = false;

      // Succès
      const toast = await this.toastCtrl.create({
        message: 'Gig created successfully!',
        duration: 2000,
        color: 'success',
        position: 'top'
      });
      await toast.present();

      // Rediriger vers la page du gig
      this.navCtrl.navigateForward(['/gig-details', gigId]);

    } catch (error: any) {
      await loading.dismiss();
      this.isSubmitting = false;

      const message = this.api.getErrorMessage(error);
      this.showToast(message, 'danger');
    }
  }

  // ========== UTILITY METHODS ==========
  
  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }

  goBack() {
    this.navCtrl.navigateBack(['/my-gigs']);
  }
}