import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useStore } from '@/app/store';
import { getProject, updateProject, type Project, type ProjectMetadata } from '@/lib/api';
import { Canvas } from '@/features/canvas/Canvas';
import { ResourcePalette } from '@/features/sidebar/ResourcePalette';
import { PropertiesPanel } from '@/features/sidebar/PropertiesPanel';
import { Button } from '@/components/ui/button';
import { ProjectSettingsModal } from '@/components/ProjectSettingsModal';
import { ThemeToggle } from '@/components/ThemeToggle';

export function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load project on mount
  useEffect(() => {
    if (!projectId) return;

    const loadProject = async () => {
      try {
        const data = await getProject(parseInt(projectId, 10));
        setProject(data);

        // Load diagram data into the store
        const store = useStore.getState();
        // Clear existing nodes/edges first
        useStore.setState({ nodes: [], edges: [] });

        // Add nodes from project
        if (data.diagram_data?.nodes) {
          data.diagram_data.nodes.forEach((node: any) => {
            store.addNode(node);
          });
        }
        // Add edges
        if (data.diagram_data?.edges) {
          useStore.setState({ edges: data.diagram_data.edges as any });
        }
      } catch (error) {
        console.error('Failed to load project:', error);
        navigate('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [projectId, navigate]);

  const handleSave = async () => {
    if (!projectId || !project) return;

    setIsSaving(true);
    try {
      await updateProject(parseInt(projectId, 10), {
        diagram_data: { nodes: nodes as any, edges: edges as any },
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save project:', error);
      alert('Failed to save project');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async (metadata: ProjectMetadata) => {
    if (!projectId || !project) return;

    // Send region and terraform_version as top-level fields (backend expects them there)
    await updateProject(parseInt(projectId, 10), {
      region: metadata.region,
      terraform_version: metadata.terraform_version,
    });

    // Update local project state
    setProject({
      ...project,
      region: metadata.region || project.region,
      terraform_version: metadata.terraform_version || project.terraform_version,
      meta_data: metadata,
    });
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="text-slate-500 dark:text-slate-400">Loading project...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-100 dark:bg-slate-900">
      {/* Header */}
      <header className="h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-600" />
          <h1 className="font-semibold text-slate-900 dark:text-white">{project?.name}</h1>
        </div>
        <div className="flex items-center gap-4">
          {lastSaved && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <ProjectSettingsModal
            currentMetadata={{
              region: project?.region,
              terraform_version: project?.terraform_version,
            }}
            onSave={handleSaveSettings}
          />
          <ThemeToggle />
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </header>

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Resource Palette */}
        <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-y-auto shrink-0">
          <ResourcePalette />
        </aside>

        {/* Canvas */}
        <main className="flex-1">
          <Canvas />
        </main>

        {/* Right Sidebar - Properties Panel */}
        <aside className="w-80 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 overflow-y-auto shrink-0">
          <PropertiesPanel projectId={project?.id} region={project?.region} />
        </aside>
      </div>
    </div>
  );
}
