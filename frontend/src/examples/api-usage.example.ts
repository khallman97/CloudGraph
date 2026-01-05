/**
 * API Usage Examples for CloudGraph IDE
 * This file demonstrates how to use the updated API client with proper types
 */

import {
  estimateCosts,
  generateTerraform,
  getPricing,
  updateProject,
  type CloudGraphNode,
  type CostEstimateResponse,
  type GenerateResponse,
  type PricingResponse,
} from '@/lib/api';

// ============================================================================
// Example 1: Cost Estimation
// ============================================================================

async function exampleCostEstimation(nodes: CloudGraphNode[]): Promise<void> {
  try {
    // Call the cost estimation API
    const estimate: CostEstimateResponse = await estimateCosts(nodes);

    console.log(`Total Monthly Cost: $${estimate.total_monthly_cost}`);
    console.log('Breakdown by node:');

    // Iterate through breakdown
    Object.entries(estimate.breakdown).forEach(([nodeId, cost]) => {
      console.log(`  ${nodeId}: $${cost}`);
    });
  } catch (error) {
    console.error('Failed to estimate costs:', error);
  }
}

// Example usage with sample nodes
const sampleNodes: CloudGraphNode[] = [
  {
    id: 'vpc-1',
    type: 'vpc',
    position: { x: 0, y: 0 },
    data: {
      type: 'vpc',
      label: 'main-vpc',
      cidr: '10.0.0.0/16',
    },
  },
  {
    id: 'subnet-1',
    type: 'subnet',
    position: { x: 50, y: 50 },
    data: {
      type: 'subnet',
      label: 'public-subnet',
      cidr: '10.0.1.0/24',
    },
    parentNode: 'vpc-1',
  },
  {
    id: 'ec2-1',
    type: 'service',
    position: { x: 100, y: 100 },
    data: {
      type: 'ec2',
      label: 'web-server',
      instanceType: 't3.medium',
    },
    parentNode: 'subnet-1',
  },
];

// exampleCostEstimation(sampleNodes);

// ============================================================================
// Example 2: Terraform Generation
// ============================================================================

async function exampleTerraformGeneration(
  nodes: CloudGraphNode[]
): Promise<void> {
  try {
    // Generate Terraform code
    const result: GenerateResponse = await generateTerraform({
      nodes,
      edges: [],
    });

    console.log('Generated Terraform Code:');
    console.log('========================');
    console.log(result.tf_code);
    console.log('========================');
    console.log(`Message: ${result.message}`);
  } catch (error) {
    console.error('Failed to generate Terraform:', error);
  }
}

// exampleTerraformGeneration(sampleNodes);

// ============================================================================
// Example 3: Get Pricing Catalog
// ============================================================================

async function exampleGetPricing(): Promise<void> {
  try {
    const pricing: PricingResponse = await getPricing();

    console.log(`Currency: ${pricing.currency}`);
    console.log(`Period: ${pricing.period}`);
    console.log('Pricing Catalog:');

    // Display pricing for different resources
    Object.entries(pricing.pricing).forEach(([resource, price]) => {
      console.log(`  ${resource}: $${price}`);
    });
  } catch (error) {
    console.error('Failed to fetch pricing:', error);
  }
}

// exampleGetPricing();

// ============================================================================
// Example 4: Update Project Settings
// ============================================================================

async function exampleUpdateProjectSettings(projectId: number): Promise<void> {
  try {
    // Update project with new region and terraform version
    const updatedProject = await updateProject(projectId, {
      meta_data: {
        region: 'us-west-2',
        terraform_version: '1.6.0',
      },
    });

    console.log('Project updated successfully:');
    console.log(`  Name: ${updatedProject.name}`);
    console.log(`  Region: ${updatedProject.meta_data.region}`);
    console.log(`  Terraform Version: ${updatedProject.meta_data.terraform_version}`);
  } catch (error) {
    console.error('Failed to update project:', error);
  }
}

// exampleUpdateProjectSettings(1);

// ============================================================================
// Example 5: Complete Workflow - Create, Estimate, Generate
// ============================================================================

async function exampleCompleteWorkflow(projectId: number): Promise<void> {
  const nodes: CloudGraphNode[] = [
    {
      id: 'vpc-1',
      type: 'vpc',
      position: { x: 0, y: 0 },
      data: {
        type: 'vpc',
        label: 'production-vpc',
        cidr: '10.0.0.0/16',
      },
    },
    {
      id: 'subnet-1',
      type: 'subnet',
      position: { x: 50, y: 50 },
      data: {
        type: 'subnet',
        label: 'web-subnet',
        cidr: '10.0.1.0/24',
        availabilityZone: 'us-east-1a',
      },
      parentNode: 'vpc-1',
    },
    {
      id: 'ec2-1',
      type: 'service',
      position: { x: 100, y: 100 },
      data: {
        type: 'ec2',
        label: 'web-server',
        instanceType: 'm5.large',
      },
      parentNode: 'subnet-1',
    },
    {
      id: 'rds-1',
      type: 'service',
      position: { x: 100, y: 200 },
      data: {
        type: 'rds',
        label: 'app-database',
        engine: 'postgres',
        instanceClass: 'db.t3.medium',
        allocatedStorage: 100,
      },
      parentNode: 'subnet-1',
    },
    {
      id: 's3-1',
      type: 'service',
      position: { x: 300, y: 100 },
      data: {
        type: 's3',
        label: 'static-assets',
        versioning: true,
      },
    },
  ];

  try {
    console.log('=== CloudGraph Complete Workflow ===\n');

    // Step 1: Update project settings
    console.log('Step 1: Updating project settings...');
    await updateProject(projectId, {
      meta_data: {
        region: 'us-east-1',
        terraform_version: '1.5.0',
      },
    });
    console.log('✓ Project settings updated\n');

    // Step 2: Estimate costs
    console.log('Step 2: Estimating costs...');
    const estimate = await estimateCosts(nodes);
    console.log(`✓ Total monthly cost: $${estimate.total_monthly_cost}`);
    console.log('  Breakdown:');
    Object.entries(estimate.breakdown).forEach(([nodeId, cost]) => {
      const node = nodes.find((n) => n.id === nodeId);
      console.log(`    ${node?.data.label}: $${cost}`);
    });
    console.log();

    // Step 3: Generate Terraform
    console.log('Step 3: Generating Terraform code...');
    const terraform = await generateTerraform({ nodes, edges: [] });
    console.log('✓ Terraform code generated');
    console.log('Preview:');
    console.log(terraform.tf_code.substring(0, 200) + '...\n');

    // Step 4: Get pricing catalog for reference
    console.log('Step 4: Fetching pricing catalog...');
    const pricing = await getPricing();
    console.log(`✓ Pricing catalog loaded (${Object.keys(pricing.pricing).length} items)\n`);

    console.log('=== Workflow Complete ===');
  } catch (error) {
    console.error('Workflow failed:', error);
  }
}

// exampleCompleteWorkflow(1);

// ============================================================================
// Example 6: Type-Safe Node Creation
// ============================================================================

function exampleTypeSafeNodeCreation(): CloudGraphNode[] {
  // TypeScript will enforce correct types for each resource

  const vpcNode: CloudGraphNode = {
    id: 'vpc-prod',
    type: 'vpc',
    position: { x: 0, y: 0 },
    data: {
      type: 'vpc',
      label: 'production-vpc',
      cidr: '10.0.0.0/16',
    },
  };

  const subnetNode: CloudGraphNode = {
    id: 'subnet-public',
    type: 'subnet',
    position: { x: 50, y: 50 },
    data: {
      type: 'subnet',
      label: 'public-subnet-1a',
      cidr: '10.0.1.0/24',
      availabilityZone: 'us-east-1a',
    },
    parentNode: vpcNode.id,
  };

  const ec2Node: CloudGraphNode = {
    id: 'ec2-web',
    type: 'service',
    position: { x: 100, y: 100 },
    data: {
      type: 'ec2',
      label: 'web-server-1',
      instanceType: 't3.medium',
      ami: 'ami-12345678',
    },
    parentNode: subnetNode.id,
  };

  const lambdaNode: CloudGraphNode = {
    id: 'lambda-api',
    type: 'service',
    position: { x: 200, y: 100 },
    data: {
      type: 'lambda',
      label: 'api-handler',
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      memory: 512,
    },
    parentNode: subnetNode.id,
  };

  return [vpcNode, subnetNode, ec2Node, lambdaNode];
}

const typeSafeNodes = exampleTypeSafeNodeCreation();
console.log(`Created ${typeSafeNodes.length} type-safe nodes`);

// ============================================================================
// Export examples for use in components
// ============================================================================

export {
  exampleCostEstimation,
  exampleTerraformGeneration,
  exampleGetPricing,
  exampleUpdateProjectSettings,
  exampleCompleteWorkflow,
  exampleTypeSafeNodeCreation,
  sampleNodes,
};
