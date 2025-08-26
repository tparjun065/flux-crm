import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Plus, Search, Edit, Trash2, Eye, Table as TableIcon, Kanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { projectsApi, clientsApi, type Project, type Client } from "@/lib/supabase";
import { KanbanBoard } from "@/components/KanbanBoard";

const statusColors = {
  not_started: "bg-red-500/20 text-red-400 border-red-500/30",
  in_progress: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30"
};

const statusLabels = {
  not_started: "Not Started",
  in_progress: "In Progress", 
  completed: "Completed"
};

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [activeTab, setActiveTab] = useState("table");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    project_name: "",
    client_id: "",
    budget: "",
    deadline: "",
    status: "not_started" as Project['status']
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const filtered = projects.filter(project =>
      project.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.clients?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.clients?.company || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProjects(filtered);
  }, [projects, searchTerm]);

  const loadData = async () => {
    try {
      const [projectsResult, clientsResult] = await Promise.all([
        projectsApi.getAll(),
        clientsApi.getAll()
      ]);

      if (projectsResult.error) throw projectsResult.error;
      if (clientsResult.error) throw clientsResult.error;

      setProjects(projectsResult.data || []);
      setClients(clientsResult.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const projectData = {
        ...formData,
        budget: parseFloat(formData.budget) || 0,
        deadline: formData.deadline || undefined
      };

      if (selectedProject) {
        const { data, error } = await projectsApi.update(selectedProject.id, projectData);
        if (error) throw error;
        setProjects(projects.map(p => p.id === selectedProject.id ? data : p));
        toast({
          title: "Success",
          description: "Project updated successfully",
        });
      } else {
        const { data, error } = await projectsApi.create(projectData);
        if (error) throw error;
        setProjects([data, ...projects]);
        toast({
          title: "Success",
          description: "Project created successfully",
        });
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save project",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const { error } = await projectsApi.delete(id);
      if (error) throw error;
      setProjects(projects.filter(p => p.id !== id));
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = async (projectId: string, newStatus: Project['status']) => {
    try {
      const { data, error } = await projectsApi.update(projectId, { status: newStatus });
      if (error) throw error;
      setProjects(projects.map(p => p.id === projectId ? data : p));
      toast({
        title: "Success",
        description: "Project status updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update project status",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      project_name: "",
      client_id: "",
      budget: "",
      deadline: "",
      status: "not_started"
    });
    setSelectedProject(null);
    setIsViewMode(false);
  };

  const openDialog = (project?: Project, viewMode = false) => {
    if (project) {
      setSelectedProject(project);
      setFormData({
        project_name: project.project_name,
        client_id: project.client_id,
        budget: project.budget.toString(),
        deadline: project.deadline || "",
        status: project.status
      });
    } else {
      resetForm();
    }
    setIsViewMode(viewMode);
    setIsDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-between items-center"
        >
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Projects
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your project portfolio
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()} className="neon-glow">
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-white/10 max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {isViewMode ? "Project Details" : selectedProject ? "Edit Project" : "Add New Project"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="project_name">Project Name *</Label>
                  <Input
                    id="project_name"
                    value={formData.project_name}
                    onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                    required
                    disabled={isViewMode}
                    className="glass border-white/10"
                  />
                </div>
                <div>
                  <Label htmlFor="client_id">Client *</Label>
                  <Select
                    value={formData.client_id}
                    onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                    disabled={isViewMode}
                  >
                    <SelectTrigger className="glass border-white/10">
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent className="glass border-white/10">
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} {client.company && `(${client.company})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="budget">Budget</Label>
                  <Input
                    id="budget"
                    type="number"
                    step="0.01"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    disabled={isViewMode}
                    className="glass border-white/10"
                  />
                </div>
                <div>
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    disabled={isViewMode}
                    className="glass border-white/10"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: Project['status']) => setFormData({ ...formData, status: value })}
                    disabled={isViewMode}
                  >
                    <SelectTrigger className="glass border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass border-white/10">
                      <SelectItem value="not_started">Not Started</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {!isViewMode && (
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading} className="neon-glow">
                      {loading ? "Saving..." : selectedProject ? "Update" : "Create"}
                    </Button>
                  </div>
                )}
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative"
        >
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 glass border-white/10"
          />
        </motion.div>

        {/* View Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="glass border-white/10">
              <TabsTrigger value="table" className="flex items-center space-x-2">
                <TableIcon className="h-4 w-4" />
                <span>Table View</span>
              </TabsTrigger>
              <TabsTrigger value="kanban" className="flex items-center space-x-2">
                <Kanban className="h-4 w-4" />
                <span>Kanban Board</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="table" className="mt-6">
              <Card className="glass border-white/10">
                <CardHeader>
                  <CardTitle>Projects ({filteredProjects.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead>Project Name</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Budget</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            Loading projects...
                          </TableCell>
                        </TableRow>
                      ) : filteredProjects.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No projects found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredProjects.map((project) => (
                          <TableRow key={project.id} className="border-white/10">
                            <TableCell className="font-medium">{project.project_name}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{project.clients?.name}</div>
                                {project.clients?.company && (
                                  <div className="text-sm text-muted-foreground">{project.clients.company}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{formatCurrency(project.budget)}</TableCell>
                            <TableCell>
                              {project.deadline ? new Date(project.deadline).toLocaleDateString() : "-"}
                            </TableCell>
                            <TableCell>
                              <Badge className={statusColors[project.status]}>
                                {statusLabels[project.status]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openDialog(project, true)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openDialog(project)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDelete(project.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="kanban" className="mt-6">
              <KanbanBoard 
                projects={filteredProjects}
                onStatusUpdate={handleStatusUpdate}
                onEdit={(project) => openDialog(project)}
                onDelete={handleDelete}
                onView={(project) => openDialog(project, true)}
              />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </DndProvider>
  );
}