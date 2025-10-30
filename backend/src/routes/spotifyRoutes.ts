import { Router } from "express";
import {
  searchTracksCtrl,
  searchAlbumsCtrl,
  getTrackCtrl,
  getAlbumCtrl,
} from "../controllers/spotifyController.js";

const spotifyRoutes = Router();

// /api/spotify/tracks?q=...
spotifyRoutes.get("/tracks", searchTracksCtrl);

// /api/spotify/albums?q=...
spotifyRoutes.get("/albums", searchAlbumsCtrl);

// /api/spotify/tracks/:id
spotifyRoutes.get("/tracks/:id", getTrackCtrl);

// /api/spotify/albums/:id
spotifyRoutes.get("/albums/:id", getAlbumCtrl);

export default spotifyRoutes;
