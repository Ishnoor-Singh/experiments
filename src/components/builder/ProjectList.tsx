"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";

// Since we don't have auth, we'll use a mock userId for now
const MOCK_USER_ID = "demo-user";

interface DeleteConfirmDialogProps {
  projectName: string;
  isOpen: boolean;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmDialog({
  projectName,
  isOpen,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-800 rounded-lg p-6 max-w-md w-full border border-zinc-700 shadow-xl">
        <h3 className="text-lg font-semibold mb-2">Delete Project</h3>
        <p className="text-zinc-400 mb-6">
          Are you sure you want to delete <span className="text-white font-medium">&quot;{projectName}&quot;</span>?
          This will permanently delete all files, schemas, and data. This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-sm rounded-md bg-zinc-700 hover:bg-zinc-600 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm rounded-md bg-red-600 hover:bg-red-500 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Project"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

interface Project {
  _id: string;
  uuid?: string;
  name: string;
  createdAt: number;
}

interface ProjectCardProps {
  project: Project;
  onDeleteClick: (project: Project) => void;
}

function ProjectCard({ project, onDeleteClick }: ProjectCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  if (!project.uuid) return null;

  return (
    <div className="relative group">
      <Link
        href={`/builder/${project.uuid}`}
        className="block p-6 bg-zinc-800 rounded-lg border border-zinc-700 hover:border-zinc-600 transition-colors"
      >
        <h3 className="font-semibold text-lg mb-2 pr-8">{project.name}</h3>
        <p className="text-sm text-zinc-400">
          Created {new Date(project.createdAt).toLocaleDateString()}
        </p>
      </Link>

      {/* Menu button */}
      <div className="absolute top-4 right-4">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-700 opacity-0 group-hover:opacity-100 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>

        {/* Dropdown menu */}
        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 top-8 bg-zinc-700 rounded-md shadow-lg border border-zinc-600 z-20 py-1 min-w-[120px]">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowMenu(false);
                  onDeleteClick(project);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-zinc-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function ProjectList() {
  const projects = useQuery(api.projects.list, { userId: MOCK_USER_ID });
  const deleteProject = useMutation(api.projects.remove);

  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !deleteTarget.uuid) return;

    setIsDeleting(true);
    try {
      await deleteProject({ uuid: deleteTarget.uuid });
      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete project:", error);
    } finally {
      setIsDeleting(false);
    }
  };

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
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <ProjectCard
            key={project._id}
            project={project}
            onDeleteClick={setDeleteTarget}
          />
        ))}
      </div>

      <DeleteConfirmDialog
        projectName={deleteTarget?.name ?? ""}
        isOpen={deleteTarget !== null}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
