import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-talent-profile',
  templateUrl: './talent-profile.page.html',
  styleUrls: ['./talent-profile.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class TalentProfilePage implements OnInit {

  talent: any = null;
  isFav = false;

  // ── Données par défaut ────────────────────────────────────
  defaultSkillBars = [
    { name: 'React',      level: 90, color: 'linear-gradient(90deg, #4f6ef7, #8b5cf6)' },
    { name: 'Angular',    level: 85, color: 'linear-gradient(90deg, #4f6ef7, #8b5cf6)' },
    { name: 'Node.js',    level: 88, color: 'linear-gradient(90deg, #06b6d4, #4f6ef7)' },
    { name: 'TypeScript', level: 92, color: 'linear-gradient(90deg, #4f6ef7, #8b5cf6)' },
    { name: 'MongoDB',    level: 80, color: 'linear-gradient(90deg, #22c55e, #06b6d4)' },
    { name: 'AWS',        level: 75, color: 'linear-gradient(90deg, #f59e0b, #ef4444)' },
  ];

  defaultExperience = [
    {
      role:    'Senior Full-Stack Developer',
      company: 'TechCorp Inc. · San Francisco',
      period:  '2022 – Present',
      desc:    'Led development of microservices architecture serving 1M+ users. Managed a team of 5 engineers.',
    },
    {
      role:    'Frontend Developer',
      company: 'StartupXYZ · Remote',
      period:  '2020 – 2022',
      desc:    'Built React-based SaaS dashboard from scratch. Improved performance by 40%.',
    },
    {
      role:    'Junior Developer',
      company: 'WebAgency · New York',
      period:  '2018 – 2020',
      desc:    'Developed client websites using Angular and Node.js REST APIs.',
    },
  ];

  defaultEducation = [
    {
      degree: 'B.Sc. Computer Science',
      school: 'MIT — Massachusetts Institute of Technology',
      period: '2014 – 2018',
    },
    {
      degree: 'Web Development Bootcamp',
      school: 'Codecademy Pro',
      period: '2018',
    },
  ];

  defaultCertifications = [
    { name: 'AWS Certified Solutions Architect',    issuer: 'Amazon',  year: '2023' },
    { name: 'Google Professional Cloud Developer',  issuer: 'Google',  year: '2022' },
    { name: 'Meta React Native Specialist',         issuer: 'Meta',    year: '2022' },
    { name: 'MongoDB Certified Developer',          issuer: 'MongoDB', year: '2021' },
  ];

  defaultPortfolio = [
    {
      title:  'E-Commerce App',
      image:  'assets/portfolio/ecommerce.jpg',
      type:   'Mobile',
      tags:   ['React Native', 'Node.js'],
    },
    {
      title:  'SaaS Dashboard',
      image:  'assets/portfolio/dashboard.jpg',
      type:   'Web',
      tags:   ['React', 'TypeScript'],
    },
    {
      title:  'Chat Platform',
      image:  'assets/portfolio/chat.jpg',
      type:   'Web',
      tags:   ['Angular', 'Socket.io'],
    },
    {
      title:  'Delivery App',
      image:  'assets/portfolio/delivery.jpg',
      type:   'Mobile',
      tags:   ['Ionic', 'Firebase'],
    },
  ];

  sampleReviews = [
    {
      name:   'John Davidson',
      avatar: 'assets/reviewers/john.jpg',
      rating: 5,
      date:   'January 2026',
      text:   'Exceptional developer! Delivered the project ahead of schedule with outstanding code quality. Highly recommend.',
    },
    {
      name:   'Emma Stevens',
      avatar: 'assets/reviewers/emma.jpg',
      rating: 5,
      date:   'December 2025',
      text:   'Very professional and communicative. Solved complex issues quickly and the result exceeded expectations.',
    },
    {
      name:   'Rachid Benali',
      avatar: 'assets/reviewers/rachid.jpg',
      rating: 4,
      date:   'November 2025',
      text:   'Great experience working together. Clean and well-documented code. Will hire again.',
    },
  ];

  constructor(
    private router:   Router,
    private route:    ActivatedRoute,
    private location: Location,
  ) {}

  ngOnInit() {
    // Récupérer talent depuis le state de navigation (passé depuis talent.page)
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras?.state?.['talent']) {
      this.talent = nav.extras.state['talent'];
      this.enrichTalentWithDefaults();
    } else {
      const id = this.route.snapshot.paramMap.get('id');
      this.loadTalentById(id);
    }
  }

  // Enrichit l'objet talent avec des valeurs par défaut si manquantes
  enrichTalentWithDefaults() {
    if (!this.talent.skillBars)       this.talent.skillBars       = this.defaultSkillBars;
    if (!this.talent.experience)      this.talent.experience      = this.defaultExperience;
    if (!this.talent.education)       this.talent.education       = this.defaultEducation;
    if (!this.talent.certifications)  this.talent.certifications  = this.defaultCertifications;
    if (!this.talent.portfolio)       this.talent.portfolio       = this.defaultPortfolio;
    if (!this.talent.email)           this.talent.email           = `${this.talent.name.toLowerCase().replace(' ', '.')}@email.com`;
  }

  loadTalentById(id: string | null) {
    // TODO: appeler votre TalentService
    // this.talentService.getById(id).subscribe(t => { this.talent = t; this.enrichTalentWithDefaults(); });

    // Données de démo
    this.talent = {
      id,
      name:           'Sarah Johnson',
      title:          'Full Stack Developer',
      avatar:         'assets/talents/sarah.jpg',
      hourlyRate:     85,
      earned:         '$50K+',
      jobSuccess:     98,
      online:         true,
      rating:         4.9,
      reviews:        38,
      jobs:           47,
      location:       'San Francisco, CA',
      email:          'sarah.johnson@email.com',
      phone:          '+1 (555) 123-4567',
      about:          'Experienced full-stack developer with 5+ years of expertise in web and mobile applications. Specialized in React, Angular, Node.js, and cloud solutions.',
      skillBars:      this.defaultSkillBars,
      experience:     this.defaultExperience,
      education:      this.defaultEducation,
      certifications: this.defaultCertifications,
      portfolio:      this.defaultPortfolio,
    };
  }

  // ── Helpers ───────────────────────────────────────────────
  getStars(rating: number):      any[] { return Array(Math.round(rating)); }
  getEmptyStars(rating: number): any[] { return Array(5 - Math.round(rating)); }

  // ── Actions ───────────────────────────────────────────────
  goBack()       { this.location.back(); }
  shareProfile() { /* TODO: Share API */ }

  hireNow() {
    this.router.navigate(['/hire', this.talent.id]);
  }

  sendMessage() {
    this.router.navigate(['/messages'], {
      queryParams: { to: this.talent.id, name: this.talent.name },
    });
  }

  downloadCV() {
    // TODO: télécharger le CV PDF du freelancer
    console.log('Downloading CV for', this.talent.name);
  }

  seeAllPortfolio() {
    this.router.navigate(['/portfolio', this.talent.id]);
  }

  viewProject(project: any) {
    this.router.navigate(['/portfolio-detail'], { state: { project } });
  }
}