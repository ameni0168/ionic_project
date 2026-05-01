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
    loadComponent: () => import('./pages/client-dashboard/client-dashboard.page').then(m => m.ClientDashboardPage)
  },
  {
    path: 'project-progress',
    loadComponent: () => import('./pages/project-progress/project-progress.page').then(m => m.ProjectProgressPage)
  },
  {
    path: 'project-progress/:id',
    loadComponent: () => import('./pages/project-progress/project-progress.page').then(m => m.ProjectProgressPage)
  },
  {
    path: 'talent',
    loadComponent: () => import('./pages/talent/talent.page').then(m => m.TalentPage)
  },
  {
    path: 'my-gigs',
    loadComponent: () => import('./pages/my-gigs/my-gigs.page').then(m => m.MyGigsPage)
  },
  {
    path: 'gig-details/:id',
    loadComponent: () => import('./pages/gig-details/gig-details.page').then(m => m.GigDetailsPage)
  },
  {
    path: 'post-job', 
    loadComponent: () => import("./pages/post-job/post-job.page").then(m => m.PostJobPage)
  },
  {
    path: 'proposal', 
    loadComponent: () => import("./pages/proposal/proposal.page").then(m => m.ProposalPage)
  },
  {
    path: 'hire-freelancers',
    loadComponent: () => import('./pages/hire-freelancers/hire-freelancers.page').then(m => m.HireFreelancersPage)
  },
  {
    path: 'accueil', 
    loadComponent: () => import("./pages/accueil/accueil.page").then(m => m.AccueilPage)
  },
  {
    path: 'talent-profile/:id',
    loadComponent: () => import('./pages/talent-profile/talent-profile.page').then(m => m.TalentProfilePage)
  },
  {
    path: 'orders',
    loadComponent: () => import('./pages/Orders/orders.page').then(m => m.OrdersPage)
  },
  {
    path: 'client-profile',
    loadComponent: () => import('./pages/client-profile/client-profile.page').then(m => m.ClientProfilePage)
  },
  {
    path: 'cataloge',
    loadComponent: () => import('./pages/cataloge/cataloge.page').then(m => m.CatalogPage)
  },
  {
    path: 'service-details',
    loadComponent: () => import('./pages/service-details/service-details.page').then(m => m.ServiceDetailsPage)
  },
  {
    path: 'service-details/:id',
    loadComponent: () => import('./pages/service-details/service-details.page').then(m => m.ServiceDetailsPage)
  },
  {
    path: 'jobs',
    loadComponent: () => import('./pages/jobs/jobs.page').then(m => m.JobsPage)
  },
  {
    path: 'contracts',
    loadComponent: () => import('./pages/contract-list/contract-list.page').then(m => m.ContractListPage)
  },
  {
    path: 'contract-detail/:id',
    loadComponent: () => import('./pages/contract-detail/contract-detail.page').then(m => m.ContractDetailPage)
  },
  {
    path: 'sprint-plan-builder/:contractId',
    loadComponent: () => import('./pages/sprint-plan-builder/sprint-plan-builder.page').then(m => m.SprintPlanBuilderPage)
  },
  {
    path: 'sprint-plan-builder/:contractId/:planId',
    loadComponent: () => import('./pages/sprint-plan-builder/sprint-plan-builder.page').then(m => m.SprintPlanBuilderPage)
  },
  {
    path: 'sprint-plan-review/:planId',
    loadComponent: () => import('./pages/sprint-plan-review/sprint-plan-review.page').then(m => m.SprintPlanReviewPage)
  },
  {
    path: 'sprint-workspace/:sprintId',
    loadComponent: () => import('./pages/sprint-workspace/sprint-workspace.page').then(m => m.SprintWorkspacePage)
  },
  {
    path: 'sprint-review/:sprintId',
    loadComponent: () => import('./pages/sprint-review/sprint-review.page').then(m => m.SprintReviewPage)
  }
];
