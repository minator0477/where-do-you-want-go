# meizan_csv-to-geojson.py

`scripts/meizan_csv-to-geojson.py` は、名山 CSV ファイルを GeoJSON に変換するスクリプトです。

## 使い方

```bash
# 登頂記録なし（山名・標高などの基本情報のみ）
uv run python scripts/meizan_csv-to-geojson.py

# 登頂記録あり（count / visits プロパティを追加）
uv run python scripts/meizan_csv-to-geojson.py --with-records
```

## 入力ファイル

| ファイル | 内容 |
|---------|------|
| `data/csv/original/100meizan02.csv` | 日本百名山（No.1–100） |
| `data/csv/original/200meizan02.csv` | 日本二百名山（No.101–200） |
| `data/csv/original/300meizan02.csv` | 日本三百名山（No.201–300） |
| `data/csv/my-record/meizan-record.csv` | 個人の登頂記録（`--with-records` 時のみ使用） |

### CSV カラム（原本）

| カラム名 | 説明 |
|---------|------|
| `No` | 通し番号（百名山: 1–100、二百: 101–200、三百: 201–300） |
| `山名` | 山の名前 |
| `よみがな` | 読み仮名 |
| `標高（m）` | 標高（整数） |
| `北緯` | 緯度（十進数） |
| `東経` | 経度（十進数） |
| `所在地` | 都道府県など |
| `地域名` | 地方区分 |
| `備考` | メモ |

### meizan-record.csv カラム

| カラム名 | 説明 |
|---------|------|
| `山頂ID` | 原本 CSV の `No` に対応 |
| `年月日` | 登頂日（`YYYY/MM/DD` 形式） |
| `備考` | 登頂時のメモ |

## 出力ファイル

| ファイル | 説明 |
|---------|------|
| `data/geojson/meizan.geojson` | GeoJSON FeatureCollection |
| `data/geojson/meizan.js` | `MEIZAN_GEOJSON` 変数として export した JS ファイル（`file://` 直接開き用） |

### GeoJSON プロパティ一覧

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `no` | `int` | 通し番号 |
| `name` | `str` | 山名 |
| `yomi` | `str` | 読み仮名 |
| `elev_m` | `int` | 標高（m） |
| `location` | `str` | 所在地 |
| `region` | `str` | 地域名 |
| `note` | `str` | 備考 |
| `count` | `int` | 登頂回数（`--with-records` 時のみ） |
| `visits` | `list` | 登頂記録一覧（`--with-records` 時のみ） |

`count` / `visits` は `--with-records` なしの場合、`exclude_none=True` により出力から省かれます。

## 実装方針

### データ統合のキー

百/二百/三百名山 CSV の `No` と `meizan-record.csv` の `山頂ID` を突き合わせることで登頂記録を統合します。`No` は全 301 山で一意であるため、そのまま辞書キーとして使用します。

```
100meizan02.csv  → No=1 ~ 100
200meizan02.csv  → No=101 ~ 200
300meizan02.csv  → No=201 ~ 300
meizan-record.csv → 山頂ID が上記 No に対応
```

### Pydantic モデルの利用

変換処理は `scripts/models.py` で定義した Pydantic v2 モデルを通じて行います（詳細は [models.md](models.md) を参照）。

- CSV 行を `MeizanProperties` に変換 → 型チェック・バリデーションが自動実行される
- `MeizanFeatureCollection.model_dump(exclude_none=True)` で JSON シリアライズ

### JS ファイルの生成

HTTP サーバーなしで `index.html` を `file://` から開けるよう、GeoJSON 文字列を JS 変数としてラップしたファイルを同時生成します。

```python
f.write(f"const MEIZAN_GEOJSON = {geojson_str};\n")
```

`index.html` から `<script src="data/geojson/meizan.js"></script>` で読み込み、`main.js` 内で `MEIZAN_GEOJSON` をグローバル変数として参照します。
