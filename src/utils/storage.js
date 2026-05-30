const PREFIX = 'gallinero_';

export const KEYS = {
  CONFIG:       PREFIX + 'config',
  PRODUCCION:   PREFIX + 'produccion',
  VENTAS:       PREFIX + 'ventas',
  ALIMENTACION: PREFIX + 'alimentacion',
  VACUNAS:      PREFIX + 'vacunas',
  ENFERMEDADES: PREFIX + 'enfermedades',
  MORTALIDAD:   PREFIX + 'mortalidad',
  GASTOS:       PREFIX + 'gastos',
};

export const DEFAULT_CONFIG = {
  usuarios: ['Miguel', 'Mamá'],
  gallinasIniciales: 36,
  precioPorPieza: 2.5,
  precioPorDocena: 28,
  umbralStockBajo: 50,
};

export const getItem = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const setItem = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const getConfig = () => getItem(KEYS.CONFIG, DEFAULT_CONFIG);

export const setConfig = (cfg) => setItem(KEYS.CONFIG, cfg);

export const exportAll = () => {
  const data = {};
  Object.entries(KEYS).forEach(([k, v]) => {
    data[k.toLowerCase()] = getItem(v, k === 'CONFIG' ? DEFAULT_CONFIG : []);
  });
  return data;
};
