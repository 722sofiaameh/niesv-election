#!/usr/bin/env python3
"""Extract branch eligible voters from the official PDF into import CSV."""

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
EMAIL = re.compile(r"[\w.+-]+@[\w.-]+\.\w+")
PHONE = re.compile(r"(?:\+?234|0)?([789]\d{9})")
SERIAL = re.compile(r"^\d+\s+")


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
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    records: list[dict[str, str]] = []
    buffer: list[str] = []

    def flush_buffer() -> None:
        nonlocal buffer
        if not buffer:
            return
        chunk = " ".join(buffer)
        buffer = []

        email_match = EMAIL.search(chunk)
        if not email_match:
            return
        email = email_match.group(0)
        before_email = chunk[: email_match.start()].strip()

        reg_match = REG_ID.search(before_email)
        if not reg_match:
            return
        reg = reg_match.group(1).upper()
        before_reg = before_email[: reg_match.start()].strip()

        phone_raw = before_email[reg_match.end() :].strip()
        phone = None
        for candidate in PHONE.findall(phone_raw):
            phone = normalize_phone(candidate)
            if phone:
                break
        if not phone:
            for candidate in PHONE.findall(before_email):
                phone = normalize_phone(candidate)
                if phone:
                    break
        if not phone:
            return

        name = SERIAL.sub("", before_reg)
        name = re.sub(r"\(MRS\.?\)|\(MRS\)|\(PST\.?\)", "", name, flags=re.IGNORECASE)
        name = re.sub(r"\s+", " ", name).strip(" ,")
        if not name:
            return

        records.append(
            {
                "name": name,
                "phoneNumber": phone,
                "registrationNumber": reg,
            }
        )

    for line in lines:
        upper = line.upper()
        if upper.startswith("S/NO") or "FINAL LIST OF ELIGIBLE VOTERS" in upper:
            flush_buffer()
            continue
        if upper in {"FELLOWS", "MEMBERS", "MEMBER"}:
            flush_buffer()
            continue
        if "NIGERIAN INSTITUTION OF ESTATE SURVEYORS" in upper:
            flush_buffer()
            continue

        if EMAIL.search(line):
            buffer.append(line)
            flush_buffer()
        elif buffer or SERIAL.match(line) or REG_ID.search(line):
            buffer.append(SERIAL.sub("", line))

    flush_buffer()
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
        / "FINAL LIST OF ELIGIBLE VOTERS FOR THE BRANCH EXECUTIVE ELECTION 2026.pdf"
    )
    out_path = Path(
        sys.argv[2]
        if len(sys.argv) > 2
        else Path(__file__).resolve().parent / "data" / "branch-eligible.csv"
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

    print(f"Extracted {len(rows)} voter(s) to {out_path}")


if __name__ == "__main__":
    main()
