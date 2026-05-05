import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GigOrderDeliveryPage } from './gig-order-delivery.page';

describe('GigOrderDeliveryPage', () => {
  let component: GigOrderDeliveryPage;
  let fixture: ComponentFixture<GigOrderDeliveryPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GigOrderDeliveryPage],
    }).compileComponents();

    fixture = TestBed.createComponent(GigOrderDeliveryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

