/* Uses SunriseSunset.io API https://sunrisesunset.io/api/ .
https://api.sunrisesunset.io/json?lat=38.907192&long=-77.036873&date=today */



const fetchBtn = document.getElementById('fetchBtn');
const clearBtn = document.getElementById('clearBtn');
const preset = document.getElementById('preset');
const latInput = document.getElementById('lat');
const lngInput = document.getElementById('lng');
const placeholder = document.getElementById('placeholder');
const resultsArea = document.getElementById('results');
const locationName = document.getElementById('locationName');
const tzElem = document.getElementById('tz');
const lastUpdated = document.getElementById('lastUpdated');
const errorBox = document.getElementById('error');



const ids = {
  'today-length': document.getElementById('today-length'),
  'today-dawn': document.getElementById('today-dawn'),
  'today-sunrise': document.getElementById('today-sunrise'),
  'today-noon': document.getElementById('today-noon'),
  'today-sunset': document.getElementById('today-sunset'),
  'today-dusk': document.getElementById('today-dusk'),

  
  'tom-length': document.getElementById('tom-length'),
  'tom-dawn': document.getElementById('tom-dawn'),
  'tom-sunrise': document.getElementById('tom-sunrise'),
  'tom-noon': document.getElementById('tom-noon'),
  'tom-sunset': document.getElementById('tom-sunset'),
  'tom-dusk': document.getElementById('tom-dusk'),
  
};



function getLatLng() {
  const customLat = latInput.value.trim();
  const customLng = lngInput.value.trim();

  if (customLat !== '' && customLng !== '') {
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng, label: `Custom: ${lat.toFixed(5)}, ${lng.toFixed(5)}` };
    } else {
      throw new Error('Custom coordinates are not valid numbers.');
    }
  }

  
  const opt = preset.options[preset.selectedIndex];
  const lat = parseFloat(opt.dataset.lat);
  const lng = parseFloat(opt.dataset.lng);
  const label = opt.textContent;
  return { lat, lng, label };
}




function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove('hidden');
  errorBox.classList.remove('hidden'); 
  errorBox.classList.add('error');
  
  resultsArea.querySelector('.grid').style.opacity = '0.4';
}


function clearError() {
  errorBox.textContent = '';
  errorBox.classList.add('hidden');
  resultsArea.querySelector('.grid').style.opacity = '1';
}


function apiUrl(lat, lng, date) {
  const base = 'https://api.sunrisesunset.io/json';
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    date: date
  });
  return `${base}?${params.toString()}`;
}


function populate(dayKey, data) {

  const prefix = dayKey === 'today' ? 'today' : 'tom';
  ids[`${prefix}-length`].textContent = data.day_length ?? '—';
  ids[`${prefix}-dawn`].textContent = data.dawn ?? '—';
  ids[`${prefix}-sunrise`].textContent = data.sunrise ?? '—';
  ids[`${prefix}-noon`].textContent = data.solar_noon ?? '—';
  ids[`${prefix}-sunset`].textContent = data.sunset ?? '—';
  ids[`${prefix}-dusk`].textContent = data.dusk ?? '—';

}

function showResultsArea() {
  placeholder.style.display = 'none';
  resultsArea.classList.remove('hidden');
}

async function fetchAndDisplay() {
  clearError();
  try {
    const { lat, lng, label } = getLatLng();

   
    locationName.textContent = `${label}`;
    tzElem.textContent = 'Timezone: loading…';
    lastUpdated.textContent = 'Loading…';
    
    showResultsArea();

    
    const urls = [apiUrl(lat, lng, 'today'), apiUrl(lat, lng, 'tomorrow')];

    const responses = await Promise.all(urls.map(u => fetch(u).then(res => {
      if (!res.ok) throw new Error(`Network error: ${res.status} ${res.statusText}`);
      return res.json();
    })));

   
    for (let i = 0; i < responses.length; i++) {
      const payload = responses[i];
      if (!payload || payload.status !== 'OK' || !payload.results) {
        const msg = payload && payload.message ? payload.message : `API returned an error for ${i === 0 ? 'today' : 'tomorrow'}`;
        throw new Error(msg);
      }
    }

    const todayData = responses[0].results;
    const tomData = responses[1].results;

   
    populate('today', todayData);
    populate('tom', tomData);

   
    const tz = todayData.timezone ?? tomData.timezone ?? 'Unknown';
    tzElem.textContent = `Timezone: ${tz}`;

   
    const now = new Date();
    lastUpdated.textContent = `Last fetched: ${now.toLocaleString()}`;

  
    clearError();

  } catch (err) {
    console.error(err);
    showResultsArea();
    showError(typeof err === 'string' ? err : (err.message || 'An unexpected error occurred.'));
  }
}





fetchBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  
  fetchBtn.disabled = true;
  fetchBtn.textContent = 'Loading…';
  try {
    await fetchAndDisplay();
  } finally {
    fetchBtn.disabled = false;
    fetchBtn.textContent = 'Get Sun Times';
  }
});

clearBtn.addEventListener('click', (e) => {
  e.preventDefault();

  latInput.value = '';
  lngInput.value = '';
  preset.selectedIndex = 0;
  placeholder.style.display = 'flex';
  resultsArea.classList.add('hidden');
  clearError();
});

