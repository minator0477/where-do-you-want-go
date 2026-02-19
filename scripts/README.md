# scripts/

データの変換・加工スクリプトを格納するディレクトリです。

## 想定するスクリプト

| スクリプト例 | 説明 |
|-------------|------|
| `csv_to_geojson.py` | CSV → GeoJSON 変換 |
| `gpx_to_geojson.py` | GPX トラックログ → GeoJSON 変換 |
| `filter_places.py`  | データのフィルタリング・クリーニング |

## 実行環境

スクリプトごとに必要なライブラリや実行方法をファイル先頭のコメントに記載してください。

```python
# 使い方: python csv_to_geojson.py input.csv output.geojson
# 依存: pip install pandas geojson
```

## 出力先

変換後のファイルは `../data/` に出力してください。
