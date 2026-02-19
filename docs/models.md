# models.py

`scripts/models.py` は、名山データを表す Pydantic v2 モデルを定義するファイルです。

## モデル一覧

```
Visit
MeizanProperties
PointGeometry
MeizanFeature
MeizanFeatureCollection
```

GeoJSON の階層構造にそのまま対応しています。

```
MeizanFeatureCollection
└── features: list[MeizanFeature]
    ├── geometry: PointGeometry
    │   └── coordinates: (経度, 緯度)
    └── properties: MeizanProperties
        └── visits: list[Visit]  ← --with-records 時のみ
```

## 各モデルの詳細

### `Visit` — 1回の登頂記録

```python
class Visit(BaseModel):
    date: str   # "YYYY/MM/DD"
    note: str
```

`date` フィールドは `@field_validator` で `YYYY/MM/DD` 形式を強制しており、フォーマット違反の場合は `ValueError` が発生します。

### `PointGeometry` — GeoJSON Point

```python
class PointGeometry(BaseModel):
    type: Literal["Point"] = "Point"
    coordinates: tuple[float, float]  # (経度, 緯度)
```

GeoJSON の仕様どおり、座標は **(経度, 緯度)** の順です（緯度・経度の逆順に注意）。`type` は `Literal["Point"]` で固定されており、誤った型の指定をコンパイル時に検出できます。

### `MeizanProperties` — 山1件のプロパティ

```python
class MeizanProperties(BaseModel):
    no: int
    name: str
    yomi: str
    elev_m: int
    location: str
    region: str
    note: str
    count: int | None = None
    visits: list[Visit] | None = None
```

`count` と `visits` はオプションフィールドです。`--with-records` なしで変換した場合、これらは `None` のまま残りますが、`model_dump(exclude_none=True)` により出力 JSON には含まれません。

### `MeizanFeature` — GeoJSON Feature（山1件）

```python
class MeizanFeature(BaseModel):
    type: Literal["Feature"] = "Feature"
    geometry: PointGeometry
    properties: MeizanProperties
```

### `MeizanFeatureCollection` — GeoJSON FeatureCollection（全山）

```python
class MeizanFeatureCollection(BaseModel):
    type: Literal["FeatureCollection"] = "FeatureCollection"
    features: list[MeizanFeature]
```

## シリアライズ

```python
collection = MeizanFeatureCollection(features=features)
geojson_data = collection.model_dump(exclude_none=True)
geojson_str  = json.dumps(geojson_data, ensure_ascii=False, indent=2)
```

`exclude_none=True` により `count`・`visits` が `None` のフィールドは出力から除外されます。これによって `--with-records` あり・なしで同じコードパスを使いながら出力を切り替えられます。

## 依存関係

```
pydantic >= 2.0
```

`uv add pydantic` でインストール済みです。Pydantic v1 とは API が異なるため、v2 系を使用してください（`model_dump()` は v1 の `dict()` に相当します）。
