import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FreelancerProfilePage } from './freelancer-profile.page';

describe('FreelancerProfilePage', () => {
  let component: FreelancerProfilePage;
  let fixture: ComponentFixture<FreelancerProfilePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FreelancerProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
