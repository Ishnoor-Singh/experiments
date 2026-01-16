"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface SchemaViewProps {
  projectUuid: string;
}

export function SchemaView({ projectUuid }: SchemaViewProps) {
  const schemas = useQuery(api.appSchemas.listByProject, { projectUuid });

  if (schemas === undefined) {
    return (
      <div className="p-4 text-zinc-500 text-sm">Loading schemas...</div>
    );
  }

  if (schemas.length === 0) {
    return (
      <div className="p-4 text-zinc-500 text-sm">
        <p className="mb-2">No schemas defined yet</p>
        <p className="text-xs text-zinc-600">
          Schemas will appear here when you create data tables for your app
        </p>
      </div>
    );
  }

  return (
    <div className="p-2">
      {schemas.map((schema) => (
        <div
          key={schema._id}
          className="mb-4 bg-zinc-800 rounded-lg overflow-hidden"
        >
          {/* Table header */}
          <div className="px-3 py-2 bg-zinc-700 flex items-center gap-2">
            <svg
              className="w-4 h-4 text-indigo-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
              />
            </svg>
            <span className="font-medium text-sm">{schema.tableName}</span>
          </div>

          {/* Fields */}
          <div className="divide-y divide-zinc-700">
            {schema.fields.map((field, idx) => (
              <div
                key={idx}
                className="px-3 py-2 flex items-center gap-2 text-sm"
              >
                <span className="text-zinc-300 flex-1">{field.name}</span>
                <span className="text-xs text-zinc-500 bg-zinc-700 px-2 py-0.5 rounded">
                  {field.type}
                </span>
                {field.required && (
                  <span className="text-xs text-yellow-500">required</span>
                )}
                {field.relationTo && (
                  <span className="text-xs text-indigo-400">
                    → {field.relationTo}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
