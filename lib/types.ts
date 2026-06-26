export type CurrentWeather = {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windspeed: number;
  winddirection: number;
  pressure: number;
  uvIndex: number;
  visibility: number;
  cloudcover: number;
  weathercode: number;
};

export type DailyForecast = {
  date: string;
  tempMin: number;
  tempMax: number;
  precipitation: number;
  windspeedMax: number;
  weathercode: number;
  precipitationProbability: number;
};

export type HourlyForecast = {
  time: string;
  temperature: number;
  precipitation: number;
  windspeed: number;
  precipitationProbability: number;
  weathercode: number;
};

export type OpenMeteoResponse = {
  current: CurrentWeather;
  daily: DailyForecast[];
  hourly: HourlyForecast[];
};
