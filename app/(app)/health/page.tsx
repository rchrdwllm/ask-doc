import { client } from "@/lib/api";

export default async function HealthPage() {
  const res = await client.health.get();

  if (res.error) {
    const { code, message } = res.error.value as any;

    return (
      <div>
        <p>
          Health check failed: {message} (code: {code})
        </p>
      </div>
    );
  }

  return (
    <div>
      <p>
        Health check: {res.data.status}
      </p>
    </div>
  )
}
