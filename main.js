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

// レイヤー切替ボタンを動的生成
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
