"""
名山 CSV → GeoJSON 変換スクリプト

使い方:
    uv run python scripts/meizan_csv-to-geojson.py              # 登頂記録なし
    uv run python scripts/meizan_csv-to-geojson.py --with-records  # 登頂記録を統合

入力:
    data/csv/original/100meizan02.csv
    data/csv/original/200meizan02.csv
    data/csv/original/300meizan02.csv
    data/csv/my-record/meizan-record.csv  ← --with-records 時のみ使用

出力:
    data/geojson/meizan.geojson

--with-records 時に追加されるプロパティ:
    count  : 登頂記録の件数（0 = 未登頂）
    visits : 登頂記録の一覧 [{date, note}, ...]
"""

import argparse
import csv
import json
from collections import defaultdict
from pathlib import Path

from models import (
    MeizanFeature,
    MeizanFeatureCollection,
    MeizanProperties,
    PointGeometry,
    Visit,
)

BASE_DIR = Path(__file__).parent.parent

INPUT_FILES = [
    BASE_DIR / "data/csv/original/100meizan02.csv",
    BASE_DIR / "data/csv/original/200meizan02.csv",
    BASE_DIR / "data/csv/original/300meizan02.csv",
]

RECORD_FILE = BASE_DIR / "data/csv/my-record/meizan-record.csv"

OUTPUT_FILE = BASE_DIR / "data/geojson/meizan.geojson"


def load_records(path: Path) -> dict[int, list[Visit]]:
    """meizan-record.csv を読み込み、{山頂ID: [Visit, ...]} を返す"""
    records: dict[int, list[Visit]] = defaultdict(list)
    with open(path, encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            summit_id = int(row["山頂ID"])
            records[summit_id].append(Visit(date=row["年月日"], note=row["備考"]))
    return records


def csv_row_to_feature(row: dict, records: dict[int, list[Visit]] | None) -> MeizanFeature:
    """CSV の1行を MeizanFeature に変換する"""
    no = int(row["No"])
    visits = records.get(no, []) if records is not None else None

    properties = MeizanProperties(
        no=no,
        name=row["山名"],
        yomi=row["よみがな"],
        elev_m=int(row["標高（m）"]),
        location=row["所在地"],
        region=row["地域名"],
        note=row["備考"],
        count=len(visits) if visits is not None else None,
        visits=visits if visits is not None else None,
    )

    return MeizanFeature(
        geometry=PointGeometry(coordinates=(float(row["東経"]), float(row["北緯"]))),
        properties=properties,
    )


def main():
    parser = argparse.ArgumentParser(description="名山 CSV → GeoJSON 変換")
    parser.add_argument(
        "--with-records",
        action="store_true",
        help="登頂記録 (meizan-record.csv) を統合して count / visits プロパティを追加する",
    )
    args = parser.parse_args()

    records = load_records(RECORD_FILE) if args.with_records else None

    features: list[MeizanFeature] = []
    for path in INPUT_FILES:
        with open(path, encoding="utf-8", newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                # 空行を除外
                if not row["No"].strip():
                    continue
                features.append(csv_row_to_feature(row, records))

    collection = MeizanFeatureCollection(features=features)

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(
            collection.model_dump(exclude_none=True),
            f,
            ensure_ascii=False,
            indent=2,
        )

    print(f"変換完了: {len(features)} 件 → {OUTPUT_FILE}")
    if args.with_records:
        visited = sum(1 for feat in features if feat.properties.count and feat.properties.count > 0)
        print(f"登頂記録あり: {visited} 山 / 未登頂: {len(features) - visited} 山")


if __name__ == "__main__":
    main()
