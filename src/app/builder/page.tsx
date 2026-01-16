import { ProjectList } from "@/components/builder/ProjectList";
import { CreateProjectButton } from "@/components/builder/CreateProjectButton";

export default function BuilderPage() {
  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Builder</h1>
            <p className="text-zinc-400 mt-1">
              Create and manage your projects
            </p>
          </div>
          <CreateProjectButton />
        </div>
        <ProjectList />
      </div>
    </div>
  );
}
