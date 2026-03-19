import { useState, useEffect } from 'react';
import { Search, Wind, Droplets, MapPin, AlertCircle } from 'lucide-react';
import './index.css';

// Using a free API key format.
// Replace this with your actual OpenWeatherMap API key if you have one.
const API_KEY = "512e3edac25b8e824c189e5c8f415bf8"; 

function App() {
  const [query, setQuery] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // 'metric' for Celsius, 'imperial' for Fahrenheit
  const [unit, setUnit] = useState('metric');
  
  // History: load from local storage
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('weather-search-history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save history to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('weather-search-history', JSON.stringify(history));
  }, [history]);

  const addToHistory = (city) => {
    // Only keep unique, max 5 entries
    const newHistory = [city, ...history.filter(c => c.toLowerCase() !== city.toLowerCase())].slice(0, 5);
    setHistory(newHistory);
  };

  const fetchWeather = async (city, systemUnit = unit) => {
    if (!city.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Mock data bypass for demo purposes if API key is not set
      if (API_KEY === "YOUR_API_KEY_HERE" || !API_KEY) {
        await new Promise(res => setTimeout(res, 800)); // fake network delay
        
        // Throw an error for random cities to demo error state
        if (city.toLowerCase() === 'error') {
            throw new Error('City not found');
        }

        const isMetric = systemUnit === 'metric';
        const baseTemp = city.toLowerCase() === 'london' ? 12 : (city.toLowerCase() === 'tokyo' ? 18 : 24);
        const temp = isMetric ? baseTemp : (baseTemp * 9/5) + 32;
        
        // Mock icons based on city length to have some variety
        const iconCode = city.length > 6 ? "04d" : (city.length % 2 === 0 ? "02d" : "01d");
        const description = iconCode === "01d" ? "clear sky" : (iconCode === "02d" ? "few clouds" : "broken clouds");

        const mockData = {
          name: city.charAt(0).toUpperCase() + city.slice(1),
          sys: { country: "Mock" },
          main: { temp: temp, humidity: 65 - (city.length * 2) },
          wind: { speed: isMetric ? (4.5 + city.length/2).toFixed(1) : (10 + city.length).toFixed(1) },
          weather: [{ main: description.includes('cloud') ? "Clouds" : "Clear", description, icon: iconCode }]
        };
        setWeatherData(mockData);
        addToHistory(city);
        setLoading(false);
        return;
      }

      // Actual API Call
      const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=${systemUnit}&appid=${API_KEY}`);
      const data = await res.json();
      
      if (!res.ok) {
        if (data.cod == '401') {
          throw new Error('API key is invalid or not yet activated (usually takes 10-15 mins to activate).');
        }
        throw new Error(data.message || 'City not found');
      }
      
      setWeatherData(data);
      addToHistory(data.name);
      
    } catch (err) {
      setError(err.message || 'Something went wrong');
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch weather when unit changes, but only if we have a current searched city
  useEffect(() => {
    if (weatherData && weatherData.name) {
      fetchWeather(weatherData.name, unit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchWeather(query);
  };

  const handlePillClick = (city) => {
    setQuery(city);
    fetchWeather(city);
  };

  const getBackgroundClass = () => {
    if (!weatherData) return 'default';
    const condition = weatherData.weather[0].main.toLowerCase();
    
    if (condition.includes('clear')) return 'clear';
    if (condition.includes('cloud')) return 'clouds';
    if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('thunderstorm')) return 'rain';
    if (condition.includes('snow')) return 'snow';
    
    return 'default';
  };

  return (
    <div className={`app-container ${getBackgroundClass()}`}>
      <div className="weather-card">
        
        <form className="search-section" onSubmit={handleSearch}>
          <input 
            type="text" 
            className="search-input"
            placeholder="Search for a city..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="search-btn" disabled={loading}>
            <Search size={20} />
          </button>
        </form>

        <div className="header-actions">
          <div className="unit-toggle">
            <button 
              className={`unit-btn ${unit === 'metric' ? 'active' : ''}`}
              onClick={() => setUnit('metric')}
              type="button"
            >
              °C
            </button>
            <button 
              className={`unit-btn ${unit === 'imperial' ? 'active' : ''}`}
              onClick={() => setUnit('imperial')}
              type="button"
            >
              °F
            </button>
          </div>
        </div>

        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Fetching weather...</p>
          </div>
        )}

        {error && !loading && (
          <div className="error-container">
            <AlertCircle size={48} className="error-icon" />
            <p className="error-text">{error}</p>
            {API_KEY === "YOUR_API_KEY_HERE" && (
                <p style={{fontSize: '0.85rem', marginTop: '12px', opacity: 0.8, background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px'}}>
                  Using Mock Mode. Provide a valid API key in App.jsx to search real cities!
                </p>
            )}
          </div>
        )}

        {!loading && !error && !weatherData && (
          <div className="error-container" style={{opacity: 0.7}}>
            <MapPin size={48} style={{marginBottom: '15px'}} />
            <p style={{fontSize: '1.2rem', fontWeight: 500}}>Enter a city name to see the weather</p>
            {API_KEY === "YOUR_API_KEY_HERE" && (
                <p style={{fontSize: '0.85rem', marginTop: '12px', opacity: 0.7}}>
                  (Test it without an API key using any city name)
                </p>
            )}
          </div>
        )}

        {weatherData && !loading && !error && (
          <>
            <div className="weather-info">
              <img 
                src={`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@4x.png`} 
                alt={weatherData.weather[0].description} 
                className="weather-icon"
              />
              <h1 className="temperature">
                {Math.round(weatherData.main.temp)}°
              </h1>
              <div className="city-name">
                {weatherData.name}, {weatherData.sys.country}
              </div>
              <div className="condition-text">
                {weatherData.weather[0].description}
              </div>
            </div>

            <div className="details-grid">
              <div className="detail-item">
                <div className="detail-icon">
                  <Droplets size={24} color="#fff" />
                </div>
                <div className="detail-info">
                  <span className="detail-label">Humidity</span>
                  <span className="detail-value">{weatherData.main.humidity}%</span>
                </div>
              </div>
              
              <div className="detail-item">
                <div className="detail-icon">
                  <Wind size={24} color="#fff" />
                </div>
                <div className="detail-info">
                  <span className="detail-label">Wind Speed</span>
                  <span className="detail-value">
                    {weatherData.wind.speed} {unit === 'metric' ? 'm/s' : 'mph'}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {history.length > 0 && (
          <div className="history-section">
            <h3 className="history-title">Recently Searched</h3>
            <div className="history-pills">
              {history.map((city, index) => (
                <button 
                  key={index}
                  className="history-pill"
                  onClick={() => handlePillClick(city)}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
