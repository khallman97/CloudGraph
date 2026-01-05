import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { ProjectMetadata } from '@/types';

interface ProjectSettingsModalProps {
  currentMetadata?: ProjectMetadata;
  onSave: (metadata: ProjectMetadata) => Promise<void>;
}

const AWS_REGIONS = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-east-2', label: 'US East (Ohio)' },
  { value: 'us-west-1', label: 'US West (N. California)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'EU (Ireland)' },
  { value: 'eu-west-2', label: 'EU (London)' },
  { value: 'eu-central-1', label: 'EU (Frankfurt)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
  { value: 'ap-south-1', label: 'Asia Pacific (Mumbai)' },
  { value: 'sa-east-1', label: 'South America (São Paulo)' },
];

export function ProjectSettingsModal({ currentMetadata, onSave }: ProjectSettingsModalProps) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [region, setRegion] = useState(currentMetadata?.region || 'us-east-1');
  const [terraformVersion, setTerraformVersion] = useState(
    currentMetadata?.terraform_version || '1.5.0'
  );

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setRegion(currentMetadata?.region || 'us-east-1');
      setTerraformVersion(currentMetadata?.terraform_version || '1.5.0');
    }
  }, [open, currentMetadata]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        region,
        terraform_version: terraformVersion,
      });
      setOpen(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Project Settings</DialogTitle>
          <DialogDescription>
            Configure AWS region and Terraform settings for this project.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* AWS Region */}
          <div className="grid gap-2">
            <Label htmlFor="region">AWS Region</Label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger id="region" className="w-full">
                <SelectValue placeholder="Select a region" />
              </SelectTrigger>
              <SelectContent>
                {AWS_REGIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Terraform Version */}
          <div className="grid gap-2">
            <Label htmlFor="tf-version">Terraform Version</Label>
            <Select value={terraformVersion} onValueChange={setTerraformVersion}>
              <SelectTrigger id="tf-version" className="w-full">
                <SelectValue placeholder="Select version" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1.5.0">1.5.0</SelectItem>
                <SelectItem value="1.6.0">1.6.0</SelectItem>
                <SelectItem value="1.7.0">1.7.0</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
