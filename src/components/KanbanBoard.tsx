import { useDrag, useDrop } from "react-dnd";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, Calendar, DollarSign } from "lucide-react";
import { type Project } from "@/lib/supabase";

const statusColumns = [
  { key: 'not_started', title: 'Not Started', color: 'border-red-500/30' },
  { key: 'in_progress', title: 'In Progress', color: 'border-yellow-500/30' },
  { key: 'completed', title: 'Completed', color: 'border-green-500/30' }
];

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onView: (project: Project) => void;
  onStatusUpdate: (projectId: string, newStatus: Project['status']) => void;
}

function ProjectCard({ project, onEdit, onDelete, onView, onStatusUpdate }: ProjectCardProps) {
  const [{ isDragging }, drag] = useDrag({
    type: 'project',
    item: { id: project.id, status: project.status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <motion.div
      ref={drag}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-3"
    >
      <Card className="glass border-white/10 hover:border-primary/30 transition-all duration-300 cursor-move">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium truncate">
            {project.project_name}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="text-xs text-muted-foreground">
            <div className="font-medium">{project.clients?.name}</div>
            {project.clients?.company && (
              <div className="text-xs opacity-75">{project.clients.company}</div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1">
              <DollarSign className="h-3 w-3" />
              <span>{formatCurrency(project.budget)}</span>
            </div>
            {project.deadline && (
              <div className="flex items-center space-x-1 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{new Date(project.deadline).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onView(project)}
                className="h-6 w-6 p-0"
              >
                <Eye className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(project)}
                className="h-6 w-6 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(project.id)}
                className="h-6 w-6 p-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface KanbanColumnProps {
  status: Project['status'];
  title: string;
  projects: Project[];
  color: string;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onView: (project: Project) => void;
  onStatusUpdate: (projectId: string, newStatus: Project['status']) => void;
}

function KanbanColumn({ status, title, projects, color, onEdit, onDelete, onView, onStatusUpdate }: KanbanColumnProps) {
  const [{ isOver }, drop] = useDrop({
    accept: 'project',
    drop: (item: { id: string; status: Project['status'] }) => {
      if (item.status !== status) {
        onStatusUpdate(item.id, status);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`flex-1 min-w-80 min-h-96 p-4 rounded-lg border-2 border-dashed transition-colors duration-300 ${
        isOver ? 'border-primary bg-primary/5' : color
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">{title}</h3>
        <Badge variant="outline" className="text-xs">
          {projects.length}
        </Badge>
      </div>
      
      <div className="space-y-3">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
            onStatusUpdate={onStatusUpdate}
          />
        ))}
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  projects: Project[];
  onStatusUpdate: (projectId: string, newStatus: Project['status']) => void;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onView: (project: Project) => void;
}

export function KanbanBoard({ projects, onStatusUpdate, onEdit, onDelete, onView }: KanbanBoardProps) {
  const getProjectsByStatus = (status: Project['status']) => {
    return projects.filter(project => project.status === status);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex space-x-6 overflow-x-auto pb-4"
    >
      {statusColumns.map((column) => (
        <KanbanColumn
          key={column.key}
          status={column.key as Project['status']}
          title={column.title}
          projects={getProjectsByStatus(column.key as Project['status'])}
          color={column.color}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
          onStatusUpdate={onStatusUpdate}
        />
      ))}
    </motion.div>
  );
}