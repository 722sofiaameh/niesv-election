#!/usr/bin/env python3
"""Extract Women's Wing eligible voters from the official PDF (no email column)."""

from __future__ import annotations

import csv
import re
import sys
from pathlib import Path

try:
    from pypdf import PdfReader
except ImportError:
    print("Install pypdf first: pip install pypdf", file=sys.stderr)
    sys.exit(1)

REG_ID = re.compile(r"\b((?:FL|M)\d+)\b", re.IGNORECASE)
PHONE = re.compile(r"\b(0?[789]\d{9})\b")
SERIAL = re.compile(r"^\d+\.\s*")


def normalize_phone(raw: str) -> str | None:
    digits = re.sub(r"\D", "", raw)
    if digits.startswith("234") and len(digits) >= 13:
        digits = digits[-10:]
    if digits.startswith("0") and len(digits) == 11:
        digits = digits[1:]
    if len(digits) == 10 and digits[0] in "789":
        return f"234{digits}"
    return None


def extract_text(pdf_path: Path) -> str:
    reader = PdfReader(str(pdf_path))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def parse_records(text: str) -> list[dict[str, str]]:
    records: list[dict[str, str]] = []

    for line in text.splitlines():
        line = line.strip()
        if not line or line.upper().startswith("S/N"):
            continue
        if "FINAL LIST OF ELIGIBLE VOTERS" in line.upper():
            continue
        if "NIGERIAN INSTITUTION OF ESTATE SURVEYORS" in line.upper():
            continue

        line = SERIAL.sub("", line)
        reg_match = REG_ID.search(line)
        phone_match = PHONE.search(line)
        if not reg_match or not phone_match:
            continue

        reg = reg_match.group(1).upper()
        phone = normalize_phone(phone_match.group(1))
        if not phone:
            continue

        name = line[: reg_match.start()].strip(" .")
        name = re.sub(r"\s+", " ", name)
        if not name:
            continue

        records.append(
            {
                "name": name,
                "phoneNumber": phone,
                "registrationNumber": reg,
            }
        )

    return records


def dedupe_by_phone(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    seen: set[str] = set()
    unique: list[dict[str, str]] = []
    for row in rows:
        phone = row["phoneNumber"]
        if phone in seen:
            continue
        seen.add(phone)
        unique.append(row)
    return unique


def main() -> None:
    pdf_path = Path(
        sys.argv[1]
        if len(sys.argv) > 1
        else Path.home()
        / "Downloads"
        / "FINAL LIST OF ELIGIBLE VOTERS FOR THE COMMITTEE OF MEMBERS ELECTION.pdf"
    )
    out_path = Path(
        sys.argv[2]
        if len(sys.argv) > 2
        else Path(__file__).resolve().parent / "data" / "womens-wing-eligible.csv"
    )

    if not pdf_path.exists():
        print(f"PDF not found: {pdf_path}", file=sys.stderr)
        sys.exit(1)

    text = extract_text(pdf_path)
    rows = dedupe_by_phone(parse_records(text))
    out_path.parent.mkdir(parents=True, exist_ok=True)

    with out_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["name", "phoneNumber", "registrationNumber"],
        )
        writer.writeheader()
        writer.writerows(rows)

    print(f"Extracted {len(rows)} Women's Wing voter(s) to {out_path}")


if __name__ == "__main__":
    main()
