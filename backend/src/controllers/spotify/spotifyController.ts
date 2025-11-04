import { Request, Response } from "express";
import { searchTracks, searchAlbums, getAlbumById, getTrackById } from "../../services/spotify/spotifyService.js";

export async function searchTracksCtrl(req: Request, res: Response) {
  const q = String(req.query.q || "").trim();
  if (!q) return res.status(400).json({ error: "Missing ?q=" });
  res.json(await searchTracks(q));
}

export async function searchAlbumsCtrl(req: Request, res: Response) {
  const q = String(req.query.q || "").trim();
  if (!q) return res.status(400).json({ error: "Missing ?q=" });
  res.json(await searchAlbums(q));
}

export async function getTrackCtrl(req: Request, res: Response) {
  res.json(await getTrackById(req.params.id));
}

export async function getAlbumCtrl(req: Request, res: Response) {
  res.json(await getAlbumById(req.params.id));
}

