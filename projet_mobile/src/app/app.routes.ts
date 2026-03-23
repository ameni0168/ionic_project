import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'accueil',
    pathMatch: 'full'
    
  },
  
  {
    path: 'welcome',
    loadComponent: () => import('./pages/welcome/welcome.page').then(m => m.WelcomePage)
  },
  {
    path: 'auth',
    children: [
      {

        path: 'login',
        loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
      },
      {
        path: 'client-register',
        loadComponent: () => import('./pages/client-register/client-register.page').then(m => m.ClientRegisterPage)
      },
      {
        path: 'freelancer-register',
        loadComponent: () => import('./pages/freelancer-register/freelancer-register.page').then(m => m.FreelancerRegisterPage)
      }
    ]
  },

  {
    path: 'freelancer-dashboard',
    loadComponent: () => import('./pages/freelancer-dashboard/freelancer-dashboard.page').then(m => m.FreelancerDashboardPage)
  },
  {
    path: 'freelancer-profile',
    loadComponent: () => import('./pages/freelancer-profile/freelancer-profile.page').then(m => m.FreelancerProfilePage)
  },
  {

    path: 'client-dashboard',
    loadComponent: () => import('./pages/client-dashboard/client-dashboard.page').then( m => m.ClientDashboardPage)
  },
  {
    path: 'talent',
    loadComponent: () => import('./pages/talent/talent.page').then( m => m.TalentPage)
  },
  {
    path: 'my-gigs',
    loadComponent: () => import('./pages/my-gigs/my-gigs.page').then( m => m.MyGigsPage)
  },
  {
    path: 'gig-details',
    loadComponent: () => import('./pages/gig-details/gig-details.page').then( m => m.GigDetailsPage)

  },
  {
    path: 'post-job', 
    loadComponent: () => import("./pages/pages/post-job/post-job.page").then( m=> m.PostJobPage)

  },
  {
    path: 'accueil', 
    loadComponent: () => import("./pages/accueil/accueil.page").then( m=> m.AccueilPage)
  },
  {
    path: 'talent-profile/:id',
    loadComponent: () => import('./pages/talent-profile/talent-profile.page').then( m => m.TalentProfilePage)
  },
  {
    path: 'client-profile',
    loadComponent: () => import('./pages/client-profile/client-profile.page').then( m => m.ClientProfilePage)
  }


];