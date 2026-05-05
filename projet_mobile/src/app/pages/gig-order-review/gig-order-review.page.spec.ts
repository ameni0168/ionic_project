import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GigOrderReviewPage } from './gig-order-review.page';

describe('GigOrderReviewPage', () => {
  let component: GigOrderReviewPage;
  let fixture: ComponentFixture<GigOrderReviewPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GigOrderReviewPage],
    }).compileComponents();

    fixture = TestBed.createComponent(GigOrderReviewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

