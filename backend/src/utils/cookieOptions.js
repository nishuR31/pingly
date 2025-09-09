export default function cookieOptions(type = "access") {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "None", // ✅ Needed for cross-site cookies
    path: "/", // ✅ Required to be available across the app
    maxAge: 1000 * 60 * 60 * 24 * (type === "access" ? 1 : 7), // 1 or 7 days
  };
}
