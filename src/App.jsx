import { useEffect, useMemo, useState } from 'react';
import './App.css';

const DEFAULT_CITY = 'Guwahati';
const SAVED_CITIES_KEY = 'atmosphere-io-saved-cities';

const WEATHER_CODE_MAP = {
  0: { label: 'Clear Sky', emoji: '☀️', mood: 'energetic' },
  1: { label: 'Mainly Clear', emoji: '🌤️', mood: 'uplifted' },
  2: { label: 'Partly Cloudy', emoji: '⛅', mood: 'calm' },
  3: { label: 'Overcast', emoji: '☁️', mood: 'thoughtful' },
  45: { label: 'Fog', emoji: '🌫️', mood: 'quiet' },
  48: { label: 'Fog', emoji: '🌫️', mood: 'quiet' },
  51: { label: 'Light Drizzle', emoji: '🌦️', mood: 'cozy' },
  53: { label: 'Drizzle', emoji: '🌦️', mood: 'cozy' },
  55: { label: 'Dense Drizzle', emoji: '🌧️', mood: 'cozy' },
  61: { label: 'Slight Rain', emoji: '🌧️', mood: 'reflective' },
  63: { label: 'Rain', emoji: '🌧️', mood: 'reflective' },
  65: { label: 'Heavy Rain', emoji: '⛈️', mood: 'dramatic' },
  71: { label: 'Slight Snow', emoji: '🌨️', mood: 'serene' },
  73: { label: 'Snow', emoji: '🌨️', mood: 'serene' },
  75: { label: 'Heavy Snow', emoji: '❄️', mood: 'serene' },
  80: { label: 'Rain Showers', emoji: '🌦️', mood: 'reflective' },
  81: { label: 'Rain Showers', emoji: '🌧️', mood: 'reflective' },
  82: { label: 'Violent Showers', emoji: '⛈️', mood: 'dramatic' },
  95: { label: 'Thunderstorm', emoji: '⛈️', mood: 'dramatic' },
  96: { label: 'Thunderstorm with Hail', emoji: '⛈️', mood: 'dramatic' },
  99: { label: 'Thunderstorm with Hail', emoji: '⛈️', mood: 'dramatic' },
};

const MOOD_THEME = {
  energetic: { bg: 'linear-gradient(135deg, #38bdf8, #facc15)', glow: 'rgba(56, 189, 248, 0.3)' },
  uplifted: { bg: 'linear-gradient(135deg, #7dd3fc, #60a5fa)', glow: 'rgba(125, 211, 252, 0.3)' },
  calm: { bg: 'linear-gradient(135deg, #818cf8, #22d3ee)', glow: 'rgba(129, 140, 248, 0.28)' },
  thoughtful: { bg: 'linear-gradient(135deg, #64748b, #334155)', glow: 'rgba(100, 116, 139, 0.3)' },
  quiet: { bg: 'linear-gradient(135deg, #94a3b8, #475569)', glow: 'rgba(148, 163, 184, 0.28)' },
  cozy: { bg: 'linear-gradient(135deg, #2dd4bf, #2563eb)', glow: 'rgba(45, 212, 191, 0.28)' },
  reflective: { bg: 'linear-gradient(135deg, #3b82f6, #1e293b)', glow: 'rgba(59, 130, 246, 0.28)' },
  dramatic: { bg: 'linear-gradient(135deg, #6d28d9, #0f172a)', glow: 'rgba(109, 40, 217, 0.3)' },
  serene: { bg: 'linear-gradient(135deg, #bae6fd, #e2e8f0)', glow: 'rgba(186, 230, 253, 0.3)' },
  neutral: { bg: 'linear-gradient(135deg, #52525b, #27272a)', glow: 'rgba(113, 113, 122, 0.26)' },
};

const resolveWeather = (code) => WEATHER_CODE_MAP[code] || { label: 'Unknown', emoji: '🌍', mood: 'neutral' };
const celsiusToFahrenheit = (celsius) => Math.round((celsius * 9) / 5 + 32);
const formatWeekday = (dateLabel) => new Date(dateLabel).toLocaleDateString('en-US', { weekday: 'short' });

function getInitialSavedCities() {
  try {
    const raw = localStorage.getItem(SAVED_CITIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function getCoordinates(city) {
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`,
  );

  if (!response.ok) throw new Error('Could not fetch location.');

  const data = await response.json();
  if (!data.results?.length) throw new Error('City not found. Try another one.');

  const [match] = data.results;
  return { name: `${match.name}, ${match.country_code}`, latitude: match.latitude, longitude: match.longitude };
}

async function getLocationFromCoords(latitude, longitude) {
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=en&format=json`,
  );
  if (!response.ok) return `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
  const data = await response.json();
  if (!data.results?.length) return `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
  const [match] = data.results;
  return `${match.name}, ${match.country_code}`;
}

async function getWeather(latitude, longitude) {
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,wind_speed_10m,weather_code&hourly=relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`,
  );
  if (!response.ok) throw new Error('Could not fetch weather right now.');
  const data = await response.json();
  const forecast = (data.daily?.time || []).slice(0, 5).map((day, i) => ({
    date: day,
    code: data.daily.weather_code[i],
    max: Math.round(data.daily.temperature_2m_max[i]),
    min: Math.round(data.daily.temperature_2m_min[i]),
  }));
  return {
    temperature: Math.round(data.current.temperature_2m),
    feelsLike: Math.round(data.current.apparent_temperature),
    wind: Math.round(data.current.wind_speed_10m),
    weatherCode: data.current.weather_code,
    humidity: data.hourly.relative_humidity_2m?.[0] ?? null,
    forecast,
  };
}

function App() {
  const [cityInput, setCityInput] = useState(DEFAULT_CITY);
  const [query, setQuery] = useState(DEFAULT_CITY);
  const [location, setLocation] = useState('');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [unit, setUnit] = useState('C');
  const [savedCities, setSavedCities] = useState(() => getInitialSavedCities());

  const weatherDetails = useMemo(() => resolveWeather(weather?.weatherCode), [weather]);
  const moodTheme = useMemo(() => MOOD_THEME[weatherDetails.mood] || MOOD_THEME.neutral, [weatherDetails.mood]);
  const particles = useMemo(() => Array.from({ length: weatherDetails.mood === 'dramatic' ? 28 : 16 }, (_, i) => i), [weatherDetails.mood]);

  const formatTemp = (celsius) => {
    if (celsius === null || celsius === undefined) return '--';
    return unit === 'F' ? `${celsiusToFahrenheit(celsius)}°F` : `${celsius}°C`;
  };

  const saveCity = (cityName) => {
    if (!cityName) return;
    setSavedCities((prev) => {
      const next = [cityName, ...prev.filter((city) => city.toLowerCase() !== cityName.toLowerCase())].slice(0, 6);
      localStorage.setItem(SAVED_CITIES_KEY, JSON.stringify(next));
      return next;
    });
  };

  const performSearch = async (city) => {
    if (!city.trim()) return;
    try {
      setLoading(true);
      setError('');
      setQuery(city.trim());
      const coords = await getCoordinates(city.trim());
      const currentWeather = await getWeather(coords.latitude, coords.longitude);
      setLocation(coords.name);
      setWeather(currentWeather);
      saveCity(coords.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    await performSearch(cityInput);
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser.');
      return;
    }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const [label, currentWeather] = await Promise.all([
            getLocationFromCoords(latitude, longitude),
            getWeather(latitude, longitude),
          ]);
          setLocation(label);
          setQuery(label);
          setCityInput(label.split(',')[0] || label);
          setWeather(currentWeather);
          saveCity(label);
        } catch {
          setError('Could not load weather for your location.');
        } finally {
          setLocating(false);
        }
      },
      () => {
        setError('Location permission denied. Please allow access and try again.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(DEFAULT_CITY);
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="app-shell">
      <nav className="top-nav">
        <p className="brand">ATMOSPHERE.IO</p>
        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
          API: Open-Meteo
        </a>
      </nav>

      <section
        className="weather-card"
        style={{ boxShadow: `0 0 70px ${moodTheme.glow}` }}
      >
        <div className="weather-bg" style={{ backgroundImage: moodTheme.bg }} />

        <div className="particles">
          {particles.map((particle) => (
            <span key={particle} className="particle" style={{ left: `${(particle * 9) % 100}%`, animationDelay: `${(particle % 6) * 0.35}s` }} />
          ))}
        </div>

        <div className="content">
          <header>
            <p className="eyebrow">Portfolio</p>
            <h1>Atmosphere.io</h1>
            <p className="subtext">Live forecast data turned into mood-driven visuals, themes, saved cities, and a five-day outlook.</p>
          </header>

          <form onSubmit={handleSearch} className="search-row">
            <input value={cityInput} onChange={(e) => setCityInput(e.target.value)} placeholder="Search city..." />
            <button type="submit" disabled={loading}>{loading ? 'Loading...' : 'Get Mood'}</button>
            <button type="button" className="ghost" disabled={locating} onClick={handleLocateMe}>
              {locating ? 'Locating...' : 'Use My Location'}
            </button>
          </form>

          <div className="unit-toggle">
            <button type="button" className={unit === 'C' ? 'active' : ''} onClick={() => setUnit('C')}>Celsius</button>
            <button type="button" className={unit === 'F' ? 'active' : ''} onClick={() => setUnit('F')}>Fahrenheit</button>
          </div>

          {error && <p className="error">{error}</p>}

          {savedCities.length > 0 && (
            <div className="chips">
              {savedCities.map((city) => (
                <button key={city} type="button" onClick={() => performSearch(city.split(',')[0] || city)}>
                  {city}
                </button>
              ))}
            </div>
          )}

          <section className="now-card">
            <div>
              <p className="label">Now in</p>
              <h2>{location || query}</h2>
              <p>{weatherDetails.label}</p>
              <p className="mood">Mood: {weatherDetails.mood}</p>
            </div>
            <span className={`emoji weather-emoji-${weatherDetails.mood}`}>{weatherDetails.emoji}</span>
          </section>

          <section className="stats-grid">
            <article><p className="label">Temperature</p><h3>{weather ? formatTemp(weather.temperature) : '--'}</h3><p>Feels like {weather ? formatTemp(weather.feelsLike) : '--'}</p></article>
            <article><p className="label">Wind</p><h3>{weather ? `${weather.wind} km/h` : '--'}</h3></article>
            <article><p className="label">Humidity</p><h3>{weather?.humidity ?? '--'}{weather ? '%' : ''}</h3></article>
          </section>

          <section className="forecast">
            <p className="label">5-Day Forecast</p>
            <div className="forecast-grid">
              {(weather?.forecast || []).map((day) => {
                const info = resolveWeather(day.code);
                return (
                  <article key={day.date}>
                    <p>{formatWeekday(day.date)}</p>
                    <p className={`emoji-small weather-emoji-${info.mood}`}>{info.emoji}</p>
                    <p className="truncate">{info.label}</p>
                    <p>{formatTemp(day.max)} / {formatTemp(day.min)}</p>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </section>

      <footer className="app-footer">
        <p>Atmosphere.io — portfolio weather experience.</p>
        <p>Open-Meteo data, mood-driven UI, and geolocation.</p>
      </footer>
    </main>
  );
}

export default App;
