import { Router } from "express";
import {
  searchTracksCtrl,
  searchAlbumsCtrl,
  searchArtistsCtrl,
  getTrackCtrl,
  getAlbumCtrl,
  getArtistCtrl,
} from "../../controllers/spotify/spotifyController.js";

const spotifyRoutes = Router();

// /api/spotify/tracks?q=...
spotifyRoutes.get("/tracks", searchTracksCtrl);

// /api/spotify/albums?q=...
spotifyRoutes.get("/albums", searchAlbumsCtrl);

// /api/spotify/tracks/:id
spotifyRoutes.get("/tracks/:id", getTrackCtrl);

// /api/spotify/albums/:id
spotifyRoutes.get("/albums/:id", getAlbumCtrl);

// /api/spotify/artists?q=...
spotifyRoutes.get("/artists", searchArtistsCtrl);

// /api/spotify/artists/:id
spotifyRoutes.get("/artists/:id", getArtistCtrl);

export default spotifyRoutes;

