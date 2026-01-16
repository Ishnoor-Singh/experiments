"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";

// Since we don't have auth, we'll use a mock userId for now
const MOCK_USER_ID = "demo-user";

export function ProjectList() {
  const projects = useQuery(api.projects.list, { userId: MOCK_USER_ID });

  if (projects === undefined) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 bg-zinc-800 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-zinc-400 mb-4">No projects yet</div>
        <p className="text-sm text-zinc-500">
          Create your first project to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <Link
          key={project._id}
          href={`/builder/${project.uuid}`}
          className="block p-6 bg-zinc-800 rounded-lg border border-zinc-700 hover:border-zinc-600 transition-colors"
        >
          <h3 className="font-semibold text-lg mb-2">{project.name}</h3>
          <p className="text-sm text-zinc-400">
            Created {new Date(project.createdAt).toLocaleDateString()}
          </p>
        </Link>
      ))}
    </div>
  );
}
