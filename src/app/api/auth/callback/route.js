export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  // Send code to backend securely
  await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/google/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  return Response.redirect(
  `${process.env.NEXT_PUBLIC_FRONTEND_URL}?connected=true`
);

}
