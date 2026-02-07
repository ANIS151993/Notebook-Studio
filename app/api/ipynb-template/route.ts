import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export async function GET() {
  const filePath = path.join(
    process.cwd(),
    "app",
    "ipynb",
    "clean_csv_template.ipynb",
  );
  const template = await readFile(filePath, "utf8");
  return new NextResponse(template, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
