// 背景地図の定義
const BASEMAPS = {
  'osm': {
    label: 'OSM 標準',
    icon: '🗺️',
    tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    tileSize: 256,
    maxzoom: 19,
  },
  'gsi-std': {
    label: '地理院 標準',
    icon: '📍',
    tiles: ['https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png'],
    attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>',
    tileSize: 256,
    maxzoom: 18,
  },
  'gsi-pale': {
    label: '地理院 淡色',
    icon: '🎨',
    tiles: ['https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png'],
    attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>',
    tileSize: 256,
    maxzoom: 18,
  },
  'gsi-photo': {
    label: '地理院 写真',
    icon: '🛰️',
    tiles: ['https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg'],
    attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>',
    tileSize: 256,
    maxzoom: 18,
  },
};

const DEFAULT_BASEMAP = 'osm';

// 全ソース・レイヤーを初期スタイルに含めてまとめて登録
const sources = {};
const layers = [];

Object.entries(BASEMAPS).forEach(([key, config]) => {
  sources[key] = {
    type: 'raster',
    tiles: config.tiles,
    tileSize: config.tileSize,
    attribution: config.attribution,
    maxzoom: config.maxzoom,
  };
  layers.push({
    id: key,
    type: 'raster',
    source: key,
    layout: {
      visibility: key === DEFAULT_BASEMAP ? 'visible' : 'none',
    },
  });
});

// MapLibre GL JS の初期化
const map = new maplibregl.Map({
  container: 'map',
  style: {
    version: 8,
    sources,
    layers,
  },
  center: [139.767, 35.681], // 東京
  zoom: 10,
});

// コントロール追加
map.addControl(new maplibregl.NavigationControl(), 'top-left');
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');
map.addControl(new maplibregl.FullscreenControl(), 'top-left');

// 地形 DEM ソースとスカイレイヤーをロード後に追加
const TERRAIN_SOURCE_ID = 'terrain-dem';

map.on('load', () => {
  map.addSource(TERRAIN_SOURCE_ID, {
    type: 'raster-dem',
    tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
    tileSize: 256,
    encoding: 'terrarium',
    maxzoom: 12,
    attribution: '© <a href="https://registry.opendata.aws/terrain-tiles/">Mapzen, Amazon</a>',
  });

  // ヒルシェード（陰影）レイヤー：3D有効時に表示
  map.addLayer({
    id: 'hillshade',
    type: 'hillshade',
    source: TERRAIN_SOURCE_ID,
    layout: { visibility: 'none' },
    paint: {
      'hillshade-exaggeration': 0.5,
      'hillshade-shadow-color': '#473B24',
    },
  });

  map.addLayer({
    id: 'sky',
    type: 'sky',
    paint: {
      'sky-type': 'atmosphere',
      'sky-atmosphere-sun': [0, 90],
      'sky-atmosphere-sun-intensity': 15,
    },
  });
});

// 背景地図切替ボタンを動的生成
let currentBasemap = DEFAULT_BASEMAP;

const buttonContainer = document.getElementById('layer-buttons');

Object.entries(BASEMAPS).forEach(([key, config]) => {
  const btn = document.createElement('button');
  btn.className = 'layer-btn' + (key === DEFAULT_BASEMAP ? ' active' : '');
  btn.dataset.key = key;
  btn.innerHTML = `<span class="icon">${config.icon}</span>${config.label}`;
  buttonContainer.appendChild(btn);

  btn.addEventListener('click', () => {
    if (key === currentBasemap) return;

    // 現在のレイヤーを非表示、選択レイヤーを表示
    map.setLayoutProperty(currentBasemap, 'visibility', 'none');
    map.setLayoutProperty(key, 'visibility', 'visible');
    currentBasemap = key;

    // ボタンのアクティブ状態を更新
    document.querySelectorAll('.layer-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// 3D地形切替ボタン
let is3D = false;

const viewButtonContainer = document.getElementById('view-buttons');
const btn3D = document.createElement('button');
btn3D.className = 'layer-btn';
btn3D.innerHTML = '<span class="icon">🏔️</span>3D地形';
viewButtonContainer.appendChild(btn3D);

btn3D.addEventListener('click', () => {
  is3D = !is3D;
  if (is3D) {
    map.setTerrain({ source: TERRAIN_SOURCE_ID, exaggeration: 1.5 });
    map.setLayoutProperty('hillshade', 'visibility', 'visible');
    map.easeTo({ pitch: 60, bearing: -20, duration: 800 });
    btn3D.classList.add('active');
  } else {
    map.setTerrain(null);
    map.setLayoutProperty('hillshade', 'visibility', 'none');
    map.easeTo({ pitch: 0, bearing: 0, duration: 800 });
    btn3D.classList.remove('active');
  }
});

// 傾きスライダー
const pitchControl = document.createElement('div');
pitchControl.className = 'camera-control';
pitchControl.innerHTML =
  '<div class="control-label"><span>傾き</span><span id="pitch-value">0°</span></div>' +
  '<input type="range" class="control-slider" id="pitch-slider" min="0" max="85" value="0" step="1">';
viewButtonContainer.appendChild(pitchControl);

const pitchSlider = document.getElementById('pitch-slider');
const pitchValueLabel = document.getElementById('pitch-value');

pitchSlider.addEventListener('input', () => {
  map.easeTo({ pitch: Number(pitchSlider.value), duration: 0 });
  pitchValueLabel.textContent = `${pitchSlider.value}°`;
});

// マップ操作（ドラッグなど）でpitchが変わった場合もスライダーに反映
map.on('pitchend', () => {
  const pitch = Math.round(map.getPitch());
  pitchSlider.value = pitch;
  pitchValueLabel.textContent = `${pitch}°`;
});

// 真上に戻すボタン
const resetViewBtn = document.createElement('button');
resetViewBtn.className = 'layer-btn';
resetViewBtn.innerHTML = '<span class="icon">⬆️</span>真上に戻す';
viewButtonContainer.appendChild(resetViewBtn);

resetViewBtn.addEventListener('click', () => {
  map.easeTo({ pitch: 0, bearing: 0, duration: 600 });
  pitchSlider.value = 0;
  pitchValueLabel.textContent = '0°';
});
