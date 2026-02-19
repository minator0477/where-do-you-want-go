# where-do-you-want-go

行きたい場所・行った場所の可視化

## ディレクトリ構成

```
where-do-you-want-go/
├── index.html        # メインページ
├── main.js           # 地図の初期化・操作ロジック
├── style.css         # スタイルシート
├── data/             # 地図に描画するデータファイル（GeoJSON, CSV など）
├── scripts/          # データ変換・加工スクリプト
├── assets/           # アイコン・画像などの静的アセット
└── docs/             # プロジェクトドキュメント
```

各ディレクトリの詳細は、それぞれの `README.md` を参照してください。

## 使用技術

- [MapLibre GL JS](https://maplibre.org/) - ベクトルタイル地図ライブラリ
- [OpenStreetMap](https://www.openstreetmap.org/) - 地図タイル
- [国土地理院タイル](https://maps.gsi.go.jp/development/ichiran.html) - 地図タイル（標準・淡色・写真）
