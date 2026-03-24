import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccueilPage } from './accueil.page';
import { IonicModule } from '@ionic/angular';
import { RouterTestingModule } from '@angular/router/testing';

describe('AccueilPage', () => {
  let component: AccueilPage;
  let fixture: ComponentFixture<AccueilPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AccueilPage],
      imports: [IonicModule.forRoot(), RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(AccueilPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have categories', () => {
    expect(component.categories.length).toBeGreaterThan(0);
  });

  it('should have freelancers', () => {
    expect(component.freelancers.length).toBeGreaterThan(0);
  });

});