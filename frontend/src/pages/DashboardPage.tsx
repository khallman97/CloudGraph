import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, Trash2, LogOut, Cloud, Clock } from 'lucide-react';
import { useAuthStore } from '@/app/authStore';
import { listProjects, deleteProject, createProject, type ProjectListItem } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/ThemeToggle';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await listProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    setIsCreating(true);
    try {
      const project = await createProject({
        name: newProjectName,
        diagram_data: { nodes: [], edges: [] },
        meta_data: { region: 'us-east-1' },
      });
      setDialogOpen(false);
      setNewProjectName('');
      navigate(`/editor/${project.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await deleteProject(id);
      setProjects(projects.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-1.5 bg-blue-600 rounded-lg">
                <Cloud className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">CloudGraph IDE</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium text-slate-900 dark:text-white">{user?.email}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Logged in</span>
              </div>
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Your Projects</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Design and manage your cloud infrastructure</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 gap-2">
                <Plus className="h-5 w-5" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Give your project a name to get started.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="My AWS Architecture"
                  className="mt-2 h-11"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateProject} disabled={isCreating || !newProjectName.trim()} className="bg-blue-600 hover:bg-blue-700">
                  {isCreating ? 'Creating...' : 'Create Project'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
            <p className="text-slate-500 dark:text-slate-400">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <Card className="border-2 border-dashed border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50">
            <CardContent className="text-center py-16">
              <div className="inline-flex p-4 bg-blue-50 dark:bg-blue-900/30 rounded-full mb-4">
                <FolderOpen className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No projects yet</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
                Create your first project to start designing cloud infrastructure visually.
              </p>
              <Button onClick={() => setDialogOpen(true)} size="lg" className="bg-blue-600 hover:bg-blue-700 gap-2">
                <Plus className="h-5 w-5" />
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="group cursor-pointer hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 bg-white dark:bg-slate-800"
                onClick={() => navigate(`/editor/${project.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {project.name}
                      </CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 -mt-1 -mr-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                      onClick={(e) => handleDeleteProject(project.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Updated {formatDate(project.updated_at)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Cloud className="h-3.5 w-3.5" />
                    <span>Created {formatDate(project.created_at)}</span>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-600 to-transparent mb-3"></div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Open project</span>
                    <span className="text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
