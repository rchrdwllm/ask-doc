import { client } from "@/lib/api";
import { headers } from "next/headers";

export default async function DocumentPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const incoming = await headers();
  const { data, error } = await client.documents({ id }).get({
    headers: {
      cookie: incoming.get('cookie') ?? '',
    }
  });

  if (!data) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold">Documents</h1>
        <p className="mt-2 text-muted-foreground">
          {error ? `Error loading documents: ${error.value.message}` : "Loading..."}
        </p>
      </div>
    )
  }

  return (
    <main>
      <h1 className="text-2xl font-bold">{data.title}</h1>
    </main>
  )
}