import type {
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
  AWSStatusResponse,
  InstanceTypesResponse,
  AMIsResponse,
  AvailabilityZonesResponse,
  RDSEnginesResponse,
  RDSInstanceClassesResponse,
  EKSVersionsResponse,
} from '@/types';

// Re-export types for convenience
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

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Token management
const TOKEN_KEY = 'cloudgraph_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// API request helper with auth interceptor
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      removeToken();
      window.location.href = '/login';
    }
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || 'Request failed');
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Auth API
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  // OAuth2 password flow uses form-urlencoded
  const formData = new URLSearchParams();
  formData.append('username', credentials.email);
  formData.append('password', credentials.password);

  const response = await fetch(`${API_BASE_URL}/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(error.detail || 'Login failed');
  }

  return response.json();
}

export async function signup(data: SignupData): Promise<User> {
  return apiRequest<User>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getCurrentUser(): Promise<User> {
  return apiRequest<User>('/auth/me');
}

// Projects API
export async function listProjects(): Promise<ProjectListItem[]> {
  return apiRequest<ProjectListItem[]>('/projects/');
}

export async function getProject(id: number): Promise<Project> {
  return apiRequest<Project>(`/projects/${id}`);
}

export async function createProject(data: CreateProjectData): Promise<Project> {
  return apiRequest<Project>('/projects/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProject(id: number, data: UpdateProjectData): Promise<Project> {
  return apiRequest<Project>(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteProject(id: number): Promise<void> {
  return apiRequest<void>(`/projects/${id}`, {
    method: 'DELETE',
  });
}

// Generate API
export async function generateTerraform(data: GenerateRequest): Promise<GenerateResponse> {
  return apiRequest<GenerateResponse>('/generate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Cost Estimation API
export async function estimateCosts(nodes: CloudGraphNode[]): Promise<CostEstimateResponse> {
  return apiRequest<CostEstimateResponse>('/costs/estimate', {
    method: 'POST',
    body: JSON.stringify({ nodes, edges: [] }),
  });
}

export async function getPricing(): Promise<PricingResponse> {
  return apiRequest<PricingResponse>('/costs/pricing');
}

// ============================================================================
// AWS Data API
// ============================================================================

export async function getAWSStatus(): Promise<AWSStatusResponse> {
  return apiRequest<AWSStatusResponse>('/aws/status');
}

export async function getEC2InstanceTypes(
  region?: string,
  families?: string[]
): Promise<InstanceTypesResponse> {
  const params = new URLSearchParams();
  if (region) params.append('region', region);
  if (families) families.forEach(f => params.append('families', f));

  const query = params.toString();
  return apiRequest<InstanceTypesResponse>(`/aws/ec2/instance-types${query ? `?${query}` : ''}`);
}

export async function getEC2AMIs(
  region?: string,
  osFilter?: string
): Promise<AMIsResponse> {
  const params = new URLSearchParams();
  if (region) params.append('region', region);
  if (osFilter) params.append('os_filter', osFilter);

  const query = params.toString();
  return apiRequest<AMIsResponse>(`/aws/ec2/amis${query ? `?${query}` : ''}`);
}

export async function getAvailabilityZones(region?: string): Promise<AvailabilityZonesResponse> {
  const params = region ? `?region=${region}` : '';
  return apiRequest<AvailabilityZonesResponse>(`/aws/ec2/availability-zones${params}`);
}

export async function getRDSEngines(region?: string): Promise<RDSEnginesResponse> {
  const params = region ? `?region=${region}` : '';
  return apiRequest<RDSEnginesResponse>(`/aws/rds/engines${params}`);
}

export async function getRDSInstanceClasses(
  region?: string,
  engine?: string,
  engineVersion?: string
): Promise<RDSInstanceClassesResponse> {
  const params = new URLSearchParams();
  if (region) params.append('region', region);
  if (engine) params.append('engine', engine);
  if (engineVersion) params.append('engine_version', engineVersion);

  const query = params.toString();
  return apiRequest<RDSInstanceClassesResponse>(`/aws/rds/instance-classes${query ? `?${query}` : ''}`);
}

export async function getEKSVersions(
  region?: string
): Promise<EKSVersionsResponse> {
  const params = region ? `?region=${region}` : '';
  return apiRequest<EKSVersionsResponse>(`/aws/eks/versions${params}`);
}

export async function clearAWSCache(): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/aws/cache/clear', { method: 'POST' });
}
