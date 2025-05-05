import React, { useState, useEffect } from 'react';
import { useDependencyContext } from '../../context/DependencyContext';
import { 
  DependencyDataTypes, 
  DependencySyncStrategy,
  DependencyDefinition
} from '../../lib/dependency/DependencyInterfaces';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '../ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '../ui/form';
import { 
  Card, 
  CardContent 
} from '../ui/card';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Link, Link2, Settings } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { nanoid } from 'nanoid';

// Form validation schema
const dependencyFormSchema = z.object({
  providerId: z.string({
    required_error: "Please select a provider component",
  }),
  dataType: z.nativeEnum(DependencyDataTypes, {
    required_error: "Please select a data type",
  }),
  syncStrategy: z.nativeEnum(DependencySyncStrategy).default(DependencySyncStrategy.BOTH),
  required: z.boolean().default(false),
});

type DependencyFormValues = z.infer<typeof dependencyFormSchema>;

interface DependencySelectorProps {
  currentComponentId: string;
  onCreateDependency?: (providerId: string, dataType: DependencyDataTypes) => void;
  existingProviderIds?: string[];
  availableDataTypes?: DependencyDataTypes[];
  trigger?: React.ReactNode;
}

const DependencySelector: React.FC<DependencySelectorProps> = ({
  currentComponentId,
  onCreateDependency,
  existingProviderIds = [],
  availableDataTypes,
  trigger
}) => {
  const { registry } = useDependencyContext();
  const [availableProviders, setAvailableProviders] = useState<DependencyDefinition[]>([]);
  const [dataTypesByProvider, setDataTypesByProvider] = useState<Map<string, DependencyDataTypes[]>>(new Map());
  const [open, setOpen] = useState(false);

  // Create form
  const form = useForm<DependencyFormValues>({
    resolver: zodResolver(dependencyFormSchema),
    defaultValues: {
      syncStrategy: DependencySyncStrategy.BOTH,
      required: false,
    },
  });

  // Component watched values
  const selectedProviderId = form.watch('providerId');

  // Get available providers from registry
  useEffect(() => {
    // Get all provider definitions
    const allProviders: DependencyDefinition[] = [];
    const dataTypesMap = new Map<string, DependencyDataTypes[]>();
    
    // Iterate through all data types to find providers
    Object.values(DependencyDataTypes).forEach(dataType => {
      // Skip data types that aren't in the available list if one is provided
      if (availableDataTypes && !availableDataTypes.includes(dataType)) {
        return;
      }
      
      const providers = registry.getProviderDefinitions(dataType)
        .filter(provider => provider.componentId !== currentComponentId); // Exclude self
      
      providers.forEach(provider => {
        // Add provider to the list if not already there
        if (!allProviders.some(p => p.id === provider.id)) {
          allProviders.push(provider);
        }
        
        // Add data type to the provider's data types
        const dataTypes = dataTypesMap.get(provider.componentId) || [];
        if (!dataTypes.includes(provider.dataType)) {
          dataTypes.push(provider.dataType);
          dataTypesMap.set(provider.componentId, dataTypes);
        }
      });
    });
    
    // Filter out providers that are already connected
    const filteredProviders = allProviders.filter(
      provider => !existingProviderIds.includes(provider.componentId)
    );
    
    setAvailableProviders(filteredProviders);
    setDataTypesByProvider(dataTypesMap);
  }, [registry, currentComponentId, existingProviderIds, availableDataTypes]);

  // When provider changes, update the data type options
  useEffect(() => {
    if (selectedProviderId) {
      const availableDataTypes = dataTypesByProvider.get(selectedProviderId) || [];
      if (availableDataTypes.length > 0) {
        form.setValue('dataType', availableDataTypes[0]);
      }
    }
  }, [selectedProviderId, dataTypesByProvider, form]);

  // Handle form submission
  const onSubmit = (data: DependencyFormValues) => {
    if (onCreateDependency) {
      onCreateDependency(data.providerId, data.dataType);
    }
    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="flex items-center text-xs">
            <Link className="w-3.5 h-3.5 mr-1" /> Connect
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Dependency Connection</DialogTitle>
          <DialogDescription>
            Connect this component to a data provider to automatically receive updates.
          </DialogDescription>
        </DialogHeader>
        
        {availableProviders.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            <Link2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
            <p>No available providers found.</p>
            <p className="text-sm">All compatible providers are already connected or none exist.</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="providerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider Component</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Available Providers</SelectLabel>
                            {availableProviders.map(provider => (
                              <SelectItem 
                                key={provider.componentId} 
                                value={provider.componentId}
                              >
                                {provider.componentId} {provider.description ? `(${provider.description})` : ''}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      The component that will provide data to this component.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {selectedProviderId && (
                <FormField
                  control={form.control}
                  name="dataType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Type</FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a data type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Available Data Types</SelectLabel>
                              {(dataTypesByProvider.get(selectedProviderId) || []).map(dataType => (
                                <SelectItem 
                                  key={dataType} 
                                  value={dataType}
                                >
                                  {dataType}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        The type of data that will be shared between components.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <Card className="border-dashed border-muted-foreground/20">
                <CardContent className="pt-4">
                  <h4 className="text-sm font-medium mb-2 flex items-center">
                    <Settings className="h-3.5 w-3.5 mr-1.5" /> Advanced Options
                  </h4>
                  
                  <div className="grid gap-3">
                    <FormField
                      control={form.control}
                      name="syncStrategy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sync Strategy</FormLabel>
                          <FormControl>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select sync strategy" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={DependencySyncStrategy.PULL}>
                                  PULL (Request data when needed)
                                </SelectItem>
                                <SelectItem value={DependencySyncStrategy.PUSH}>
                                  PUSH (Provider pushes data on change)
                                </SelectItem>
                                <SelectItem value={DependencySyncStrategy.BOTH}>
                                  BOTH (Both pull and push enabled)
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormDescription>
                            How data will be synchronized between components.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="required"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0 mt-1">
                          <FormControl>
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={field.onChange} 
                            />
                          </FormControl>
                          <div>
                            <FormLabel className="cursor-pointer">Required Dependency</FormLabel>
                            <FormDescription className="text-xs">
                              If checked, this component will not function without this dependency.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Connection</Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DependencySelector;