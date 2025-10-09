import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { password } = await req.json();

  const adminHash = process.env.ADMIN_HASH;
  if (!adminHash) {
    return NextResponse.json({ success: false, message: "Admin hash not set" }, { status: 500 });
  }

  const isValid = await bcrypt.compare(password, adminHash);

  if (isValid) {
    // puedes usar cookies o localStorage en el cliente para guardar el acceso
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, message: "Incorrect password" }, { status: 401 });
}
