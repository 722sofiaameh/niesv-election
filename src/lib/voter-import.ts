import { normalizePhoneNumber } from "@/lib/phone";

export type VoterImportRow = {
  name: string;
  phoneNumber: string;
  memberRegistrationNumber: string;
};

export const VOTER_CSV_HEADERS = [
  "name",
  "phoneNumber",
  "registrationNumber",
] as const;

export const VOTER_CSV_TEMPLATE = `${VOTER_CSV_HEADERS.join(",")}
John Doe,08031234567,NIESV-001
Jane Smith,08039876543,NIESV-002
`;

export type VoterImportRowResult = {
  rowNumber: number;
  raw: Record<string, string>;
  data?: VoterImportRow;
  errors: string[];
};

export type VoterImportValidation = {
  rows: VoterImportRowResult[];
  validRows: VoterImportRow[];
  invalidCount: number;
  validCount: number;
};

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase());
  const rows = lines.slice(1).map(parseCsvLine);
  return { headers, rows };
}

function mapHeader(headers: string[], row: string[]): Record<string, string> {
  const mapped: Record<string, string> = {};
  headers.forEach((header, index) => {
    mapped[header] = row[index]?.trim() ?? "";
  });
  return mapped;
}

function getField(raw: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    if (raw[key]) return raw[key];
  }
  return "";
}

export function validateVoterCsv(
  csvText: string,
  existingPhones: Set<string>,
): VoterImportValidation {
  const { headers, rows } = parseCsv(csvText);
  const results: VoterImportRowResult[] = [];

  if (headers.length === 0) {
    return {
      rows: [
        {
          rowNumber: 0,
          raw: {},
          errors: ["CSV file is empty."],
        },
      ],
      validRows: [],
      invalidCount: 1,
      validCount: 0,
    };
  }

  const hasName = headers.includes("name");
  const hasPhone =
    headers.includes("phonenumber") ||
    headers.includes("phone") ||
    headers.includes("phone number");
  const hasRegistration =
    headers.includes("registrationnumber") ||
    headers.includes("memberregistrationnumber") ||
    headers.includes("registration number");

  if (!hasName || !hasPhone || !hasRegistration) {
    return {
      rows: [
        {
          rowNumber: 0,
          raw: {},
          errors: [
            "CSV must include columns: name, phoneNumber, registrationNumber.",
          ],
        },
      ],
      validRows: [],
      invalidCount: 1,
      validCount: 0,
    };
  }

  const seenPhones = new Set<string>();

  rows.forEach((row, index) => {
    const raw = mapHeader(headers, row);
    const errors: string[] = [];

    const name = getField(raw, ["name"]);
    const phoneRaw = getField(raw, [
      "phonenumber",
      "phone",
      "phone number",
    ]);
    const registrationNumber = getField(raw, [
      "registrationnumber",
      "memberregistrationnumber",
      "registration number",
    ]);

    if (!name) errors.push("Missing name.");
    if (!phoneRaw) errors.push("Missing phone number.");
    if (!registrationNumber) errors.push("Missing registration number.");

    let normalizedPhone: string | null = null;
    if (phoneRaw) {
      normalizedPhone = normalizePhoneNumber(phoneRaw);
      if (!normalizedPhone) {
        errors.push(`Malformed phone number: "${phoneRaw}".`);
      } else if (seenPhones.has(normalizedPhone)) {
        errors.push("Duplicate phone number within this file.");
      } else if (existingPhones.has(normalizedPhone)) {
        errors.push("Phone number already registered in the database.");
      }
    }

    if (normalizedPhone) {
      seenPhones.add(normalizedPhone);
    }

    const rowResult: VoterImportRowResult = {
      rowNumber: index + 2,
      raw: {
        name,
        phoneNumber: phoneRaw,
        registrationNumber,
      },
      errors,
    };

    if (errors.length === 0 && normalizedPhone) {
      rowResult.data = {
        name,
        phoneNumber: normalizedPhone,
        memberRegistrationNumber: registrationNumber,
      };
    }

    results.push(rowResult);
  });

  const validRows = results
    .map((row) => row.data)
    .filter((row): row is VoterImportRow => Boolean(row));

  return {
    rows: results,
    validRows,
    validCount: validRows.length,
    invalidCount: results.length - validRows.length,
  };
}
