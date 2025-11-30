import { ReviewComponent } from './review.component';

describe('ReviewComponent - formatDuration', () => {
  let component: ReviewComponent;

  beforeEach(() => {
    component = new ReviewComponent(
      {} as any, {} as any, {} as any, {} as any, {} as any, {} as any
    );
  });

  it('should format milliseconds to MM:SS', () => {
    expect(component.formatDuration(125000)).toBe('2:05');
    expect(component.formatDuration(60000)).toBe('1:00');
    expect(component.formatDuration(3000)).toBe('0:03');
  });

  it('should return 0:00 for null or invalid values', () => {
    expect(component.formatDuration(null)).toBe('0:00');
    expect(component.formatDuration(0)).toBe('0:00');
    expect(component.formatDuration(-100)).toBe('0:00');
  });
});

