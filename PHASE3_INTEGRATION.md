# Phase 3 Integration - Frontend/Backend Type Alignment

This document summarizes the changes made to align frontend TypeScript types with backend Pydantic schemas for CloudGraph IDE.

## Changes Overview

### 1. Centralized TypeScript Types

**New File:** `frontend/src/types/index.ts`

Created a comprehensive type system that mirrors the backend schema structure:

#### Node/Edge Types (aligned with `backend/app/schemas/diagram.py`)

```typescript
interface CloudGraphNode extends ReactFlowNodeBase {
  id: string;
  type: 'vpc' | 'subnet' | 'service';
  position: { x: number; y: number };
  data: NodeData;
  parentNode?: string;
  width?: number;
  height?: number;
}

interface CloudGraphEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
}
```

#### Resource-Specific Node Data Types

- `VpcNodeData` - VPC configuration
- `SubnetNodeData` - Subnet configuration
- `Ec2NodeData` - EC2 instance configuration
- `RdsNodeData` - RDS database configuration
- `S3NodeData` - S3 bucket configuration
- `LambdaNodeData` - Lambda function configuration

#### Project Types (aligned with `backend/app/models.py`)

```typescript
interface ProjectMetadata {
  region?: string;               // AWS region (default: us-east-1)
  terraform_version?: string;    // Terraform version (default: 1.5.0)
}

interface DiagramData {
  nodes: CloudGraphNode[];
  edges: CloudGraphEdge[];
}

interface Project {
  id: number;
  name: string;
  diagram_data: DiagramData;
  meta_data: ProjectMetadata;
  created_at: string;
  updated_at: string;
}
```

### 2. Updated API Client

**File:** `frontend/src/lib/api.ts`

#### New Cost Estimation API Methods

```typescript
// Estimate costs for architecture nodes
estimateCosts(nodes: CloudGraphNode[]): Promise<CostEstimateResponse>

// Get pricing catalog
getPricing(): Promise<PricingResponse>
```

#### Cost Response Types

```typescript
interface CostEstimateResponse {
  total_monthly_cost: number;
  breakdown: CostBreakdown;
}

interface PricingResponse {
  pricing: Record<string, number>;
  currency: string;
  period: string;
}
```

#### Terraform Generation API

```typescript
generateTerraform(data: GenerateRequest): Promise<GenerateResponse>
```

### 3. Type Re-exports

All types are re-exported from `api.ts` for backward compatibility:

```typescript
export type {
  AuthResponse,
  CloudGraphNode,
  CostEstimateResponse,
  CreateProjectData,
  DiagramData,
  GenerateRequest,
  GenerateResponse,
  LoginCredentials,
  PricingResponse,
  Project,
  ProjectListItem,
  ProjectMetadata,
  SignupData,
  UpdateProjectData,
  User,
};
```

## API Contract Alignment

### Backend Endpoints → Frontend Functions

| Backend Endpoint | Frontend Function | Request Type | Response Type |
|-----------------|-------------------|--------------|---------------|
| `POST /api/v1/generate` | `generateTerraform()` | `GenerateRequest` | `GenerateResponse` |
| `POST /api/v1/costs/estimate` | `estimateCosts()` | `{ nodes, edges }` | `CostEstimateResponse` |
| `GET /api/v1/costs/pricing` | `getPricing()` | None | `PricingResponse` |
| `PUT /api/v1/projects/{id}` | `updateProject()` | `UpdateProjectData` | `Project` |

### Schema Alignment

#### Project Metadata

**Backend** (`backend/app/models.py`):
```python
class Project(ProjectBase, table=True):
    meta_data: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))
```

**Frontend** (`frontend/src/types/index.ts`):
```typescript
interface ProjectMetadata {
  region?: string;               // Default: us-east-1
  terraform_version?: string;    // Default: 1.5.0
}
```

#### Architecture Request

**Backend** (`backend/app/schemas/diagram.py`):
```python
class ArchitectureRequest(BaseModel):
    nodes: List[ReactFlowNode]
    edges: List[ReactFlowEdge]
```

**Frontend** (`frontend/src/types/index.ts`):
```typescript
interface GenerateRequest {
  nodes: CloudGraphNode[];
  edges: CloudGraphEdge[];
}
```

#### Cost Estimate Response

**Backend** (`backend/app/services/pricing.py`):
```python
return {
    "total_monthly_cost": round(total_cost, 2),
    "breakdown": breakdown
}
```

**Frontend** (`frontend/src/types/index.ts`):
```typescript
interface CostEstimateResponse {
  total_monthly_cost: number;
  breakdown: CostBreakdown;
}
```

## Usage Examples

### 1. Estimating Costs

```typescript
import { estimateCosts } from '@/lib/api';
import { useStore } from '@/app/store';

// In a React component
const nodes = useStore((state) => state.nodes);

const handleEstimate = async () => {
  try {
    const estimate = await estimateCosts(nodes);
    console.log(`Total monthly cost: $${estimate.total_monthly_cost}`);
    console.log('Breakdown:', estimate.breakdown);
  } catch (error) {
    console.error('Failed to estimate costs:', error);
  }
};
```

### 2. Generating Terraform

```typescript
import { generateTerraform } from '@/lib/api';
import { useStore } from '@/app/store';

const nodes = useStore((state) => state.nodes);
const edges = useStore((state) => state.edges);

const handleGenerate = async () => {
  try {
    const result = await generateTerraform({ nodes, edges });
    console.log('Generated Terraform:\n', result.tf_code);
  } catch (error) {
    console.error('Failed to generate Terraform:', error);
  }
};
```

### 3. Updating Project with Metadata

```typescript
import { updateProject } from '@/lib/api';

const handleUpdateSettings = async (projectId: number) => {
  try {
    const updated = await updateProject(projectId, {
      meta_data: {
        region: 'us-west-2',
        terraform_version: '1.6.0',
      },
    });
    console.log('Project updated:', updated);
  } catch (error) {
    console.error('Failed to update project:', error);
  }
};
```

## Type Safety Benefits

1. **Compile-time validation** - TypeScript catches mismatches before runtime
2. **IntelliSense support** - Better autocomplete in VS Code
3. **Refactoring safety** - Renaming fields updates all references
4. **Documentation** - Types serve as inline API documentation
5. **Reduced bugs** - Prevents passing incorrect data structures

## Testing

Build verification:
```bash
cd frontend
npm run build
```

Type checking:
```bash
cd frontend
npx tsc --noEmit
```

## Next Steps

### Recommended Enhancements

1. **Add Zod validation** - Runtime validation matching TypeScript types
2. **Generate OpenAPI types** - Auto-generate from backend OpenAPI spec
3. **Add API error types** - Typed error responses
4. **Create type guards** - Runtime type checking functions

### Example Zod Schema

```typescript
import { z } from 'zod';

const ProjectMetadataSchema = z.object({
  region: z.string().default('us-east-1'),
  terraform_version: z.string().default('1.5.0'),
});

const CostEstimateResponseSchema = z.object({
  total_monthly_cost: z.number(),
  breakdown: z.record(z.number()),
});
```

## Files Modified

1. `frontend/src/types/index.ts` - **NEW** - Centralized type definitions
2. `frontend/src/lib/api.ts` - Updated with new API methods and type exports
3. `frontend/src/pages/EditorPage.tsx` - Fixed type compatibility issue

## Validation Checklist

- [x] All types align with backend Pydantic schemas
- [x] Project metadata includes `region` and `terraform_version`
- [x] Cost estimation endpoint integrated
- [x] Terraform generation endpoint integrated
- [x] Types re-exported from api.ts for backward compatibility
- [x] TypeScript compilation succeeds
- [x] Path alias `@/types` configured in tsconfig/vite

## Related Backend Files

For reference, these backend files define the schemas:

- `backend/app/models.py` - SQLModel database models
- `backend/app/schemas/diagram.py` - Pydantic request/response schemas
- `backend/app/api/v1/endpoints/costs.py` - Cost estimation endpoint
- `backend/app/api/v1/endpoints/generator.py` - Terraform generation endpoint
- `backend/app/services/pricing.py` - Cost calculation logic
