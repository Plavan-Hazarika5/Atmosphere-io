# Weather & Mood UI

A standalone React app that combines live weather data with a mood-driven interface.

**Status:** v1.0 release candidate  
**Live Demo:** _add your Vercel URL here_  
**Repository:** _add your GitHub URL here_

## Features

- City search with Open-Meteo geocoding
- Current weather details with condition-to-mood mapping
- Dynamic theme glow and animated particle background
- 5-day forecast cards
- Celsius/Fahrenheit toggle
- Saved recent cities using localStorage
- "Use My Location" geolocation support

## Tech

- React + Vite
- Open-Meteo APIs (no API key required)

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy to Vercel

1. Push this project to a GitHub repository.
2. In Vercel, click **Add New Project** and import the repo.
3. Use defaults:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Deploy.

No environment variables are required for the current Open-Meteo integration.

## Portfolio checklist

- Add 3 screenshots to a `screenshots/` folder
- Add a live demo URL at the top of this README
- Add a 30-60 second project walkthrough clip
