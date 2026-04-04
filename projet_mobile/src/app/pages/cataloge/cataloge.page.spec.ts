import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CatalogePage } from './cataloge.page';

describe('CatalogePage', () => {
  let component: CatalogePage;
  let fixture: ComponentFixture<CatalogePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CatalogePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
