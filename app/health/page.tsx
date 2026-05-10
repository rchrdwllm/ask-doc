import { client } from "@/lib/api";

export default async function HealthPage() {
  const res = await client.health.get();

  if (res.error) {
    const { message } = res.error.value;

    return (
      <div>
        <p>
          Health check failed: {message}
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
