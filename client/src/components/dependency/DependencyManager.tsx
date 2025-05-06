import React, { useState, useEffect } from 'react';
import { useDependencyContext } from '@/context/DependencyContext';
import { Dependency, DependencyStatus, DependencyDataTypes } from '@/lib/dependency/DependencyInterfaces';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Trash2, Pause, Play, Link, Link2Off } from 'lucide-react';

/**
 * Component for managing dependencies between components.
 * Allows viewing, suspending/resuming, and removing dependencies.
 */
export default function DependencyManager() {
  const { registry, suspendDependency, resumeDependency, removeDependency } = useDependencyContext();
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [selectedDependencyId, setSelectedDependencyId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  // Load dependencies when the component mounts
  useEffect(() => {
    refreshDependencies();
  }, []);

  // Function to refresh the list of dependencies
  const refreshDependencies = () => {
    // Get all dependencies for all data types
    const allDataTypes = Object.values(DependencyDataTypes);
    let allDependencies: Dependency[] = [];
    
    allDataTypes.forEach(dataType => {
      const depsForType = registry.getDependenciesByType(dataType);
      allDependencies = [...allDependencies, ...depsForType];
    });
    
    // Remove duplicates by ID
    const uniqueDependencies = Array.from(
      new Map(allDependencies.map(dep => [dep.id, dep])).values()
    );
    
    setDependencies(uniqueDependencies);
  };

  // Handle suspending a dependency
  const handleSuspend = (dependencyId: string) => {
    suspendDependency(dependencyId);
    toast({
      title: "Dependency Suspended",
      description: `Dependency ${dependencyId.substring(0, 8)} has been suspended.`,
      variant: "default",
    });
    refreshDependencies();
  };

  // Handle resuming a dependency
  const handleResume = (dependencyId: string) => {
    resumeDependency(dependencyId);
    toast({
      title: "Dependency Resumed",
      description: `Dependency ${dependencyId.substring(0, 8)} has been resumed.`,
      variant: "default",
    });
    refreshDependencies();
  };

  // Handle removing a dependency
  const handleRemove = (dependencyId: string) => {
    setSelectedDependencyId(dependencyId);
    setIsDeleteDialogOpen(true);
  };

  // Confirm dependency removal
  const confirmRemove = () => {
    if (selectedDependencyId) {
      removeDependency(selectedDependencyId);
      toast({
        title: "Dependency Removed",
        description: `Dependency ${selectedDependencyId.substring(0, 8)} has been removed.`,
        variant: "default",
      });
      setIsDeleteDialogOpen(false);
      setSelectedDependencyId(null);
      refreshDependencies();
    }
  };

  // Get status badge for each dependency
  const getStatusBadge = (status: DependencyStatus) => {
    switch (status) {
      case DependencyStatus.CONNECTED:
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Connected</Badge>;
      case DependencyStatus.READY:
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Ready</Badge>;
      case DependencyStatus.SUSPENDED:
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Suspended</Badge>;
      case DependencyStatus.ERROR:
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Error</Badge>;
      case DependencyStatus.CONNECTING:
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">Connecting</Badge>;
      case DependencyStatus.CYCLE_DETECTED:
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Cycle Detected</Badge>;
      case DependencyStatus.DISCONNECTED:
        return <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/20">Disconnected</Badge>;
      case DependencyStatus.OPTIMIZING:
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Optimizing</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-5 w-5" />
          Dependency Manager
        </CardTitle>
        <CardDescription>
          View, suspend, resume, or remove dependencies between components.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {dependencies.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No dependencies found. Create dependencies by connecting components.
          </div>
        ) : (
          <Table>
            <TableCaption>List of all dependencies in the system</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Consumer</TableHead>
                <TableHead>Data Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dependencies.map((dep) => (
                <TableRow key={dep.id}>
                  <TableCell className="font-mono text-xs">
                    {dep.id.substring(4, 12)}
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">{dep.providerId}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">{dep.consumerId}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono">
                      {dep.dataType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(dep.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {dep.status !== DependencyStatus.SUSPENDED ? (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleSuspend(dep.id)}
                          title="Suspend dependency"
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleResume(dep.id)}
                          title="Resume dependency"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleRemove(dep.id)}
                        title="Remove dependency"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={refreshDependencies}>
          Refresh
        </Button>
      </CardFooter>

      <AlertDialog 
        open={isDeleteDialogOpen} 
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the dependency. Components will no longer be able to share data through this connection unless it is recreated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}