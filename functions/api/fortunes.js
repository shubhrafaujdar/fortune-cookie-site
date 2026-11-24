export async function onRequestGet(context) {
  try {
    const { results } = await context.env.DB.prepare(
      "SELECT text FROM fortunes"
    ).all();

    return Response.json(results.map((row) => row.text));
  } catch (err) {
    return Response.json(
      { error: "Failed to load fortunes" },
      { status: 500 }
    );
  }
}
