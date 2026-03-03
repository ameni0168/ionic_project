import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TalentProfilePage } from './talent-profile.page';

describe('TalentProfilePage', () => {
  let component: TalentProfilePage;
  let fixture: ComponentFixture<TalentProfilePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TalentProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
