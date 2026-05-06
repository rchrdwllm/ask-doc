'use client'

import { client } from "@/lib/api";
import { useEffect } from "react";

export default function DashboardPage() {
  useEffect(() => {
    const fetch = async () => {
      const res = await client.get();

      console.log({ res })
    };

    fetch();
  }, [])

  return (
    <h1>Dashboard</h1>
  )
}