"use client"

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { BookmarkPlus } from 'lucide-react';
import { RouteResponse } from '@/lib/types';

interface SaveRouteDialogProps {
  route: RouteResponse;
  origin: string;
  destination: string;
  onSaved?: () => void;
}

export function SaveRouteDialog({ route, origin, destination, onSaved }: SaveRouteDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(`${origin} to ${destination}`);
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const [savedRoutes, setSavedRoutes] = useState<any[]>([]);

  // Load saved routes from localStorage on component mount
  useEffect(() => {
    const storedRoutes = localStorage.getItem('savedRoutes');
    if (storedRoutes) {
      setSavedRoutes(JSON.parse(storedRoutes));
    }
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please provide a name for this route',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      // Create a new route object
      const newRoute = {
        id: Date.now().toString(),
        name,
        description,
        start: origin,
        goal: destination,
        routeData: route,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to local state
      const updatedRoutes = [...savedRoutes, newRoute];
      setSavedRoutes(updatedRoutes);
      
      // Save to localStorage
      localStorage.setItem('savedRoutes', JSON.stringify(updatedRoutes));

      toast({
        title: 'Route saved',
        description: 'Your route has been saved successfully to local storage',
      });
      
      setOpen(false);
      if (onSaved) onSaved();
    } catch (error) {
      console.error('Error saving route:', error);
      toast({
        title: 'Error',
        description: 'Failed to save route. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <BookmarkPlus className="h-4 w-4" />
          Save Route
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-sky-400">Save Route</DialogTitle>
          <DialogDescription className="text-slate-400">
            Save this route to access it later from your dashboard.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right text-sky-300">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3 bg-slate-800 border-slate-700 focus:border-sky-500"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right text-sky-300">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3 bg-slate-800 border-slate-700 focus:border-sky-500"
              placeholder="Optional details about this route"
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            type="submit" 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-sky-600 hover:bg-sky-700"
          >
            {isSaving ? 'Saving...' : 'Save Route'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 