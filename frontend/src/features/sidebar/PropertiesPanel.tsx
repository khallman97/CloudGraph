import { useStore } from "@/app/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { SecurityRules } from "./components/SecurityRules";
import { Button } from "@/components/ui/button";
import { Play, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { useAWSData } from "@/hooks/useAWSData";

interface PropertiesPanelProps {
  projectId?: number;
  region?: string;
}

export function PropertiesPanel({ projectId, region }: PropertiesPanelProps) {
  const updateNodeData = useStore((state) => state.updateNodeData);
  const selectedNode = useStore((state) => state.nodes.find((n) => n.selected));
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);

  // Fetch AWS data with region from project
  const {
    instanceTypes,
    amis,
    availabilityZones,
    rdsEngines,
    rdsInstanceClasses,
    eksVersions,
    isLoading,
    source,
    isAWSConfigured,
    refresh,
    refreshRDSClasses,
  } = useAWSData({ region, enabled: true });

  const handleGenerate = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/v1/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges, project_id: projectId }),
      });

      if (!response.ok) throw new Error("Failed to generate");

      const data = await response.json();
      console.log("Terraform Code:", data.tf_code);
      alert("Success! Check console for Terraform code.");

    } catch (error) {
      console.error(error);
      alert("Error generating code");
    }
  };

  if (!selectedNode) return <Placeholder />;

  const handleChange = (field: string, value: any) => {
    updateNodeData(selectedNode.id, { [field]: value });
  };

  // Data source indicator component
  const DataSourceBadge = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 p-2 rounded mb-4">
          <Loader2 size={12} className="animate-spin" />
          <span>Loading AWS data...</span>
        </div>
      );
    }
    if (!isAWSConfigured && source === 'fallback') {
      return (
        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 p-2 rounded mb-4">
          <AlertCircle size={12} />
          <span>Using sample data. Configure AWS credentials for live data.</span>
        </div>
      );
    }
    return null;
  };

  // EC2 Configuration Section
  const renderEC2Config = () => (
    <div className="space-y-4">
      <DataSourceBadge />

      {/* Instance Type */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Instance Type</Label>
          <Button variant="ghost" size="sm" onClick={refresh} disabled={isLoading} className="h-6 px-2">
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
          </Button>
        </div>
        <Select
          onValueChange={(val) => handleChange('instanceType', val)}
          value={selectedNode.data.instanceType || "t3.micro"}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {instanceTypes.map((it) => (
              <SelectItem key={it.instanceType} value={it.instanceType}>
                {it.instanceType} ({it.vCpus} vCPU, {Math.round(it.memory / 1024)}GB)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* AMI / Operating System */}
      <div className="space-y-2">
        <Label>Operating System (AMI)</Label>
        <Select
          onValueChange={(val) => {
            const ami = amis.find(a => a.id === val);
            handleChange('ami', ami?.name || val);
            handleChange('amiId', val);
          }}
          value={selectedNode.data.amiId || selectedNode.data.ami || "ami-ubuntu-22.04"}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {amis.map((ami) => (
              <SelectItem key={ami.id} value={ami.id}>
                {ami.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Key Pair */}
      <div className="space-y-2">
        <Label>Key Pair Name</Label>
        <Input
          placeholder="my-ssh-key"
          value={selectedNode.data.keyName || ""}
          onChange={(e) => handleChange('keyName', e.target.value)}
        />
        <p className="text-[10px] text-muted-foreground">Must exist in your AWS account</p>
      </div>

      <Separator />

      {/* Storage Configuration */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase text-muted-foreground">Storage</Label>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Volume Size (GB)</Label>
            <Input
              type="number"
              min={8}
              max={16384}
              value={selectedNode.data.rootVolumeSize || 8}
              onChange={(e) => handleChange('rootVolumeSize', parseInt(e.target.value) || 8)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Volume Type</Label>
            <Select
              onValueChange={(val) => handleChange('rootVolumeType', val)}
              value={selectedNode.data.rootVolumeType || "gp3"}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gp3">gp3 (General Purpose)</SelectItem>
                <SelectItem value="gp2">gp2 (General Purpose)</SelectItem>
                <SelectItem value="io1">io1 (Provisioned IOPS)</SelectItem>
                <SelectItem value="io2">io2 (Provisioned IOPS)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between border dark:border-slate-600 p-2 rounded bg-slate-50 dark:bg-slate-700">
          <Label className="text-xs">Encrypt Volume</Label>
          <Switch
            checked={selectedNode.data.rootVolumeEncrypted || false}
            onCheckedChange={(val) => handleChange('rootVolumeEncrypted', val)}
          />
        </div>
      </div>

      <Separator />

      {/* Network Configuration */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase text-muted-foreground">Network</Label>

        <div className="flex items-center justify-between border dark:border-slate-600 p-2 rounded bg-slate-50 dark:bg-slate-700">
          <Label className="text-xs">Associate Public IP</Label>
          <Switch
            checked={selectedNode.data.associatePublicIp || false}
            onCheckedChange={(val) => handleChange('associatePublicIp', val)}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Private IP (optional)</Label>
          <Input
            placeholder="10.0.1.10"
            value={selectedNode.data.privateIp || ""}
            onChange={(e) => handleChange('privateIp', e.target.value)}
          />
        </div>
      </div>

      <Separator />

      {/* Security Groups */}
      <SecurityRules
        rules={selectedNode.data.securityRules || []}
        onChange={(rules) => handleChange('securityRules', rules)}
      />
    </div>
  );

  // RDS Configuration Section
  const renderRDSConfig = () => {
    const currentEngine = selectedNode.data.engine || "mysql";
    const currentEngineData = rdsEngines.find(e => e.engine === currentEngine);
    const versions = currentEngineData?.versions || ["8.0"];

    return (
      <div className="space-y-4">
        <DataSourceBadge />

        {/* Engine Selection */}
        <div className="space-y-2">
          <Label>Database Engine</Label>
          <Select
            onValueChange={(val) => {
              handleChange('engine', val);
              handleChange('engineVersion', undefined);
              refreshRDSClasses(val);
            }}
            value={currentEngine}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {rdsEngines.map((eng) => (
                <SelectItem key={eng.engine} value={eng.engine}>
                  {eng.engine.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Engine Version */}
        <div className="space-y-2">
          <Label>Engine Version</Label>
          <Select
            onValueChange={(val) => {
              handleChange('engineVersion', val);
              refreshRDSClasses(currentEngine, val);
            }}
            value={selectedNode.data.engineVersion || versions[0]}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {versions.map((ver) => (
                <SelectItem key={ver} value={ver}>{ver}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Instance Class */}
        <div className="space-y-2">
          <Label>Instance Class</Label>
          <Select
            onValueChange={(val) => handleChange('instanceClass', val)}
            value={selectedNode.data.instanceClass || "db.t3.micro"}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {rdsInstanceClasses.map((ic) => (
                <SelectItem key={ic.instanceClass} value={ic.instanceClass}>
                  {ic.instanceClass}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Database Configuration */}
        <div className="space-y-3">
          <Label className="text-xs font-semibold uppercase text-muted-foreground">Database</Label>

          <div className="space-y-2">
            <Label className="text-xs">Database Name</Label>
            <Input
              value={selectedNode.data.dbName || "mydb"}
              onChange={(e) => handleChange('dbName', e.target.value)}
              placeholder="mydb"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Username</Label>
              <Input
                value={selectedNode.data.username || "admin"}
                onChange={(e) => handleChange('username', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Port</Label>
              <Input
                type="number"
                value={selectedNode.data.port || (currentEngine.includes('postgres') ? 5432 : 3306)}
                onChange={(e) => handleChange('port', parseInt(e.target.value))}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Storage Configuration */}
        <div className="space-y-3">
          <Label className="text-xs font-semibold uppercase text-muted-foreground">Storage</Label>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Allocated Storage (GB)</Label>
              <Input
                type="number"
                min={20}
                max={65536}
                value={selectedNode.data.allocatedStorage || 20}
                onChange={(e) => handleChange('allocatedStorage', parseInt(e.target.value) || 20)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Storage Type</Label>
              <Select
                onValueChange={(val) => handleChange('storageType', val)}
                value={selectedNode.data.storageType || "gp2"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gp2">gp2</SelectItem>
                  <SelectItem value="gp3">gp3</SelectItem>
                  <SelectItem value="io1">io1 (Provisioned IOPS)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedNode.data.storageType === 'io1' && (
            <div className="space-y-1">
              <Label className="text-xs">IOPS</Label>
              <Input
                type="number"
                min={1000}
                max={80000}
                value={selectedNode.data.iops || 1000}
                onChange={(e) => handleChange('iops', parseInt(e.target.value) || 1000)}
              />
            </div>
          )}

          <div className="flex items-center justify-between border dark:border-slate-600 p-2 rounded bg-slate-50 dark:bg-slate-700">
            <Label className="text-xs">Encrypt Storage</Label>
            <Switch
              checked={selectedNode.data.storageEncrypted || false}
              onCheckedChange={(val) => handleChange('storageEncrypted', val)}
            />
          </div>
        </div>

        <Separator />

        {/* Backup Configuration */}
        <div className="space-y-3">
          <Label className="text-xs font-semibold uppercase text-muted-foreground">Backup & HA</Label>

          <div className="space-y-1">
            <Label className="text-xs">Backup Retention (days)</Label>
            <Input
              type="number"
              min={0}
              max={35}
              value={selectedNode.data.backupRetentionPeriod ?? 7}
              onChange={(e) => handleChange('backupRetentionPeriod', parseInt(e.target.value) || 0)}
            />
            <p className="text-[10px] text-muted-foreground">0 = disabled, 1-35 days</p>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Backup Window (UTC)</Label>
            <Input
              placeholder="03:00-04:00"
              value={selectedNode.data.backupWindow || ""}
              onChange={(e) => handleChange('backupWindow', e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between border dark:border-slate-600 p-2 rounded bg-slate-50 dark:bg-slate-700">
            <Label className="text-xs">Multi-AZ Deployment</Label>
            <Switch
              checked={selectedNode.data.multiAz || false}
              onCheckedChange={(val) => handleChange('multiAz', val)}
            />
          </div>

          <div className="flex items-center justify-between border dark:border-slate-600 p-2 rounded bg-slate-50 dark:bg-slate-700">
            <Label className="text-xs">Skip Final Snapshot</Label>
            <Switch
              checked={selectedNode.data.skipFinalSnapshot !== false}
              onCheckedChange={(val) => handleChange('skipFinalSnapshot', val)}
            />
          </div>
        </div>

        <Separator />

        {/* Network Configuration */}
        <div className="space-y-3">
          <Label className="text-xs font-semibold uppercase text-muted-foreground">Network</Label>

          <div className="flex items-center justify-between border dark:border-slate-600 p-2 rounded bg-slate-50 dark:bg-slate-700">
            <Label className="text-xs">Publicly Accessible</Label>
            <Switch
              checked={selectedNode.data.publiclyAccessible || false}
              onCheckedChange={(val) => handleChange('publiclyAccessible', val)}
            />
          </div>
        </div>
      </div>
    );
  };

  // Subnet Configuration with dynamic AZs
  const renderSubnetConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>CIDR Block</Label>
        <Input
          value={selectedNode.data.cidr || "10.0.1.0/24"}
          onChange={(e) => handleChange('cidr', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Availability Zone</Label>
        <Select
          value={selectedNode.data.az || availabilityZones[0] || "us-east-1a"}
          onValueChange={(val) => handleChange('az', val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select AZ" />
          </SelectTrigger>
          <SelectContent>
            {availabilityZones.map((az) => (
              <SelectItem key={az} value={az}>{az}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between border dark:border-slate-600 p-2 rounded bg-slate-50 dark:bg-slate-700">
        <Label htmlFor="public" className="text-xs">Map Public IP</Label>
        <Switch
          id="public"
          checked={selectedNode.data.mapPublicIp}
          onCheckedChange={(val) => handleChange('mapPublicIp', val)}
        />
      </div>
    </div>
  );

  // EKS Cluster Configuration Section
  const renderEKSClusterConfig = () => (
    <div className="space-y-4">
      {/* Kubernetes Version */}
      <div className="space-y-2">
        <Label>Kubernetes Version</Label>
        <Select
          onValueChange={(val) => handleChange('kubernetesVersion', val)}
          value={selectedNode.data.kubernetesVersion || eksVersions[0]?.version || "1.30"}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {eksVersions.map((v) => (
              <SelectItem key={v.version} value={v.version}>
                {v.version} {v.status === 'EXTENDED_SUPPORT' ? '(Extended)' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Endpoint Access */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase text-muted-foreground">Endpoint Access</Label>

        <div className="flex items-center justify-between border dark:border-slate-600 p-2 rounded bg-slate-50 dark:bg-slate-700">
          <Label className="text-xs">Public Access</Label>
          <Switch
            checked={selectedNode.data.endpointPublicAccess !== false}
            onCheckedChange={(val) => handleChange('endpointPublicAccess', val)}
          />
        </div>

        <div className="flex items-center justify-between border dark:border-slate-600 p-2 rounded bg-slate-50 dark:bg-slate-700">
          <Label className="text-xs">Private Access</Label>
          <Switch
            checked={selectedNode.data.endpointPrivateAccess || false}
            onCheckedChange={(val) => handleChange('endpointPrivateAccess', val)}
          />
        </div>
      </div>

      <Separator />

      {/* Logging */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase text-muted-foreground">Logging</Label>

        <div className="flex items-center justify-between border dark:border-slate-600 p-2 rounded bg-slate-50 dark:bg-slate-700">
          <Label className="text-xs">Enable Logging</Label>
          <Switch
            checked={selectedNode.data.enableLogging || false}
            onCheckedChange={(val) => handleChange('enableLogging', val)}
          />
        </div>
      </div>

      <Separator />

      {/* Add-ons */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase text-muted-foreground">Add-ons</Label>

        <div className="flex items-center justify-between border dark:border-slate-600 p-2 rounded bg-slate-50 dark:bg-slate-700">
          <Label className="text-xs">VPC CNI</Label>
          <Switch
            checked={selectedNode.data.addonVpcCni !== false}
            onCheckedChange={(val) => handleChange('addonVpcCni', val)}
          />
        </div>

        <div className="flex items-center justify-between border dark:border-slate-600 p-2 rounded bg-slate-50 dark:bg-slate-700">
          <Label className="text-xs">CoreDNS</Label>
          <Switch
            checked={selectedNode.data.addonCoreDns !== false}
            onCheckedChange={(val) => handleChange('addonCoreDns', val)}
          />
        </div>

        <div className="flex items-center justify-between border dark:border-slate-600 p-2 rounded bg-slate-50 dark:bg-slate-700">
          <Label className="text-xs">Kube Proxy</Label>
          <Switch
            checked={selectedNode.data.addonKubeProxy !== false}
            onCheckedChange={(val) => handleChange('addonKubeProxy', val)}
          />
        </div>

        <div className="flex items-center justify-between border dark:border-slate-600 p-2 rounded bg-slate-50 dark:bg-slate-700">
          <Label className="text-xs">EBS CSI Driver</Label>
          <Switch
            checked={selectedNode.data.addonEbsCsi || false}
            onCheckedChange={(val) => handleChange('addonEbsCsi', val)}
          />
        </div>
      </div>
    </div>
  );

  // EKS Node Group Configuration Section
  const renderEKSNodeGroupConfig = () => (
    <div className="space-y-4">
      {/* Instance Types */}
      <div className="space-y-2">
        <Label>Instance Type</Label>
        <Select
          onValueChange={(val) => handleChange('instanceTypes', [val])}
          value={selectedNode.data.instanceTypes?.[0] || "t3.medium"}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {instanceTypes.map((it) => (
              <SelectItem key={it.instanceType} value={it.instanceType}>
                {it.instanceType} ({it.vCpus} vCPU, {Math.round(it.memory / 1024)}GB)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Scaling Configuration */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase text-muted-foreground">Scaling Configuration</Label>

        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Desired</Label>
            <Input
              type="number"
              min={1}
              value={selectedNode.data.desiredSize || 2}
              onChange={(e) => handleChange('desiredSize', parseInt(e.target.value) || 2)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Min</Label>
            <Input
              type="number"
              min={1}
              value={selectedNode.data.minSize || 1}
              onChange={(e) => handleChange('minSize', parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Max</Label>
            <Input
              type="number"
              min={1}
              value={selectedNode.data.maxSize || 4}
              onChange={(e) => handleChange('maxSize', parseInt(e.target.value) || 4)}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Disk Configuration */}
      <div className="space-y-2">
        <Label>Disk Size (GB)</Label>
        <Input
          type="number"
          min={20}
          max={1000}
          value={selectedNode.data.diskSize || 20}
          onChange={(e) => handleChange('diskSize', parseInt(e.target.value) || 20)}
        />
      </div>

      <Separator />

      {/* Capacity Type */}
      <div className="space-y-2">
        <Label>Capacity Type</Label>
        <Select
          onValueChange={(val) => handleChange('capacityType', val)}
          value={selectedNode.data.capacityType || "ON_DEMAND"}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ON_DEMAND">ON_DEMAND</SelectItem>
            <SelectItem value="SPOT">SPOT</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* AMI Type */}
      <div className="space-y-2">
        <Label>AMI Type</Label>
        <Select
          onValueChange={(val) => handleChange('amiType', val)}
          value={selectedNode.data.amiType || "AL2_x86_64"}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AL2_x86_64">AL2_x86_64</SelectItem>
            <SelectItem value="AL2_ARM_64">AL2_ARM_64</SelectItem>
            <SelectItem value="BOTTLEROCKET_x86_64">BOTTLEROCKET_x86_64</SelectItem>
            <SelectItem value="BOTTLEROCKET_ARM_64">BOTTLEROCKET_ARM_64</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderSpecificFields = () => {
    switch (selectedNode.type) {
      case 'vpc':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>CIDR Block</Label>
              <Input
                value={selectedNode.data.cidr || "10.0.0.0/16"}
                onChange={(e) => handleChange('cidr', e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between border dark:border-slate-600 p-2 rounded bg-slate-50 dark:bg-slate-700">
              <Label htmlFor="dns" className="text-xs">Enable DNS Hostnames</Label>
              <Switch
                id="dns"
                checked={selectedNode.data.enableDnsHostnames !== false}
                onCheckedChange={(val) => handleChange('enableDnsHostnames', val)}
              />
            </div>
          </div>
        );

      case 'subnet':
        return renderSubnetConfig();

      case 'eks':
        return renderEKSClusterConfig();

      case 'eks-node-group':
        return renderEKSNodeGroupConfig();

      case 'service':
        if (selectedNode.data.type === 'ec2') {
          return renderEC2Config();
        }
        if (selectedNode.data.type === 'rds') {
          return renderRDSConfig();
        }
        if (selectedNode.data.type === 's3') {
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between border dark:border-slate-600 p-2 rounded bg-slate-50 dark:bg-slate-700">
                <Label className="text-xs">Enable Versioning</Label>
                <Switch
                  checked={selectedNode.data.versioning}
                  onCheckedChange={(val) => handleChange('versioning', val)}
                />
              </div>

              <div className="flex items-center justify-between border dark:border-slate-600 p-2 rounded bg-slate-50 dark:bg-slate-700">
                <Label className="text-xs">Force Destroy</Label>
                <Switch
                  checked={selectedNode.data.forceDestroy}
                  onCheckedChange={(val) => handleChange('forceDestroy', val)}
                />
              </div>
            </div>
          );
        }
        return <div className="text-xs text-muted-foreground">No configuration available</div>;
      default:
        return null;
    }
  };

  return (
    <Card className="w-[320px] h-full border-l rounded-none shadow-xl bg-background flex flex-col">
      <CardHeader className="pb-4 border-b bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          {selectedNode.data.type || selectedNode.type} CONFIG
        </CardTitle>
      </CardHeader>
      <div className="p-4 border-b bg-slate-100 dark:bg-slate-700">
        <Button
          onClick={handleGenerate}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
        >
          <Play size={16} /> Generate Terraform
        </Button>
      </div>
      <CardContent className="space-y-6 pt-6 overflow-y-auto flex-1">
        <div className="space-y-2">
          <Label>Resource Name</Label>
          <Input
            value={selectedNode.data.label}
            onChange={(e) => handleChange('label', e.target.value)}
            className="font-medium"
          />
        </div>
        <Separator />
        {renderSpecificFields()}
      </CardContent>
    </Card>
  );
}

function Placeholder() {
  return (
    <Card className="w-[320px] h-full border-l rounded-none shadow-none bg-background flex items-center justify-center">
      <div className="text-muted-foreground text-sm text-center p-4">
        Select a resource to edit properties
      </div>
    </Card>
  );
}
