import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FreelancerRegisterPage } from './freelancer-register.page';

describe('FreelancerRegisterPage', () => {
  let component: FreelancerRegisterPage;
  let fixture: ComponentFixture<FreelancerRegisterPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FreelancerRegisterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
