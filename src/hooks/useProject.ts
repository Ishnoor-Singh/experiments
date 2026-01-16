"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { generateProjectUuid } from "@/lib/projectUuid";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

// Since we don't have auth, we'll use a mock userId for now
const MOCK_USER_ID = "demo-user";

export function useProjects() {
  const projects = useQuery(api.projects.list, { userId: MOCK_USER_ID });

  return {
    projects,
    isLoading: projects === undefined,
  };
}

export function useProject(uuid: string) {
  const project = useQuery(api.projects.getByUuid, { uuid });
  const files = useQuery(api.projectFiles.listByProject, { projectUuid: uuid });
  const schemas = useQuery(api.appSchemas.listByProject, { projectUuid: uuid });

  return {
    project,
    files,
    schemas,
    isLoading: project === undefined,
    notFound: project === null,
  };
}

export function useCreateProject() {
  const router = useRouter();
  const createProject = useMutation(api.projects.create);
  const [isCreating, setIsCreating] = useState(false);

  const create = useCallback(
    async (name: string = "Untitled Project") => {
      if (isCreating) return null;

      setIsCreating(true);
      try {
        const uuid = generateProjectUuid();
        await createProject({
          uuid,
          userId: MOCK_USER_ID,
          name,
        });
        router.push(`/builder/${uuid}`);
        return uuid;
      } catch (error) {
        console.error("Failed to create project:", error);
        return null;
      } finally {
        setIsCreating(false);
      }
    },
    [createProject, isCreating, router]
  );

  return {
    create,
    isCreating,
  };
}

export function useDeleteProject() {
  const deleteProject = useMutation(api.projects.remove);
  const [isDeleting, setIsDeleting] = useState(false);

  const remove = useCallback(
    async (uuid: string) => {
      if (isDeleting) return false;

      setIsDeleting(true);
      try {
        await deleteProject({ uuid });
        return true;
      } catch (error) {
        console.error("Failed to delete project:", error);
        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    [deleteProject, isDeleting]
  );

  return {
    remove,
    isDeleting,
  };
}
