import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ReviewService } from './review.service';
import { AuthService } from './auth.service';

describe('ReviewService', () => {
  let service: ReviewService;
  let httpMock: HttpTestingController;
  let auth: jasmine.SpyObj<AuthService>;

  const API = 'http://127.0.0.1:3000';

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['getAccessToken']);

    TestBed.configureTestingModule({
      providers: [
        ReviewService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth },
      ],
    });

    service = TestBed.inject(ReviewService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getReviews(page, limit) incluye Authorization (si hay token) y params page/limit', (done) => {
    auth.getAccessToken.and.returnValue('t1');

    service.getReviews(2, 10).subscribe({
      next: () => done(),
      error: done.fail,
    });

    const req = httpMock.expectOne((r) => r.url === `${API}/api/reviews`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer t1');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('limit')).toBe('10');
    req.flush({ reviews: [] });
  });

  it('likeReview/unlikeReview: POST a endpoints esperados con Authorization', (done) => {
    auth.getAccessToken.and.returnValue('t1');

    let completed = 0;
    const checkDone = () => {
      completed++;
      if (completed === 2) done();
    };

    service.likeReview('r1').subscribe({ next: () => checkDone(), error: done.fail });
    const likeReq = httpMock.expectOne(`${API}/api/reviews/like/r1`);
    expect(likeReq.request.method).toBe('POST');
    expect(likeReq.request.headers.get('Authorization')).toBe('Bearer t1');
    likeReq.flush({ likes: 1 });

    service.unlikeReview('r1').subscribe({ next: () => checkDone(), error: done.fail });
    const unlikeReq = httpMock.expectOne(`${API}/api/reviews/unlike/r1`);
    expect(unlikeReq.request.method).toBe('POST');
    expect(unlikeReq.request.headers.get('Authorization')).toBe('Bearer t1');
    unlikeReq.flush({ likes: 0 });
  });

  it('getSpotifyItemInfo(): construye endpoint según targetType (track/album/artist)', (done) => {
    auth.getAccessToken.and.returnValue('t1');

    let completed = 0;
    const checkDone = () => {
      completed++;
      if (completed === 3) done();
    };

    service.getSpotifyItemInfo('id1', 'track').subscribe({ next: () => checkDone(), error: done.fail });
    const trackReq = httpMock.expectOne(`${API}/api/spotify/tracks/id1`);
    expect(trackReq.request.method).toBe('GET');
    trackReq.flush({});

    service.getSpotifyItemInfo('id2', 'album').subscribe({ next: () => checkDone(), error: done.fail });
    const albumReq = httpMock.expectOne(`${API}/api/spotify/albums/id2`);
    expect(albumReq.request.method).toBe('GET');
    albumReq.flush({});

    service.getSpotifyItemInfo('id3', 'artist').subscribe({ next: () => checkDone(), error: done.fail });
    const artistReq = httpMock.expectOne(`${API}/api/spotify/artists/id3`);
    expect(artistReq.request.method).toBe('GET');
    artistReq.flush({});
  });

  it('getReviewsBySpotifyId(): incluye query param target_type', (done) => {
    auth.getAccessToken.and.returnValue('t1');

    service.getReviewsBySpotifyId('sp1', 'album').subscribe({
      next: () => done(),
      error: done.fail,
    });

    const req = httpMock.expectOne((r) => r.url === `${API}/api/reviews/spotify/sp1`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('target_type')).toBe('album');
    req.flush([]);
  });
});

