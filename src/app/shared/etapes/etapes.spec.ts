import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Etapes } from './etapes';

describe('Etapes', () => {
  let component: Etapes;
  let fixture: ComponentFixture<Etapes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Etapes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Etapes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
