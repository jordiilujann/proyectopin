import { of } from 'rxjs';
import { ReviewComponent } from './review.component';

describe('ReviewComponent', () => {
  let component: ReviewComponent;

  let spotifyService: any;
  let http: any;
  let authService: any;
  let reviewService: any;
  let route: any;
  let router: any;

  beforeEach(() => {
    spotifyService = jasmine.createSpyObj('SpotifyService', ['searchAll', 'getTrackById', 'getArtistById']);
    http = jasmine.createSpyObj('HttpClient', ['post']);
    authService = jasmine.createSpyObj('AuthService', ['getAccessToken']);
    reviewService = jasmine.createSpyObj('ReviewService', ['updateReview', 'deleteReview', 'getReviewById', 'getSpotifyItemInfo']);
    route = { paramMap: of({ get: () => null }) };
    router = jasmine.createSpyObj('Router', ['navigate']);

    http.post.and.returnValue(of({}));
    reviewService.updateReview.and.returnValue(of({}));
    reviewService.deleteReview.and.returnValue(of({}));
    authService.getAccessToken.and.returnValue('token-abc');

    component = new ReviewComponent(
      spotifyService,
      http,
      authService,
      reviewService,
      route,
      router
    );
  });

  describe('formatTimestamp()', () => {
    it('formatea milisegundos a MM:SS', () => {
      expect(component.formatTimestamp(125000)).toBe('2:05');
      expect(component.formatTimestamp(60000)).toBe('1:00');
      expect(component.formatTimestamp(3000)).toBe('0:03');
    });

    it('devuelve 0:00 para null o valores inválidos', () => {
      expect(component.formatTimestamp(null)).toBe('0:00');
      expect(component.formatTimestamp(0)).toBe('0:00');
      expect(component.formatTimestamp(-100)).toBe('0:00');
    });
  });

  describe('submitReview()', () => {
    it('sin selectedItem (y sin modo concert) -> NO llama HTTP ni updateReview', () => {
      component.isConcertMode = false;
      component.selectedItem = null;
      component.rating = 4;

      component.submitReview();

      expect(http.post).not.toHaveBeenCalled();
      expect(reviewService.updateReview).not.toHaveBeenCalled();
    });

    it('rating = 0 -> NO llama HTTP ni updateReview', () => {
      component.selectedItem = {
        id: 't1',
        name: 'Song',
        type: 'track',
        coverUrl: 'c',
        artists: [{ name: 'A' }],
      };
      component.rating = 0;

      component.submitReview();

      expect(http.post).not.toHaveBeenCalled();
      expect(reviewService.updateReview).not.toHaveBeenCalled();
    });

    it('modo edición -> llama reviewService.updateReview(reviewId, payload)', () => {
      component.isEditMode = true;
      component.reviewId = 'r1';
      component.selectedItem = {
        id: 't1',
        name: 'Song',
        type: 'track',
        coverUrl: 'c',
        artists: [{ name: 'A' }],
        genre: 'g',
      };
      component.rating = 4;
      component.title = 'Title';
      component.content = 'Body';
      component.timestampMs = 1234;

      component.submitReview();

      expect(reviewService.updateReview).toHaveBeenCalledTimes(1);
      const [id, payload] = reviewService.updateReview.calls.mostRecent().args;
      expect(id).toBe('r1');
      expect(payload).toEqual(jasmine.objectContaining({
        rating: 4,
        title: 'Title',
        content: 'Body',
        spotify_id: 't1',
        target_type: 'track',
        item_name: 'Song',
        item_cover_url: 'c',
        genre: 'g',
        timestamp_ms: 1234,
      }));
      expect(http.post).not.toHaveBeenCalled();
    });

    it('modo creación -> POST /api/reviews con Authorization Bearer <token>', () => {
      component.isEditMode = false;
      component.selectedItem = {
        id: 't1',
        name: 'Song',
        type: 'track',
        coverUrl: 'c',
        artists: [{ name: 'A' }],
        genre: 'g',
      };
      component.rating = 5;
      component.title = 'T';
      component.content = 'C';
      component.timestampMs = 1500;

      component.submitReview();

      expect(http.post).toHaveBeenCalledTimes(1);
      const [url, body, options] = http.post.calls.mostRecent().args;
      expect(url).toBe('/api/reviews');
      expect(options).toEqual(jasmine.objectContaining({
        headers: jasmine.objectContaining({ Authorization: 'Bearer token-abc' }),
      }));
      expect(body).toEqual(jasmine.objectContaining({
        rating: 5,
        title: 'T',
        content: 'C',
        spotify_id: 't1',
        target_type: 'track',
        timestamp_ms: 1500,
      }));
    });

    it('timestampMs > trackDurationMs: actualmente NO se valida; se envía igualmente el POST (limitación documentada)', () => {
      component.isEditMode = false;
      component.selectedItem = {
        id: 't1',
        name: 'Song',
        type: 'track',
        coverUrl: 'c',
        artists: [{ name: 'A' }],
      };
      component.rating = 5;
      component.trackDurationMs = 1000;
      component.timestampMs = 5000;

      component.submitReview();

      expect(http.post).toHaveBeenCalled();
      const [, body] = http.post.calls.mostRecent().args;
      expect(body).toEqual(jasmine.objectContaining({ timestamp_ms: 5000 }));
    });
  });

  describe('deleteReview()', () => {
    it('en modo edición abre confirm y al confirmar llama reviewService.deleteReview(reviewId)', () => {
      component.isEditMode = true;
      component.reviewId = 'r1';

      component.deleteReview();
      expect(component.showModal).toBeTrue();
      expect(component.modalType).toBe('confirm');

      component.onModalConfirm();

      expect(reviewService.deleteReview).toHaveBeenCalledWith('r1');
      expect(router.navigate).toHaveBeenCalledWith(['/app/feed']);
      expect(component.showModal).toBeFalse();
    });
  });
});

