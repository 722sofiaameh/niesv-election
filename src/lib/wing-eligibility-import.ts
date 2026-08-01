import { prisma } from "@/lib/prisma";
import { normalizePhoneNumber } from "@/lib/phone";
import { normalizeRegistrationNumber } from "@/lib/wing-eligibility";
import { parseCsv } from "@/lib/voter-import";

export type WingEligibilityImportRow = {
  name: string;
  phoneNumber: string;
  memberRegistrationNumber: string | null;
};

export type WingEligibilityImportRowResult = {
  rowNumber: number;
  raw: Record<string, string>;
  data?: WingEligibilityImportRow;
  errors: string[];
};

export type WingEligibilityImportValidation = {
  rows: WingEligibilityImportRowResult[];
  validRows: WingEligibilityImportRow[];
  invalidCount: number;
  validCount: number;
};

function getField(raw: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    if (raw[key]) return raw[key];
  }
  return "";
}

export function validateWingEligibilityCsv(
  csvText: string,
): WingEligibilityImportValidation {
  const { headers, rows } = parseCsv(csvText);
  const results: WingEligibilityImportRowResult[] = [];

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

  if (!hasName || !hasPhone) {
    return {
      rows: [
        {
          rowNumber: 0,
          raw: {},
          errors: ["CSV must include columns: name and phoneNumber."],
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
    const registrationRaw = hasRegistration
      ? getField(raw, [
          "registrationnumber",
          "memberregistrationnumber",
          "registration number",
        ])
      : "";

    if (!name) errors.push("Missing name.");
    if (!phoneRaw) errors.push("Missing phone number.");

    let normalizedPhone: string | null = null;
    if (phoneRaw) {
      normalizedPhone = normalizePhoneNumber(phoneRaw);
      if (!normalizedPhone) {
        errors.push(`Malformed phone number: "${phoneRaw}".`);
      } else if (seenPhones.has(normalizedPhone)) {
        errors.push("Duplicate phone number within this file.");
      }
    }

    if (normalizedPhone) {
      seenPhones.add(normalizedPhone);
    }

    const rowResult: WingEligibilityImportRowResult = {
      rowNumber: index + 2,
      raw: {
        name,
        phoneNumber: phoneRaw,
        registrationNumber: registrationRaw,
      },
      errors,
    };

    if (errors.length === 0 && normalizedPhone) {
      rowResult.data = {
        name,
        phoneNumber: normalizedPhone,
        memberRegistrationNumber: registrationRaw
          ? normalizeRegistrationNumber(registrationRaw)
          : null,
      };
    }

    results.push(rowResult);
  });

  const validRows = results
    .map((row) => row.data)
    .filter((row): row is WingEligibilityImportRow => Boolean(row));

  return {
    rows: results,
    validRows,
    validCount: validRows.length,
    invalidCount: results.length - validRows.length,
  };
}

function mapHeader(headers: string[], row: string[]): Record<string, string> {
  const mapped: Record<string, string> = {};
  headers.forEach((header, index) => {
    mapped[header] = row[index]?.trim() ?? "";
  });
  return mapped;
}

export async function commitWingEligibilityImport(
  wingId: string,
  rows: WingEligibilityImportRow[],
): Promise<number> {
  await prisma.wingEligibleVoter.deleteMany({ where: { wingId } });

  const result = await prisma.wingEligibleVoter.createMany({
    data: rows.map((row) => ({
      wingId,
      name: row.name,
      phoneNumber: row.phoneNumber,
      memberRegistrationNumber: row.memberRegistrationNumber,
    })),
  });

  await prisma.wing.update({
    where: { id: wingId },
    data: { requiresEligibility: true },
  });

  return result.count;
}
