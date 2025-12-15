import { of } from 'rxjs';
import { FeedComponent } from './feed.component';

describe('FeedComponent', () => {
  let component: FeedComponent;

  const reviewService: any = {
    getReviews: jasmine.createSpy('getReviews'),
    getSpotifyItemInfo: jasmine.createSpy('getSpotifyItemInfo'),
    getReviewsBySpotifyId: jasmine.createSpy('getReviewsBySpotifyId'),
    getLikedReviews: jasmine.createSpy('getLikedReviews'),
    likeReview: jasmine.createSpy('likeReview'),
    unlikeReview: jasmine.createSpy('unlikeReview'),
  };

  const auth: any = {
    ensureUserIdentity: jasmine.createSpy('ensureUserIdentity'),
    getUserId: jasmine.createSpy('getUserId'),
    getUserName: jasmine.createSpy('getUserName'),
  };

  const cdr: any = { detectChanges: jasmine.createSpy('detectChanges') };
  const router: any = { navigate: jasmine.createSpy('navigate') };

  beforeEach(() => {
    // Reset spies
    Object.values(reviewService).forEach((fn: any) => fn.calls?.reset?.());
    Object.values(auth).forEach((fn: any) => fn.calls?.reset?.());
    cdr.detectChanges.calls.reset();
    router.navigate.calls.reset();

    component = new FeedComponent(reviewService, auth, cdr, router);
  });

  it('loadReviews() soporta respuesta tipo Array', () => {
    const reviewsArray = [
      { _id: '1', spotify_id: 's1', target_type: 'track' },
      { _id: '2', spotify_id: 's2', target_type: 'album' },
      { _id: '3', spotify_id: 's3', target_type: 'artist' },
    ] as any[];

    reviewService.getReviews.and.returnValue(of(reviewsArray));
    spyOn(component, 'enrichReviewsWithSpotifyInfo').and.callFake(() => {
      component.loading = false;
    });

    component.loadReviews();

    expect(reviewService.getReviews).toHaveBeenCalled();
    expect(component.enrichReviewsWithSpotifyInfo).toHaveBeenCalled();
    expect(component.loading).toBeFalse();
  });

  it('loadReviews() soporta respuesta tipo { reviews: [...] }', () => {
    const payload = {
      reviews: [
        { _id: '1', spotify_id: 's1', target_type: 'track' },
        { _id: '2', spotify_id: 's2', target_type: 'album' },
      ],
      totalPages: 1,
    };

    reviewService.getReviews.and.returnValue(of(payload));
    spyOn(component, 'enrichReviewsWithSpotifyInfo').and.callFake(() => {
      component.loading = false;
    });

    component.loadReviews();

    expect(reviewService.getReviews).toHaveBeenCalled();
    expect(component.enrichReviewsWithSpotifyInfo).toHaveBeenCalled();
    expect(component.loading).toBeFalse();
  });

  it('enrichReviewsWithSpotifyInfo() hace 1 llamada getSpotifyItemInfo por review (evidencia N+1) y termina con loading=false', () => {
    const reviews = [
      { _id: '1', spotify_id: 's1', target_type: 'track', item_name: 'n1', item_cover_url: null, item_artists: [] },
      { _id: '2', spotify_id: 's2', target_type: 'album', item_name: 'n2', item_cover_url: null, item_artists: [] },
      { _id: '3', spotify_id: 's3', target_type: 'artist', item_name: 'n3', item_cover_url: null, item_artists: [] },
    ] as any[];

    reviewService.getSpotifyItemInfo.and.returnValue(
      of({ name: 'spotifyName', artists: [{ name: 'A' }], images: [{ url: 'img' }] })
    );

    component.loading = true;
    component.enrichReviewsWithSpotifyInfo(reviews, true, false);

    expect(reviewService.getSpotifyItemInfo).toHaveBeenCalledTimes(reviews.length);
    expect(component.loading).toBeFalse();
    expect(component.reviews.length).toBe(3);
  });

  it('viewItemReviews(): toggle abre/cierra correctamente (selectedItemId y selectedItemReviews)', () => {
    reviewService.getReviewsBySpotifyId.and.returnValue(of([{ _id: 'x' }]));

    component.viewItemReviews('s1', 'track');
    expect(component.selectedItemId).toBe('s1');
    expect(component.isLoadingReviews).toBeFalse();
    expect(component.selectedItemReviews).toEqual([{ _id: 'x' }]);
    expect(reviewService.getReviewsBySpotifyId).toHaveBeenCalledTimes(1);

    // Segunda llamada con mismo id: cierra y NO llama de nuevo al service
    component.viewItemReviews('s1', 'track');
    expect(component.selectedItemId).toBe('');
    expect(component.selectedItemReviews).toEqual([]);
    expect(reviewService.getReviewsBySpotifyId).toHaveBeenCalledTimes(1);
  });

  it('toggleLike(): like/unlike actualiza likes y Set de likedReviews', () => {
    component.currentUserId = 'u1';
    component.reviews = [{ _id: 'r1', likes: 0 } as any];

    reviewService.likeReview.and.returnValue(of({ likes: 1 }));
    reviewService.unlikeReview.and.returnValue(of({ likes: 0 }));

    // Like
    component.toggleLike(component.reviews[0] as any);
    expect(reviewService.likeReview).toHaveBeenCalledWith('r1');
    expect(component.reviews[0].likes).toBe(1);
    expect(component.likedReviews.has('r1')).toBeTrue();

    // Unlike
    component.toggleLike(component.reviews[0] as any);
    expect(reviewService.unlikeReview).toHaveBeenCalledWith('r1');
    expect(component.reviews[0].likes).toBe(0);
    expect(component.likedReviews.has('r1')).toBeFalse();
  });
});

