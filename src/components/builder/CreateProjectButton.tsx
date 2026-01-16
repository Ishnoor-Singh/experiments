"use client";

import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { generateProjectUuid } from "@/lib/projectUuid";

// Since we don't have auth, we'll use a mock userId for now
const MOCK_USER_ID = "demo-user";

export function CreateProjectButton() {
  const router = useRouter();
  const createProject = useMutation(api.projects.create);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (isCreating) return;

    setIsCreating(true);
    try {
      const uuid = generateProjectUuid();
      await createProject({
        uuid,
        userId: MOCK_USER_ID,
        name: "Untitled Project",
      });
      router.push(`/builder/${uuid}`);
    } catch (error) {
      console.error("Failed to create project:", error);
      setIsCreating(false);
    }
  };

  return (
    <button
      onClick={handleCreate}
      disabled={isCreating}
      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
    >
      {isCreating ? "Creating..." : "New Project"}
    </button>
  );
}
