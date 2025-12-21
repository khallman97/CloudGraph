# CloudGraph IDE (MVP)

## 1. Executive Summary
**CloudGraph IDE** is a browser-based "Visual Infrastructure as Code" generator. Unlike generic diagramming tools, CloudGraph enforces cloud logic through a "Canvas-as-Compiler" approach.

Users design architecture using **Spatial Containment** (dragging resources *into* networks) rather than abstract connections. The system leverages smart defaults to pre-configure best practices (networking, security, tags), ultimately compiling the visual state into production-ready Terraform (HCL) code.

---

## 2. User Experience (UX) Philosophy
The UX is built on **Abstraction & Containment**, not just drawing.

1.  **The "Frame" Logic (Nesting):**
    *   **VPC is a Container:** It creates a bounded box on the canvas.
    *   **Subnets are Drop-Zones:** You cannot place an EC2 instance in "white space." You must drag it *into* a Subnet frame. The UI visually "snaps" the instance into the subnet.
    *   **Backend Consequence:** The generator automatically interpolates the `subnet_id` and `vpc_security_group_ids` based on where the icon lands.

2.  **Smart Defaults (Convention over Configuration):**
    *   **One-Click Network:** Dragging a VPC offers a "Standard Layout" preset: 1 VPC, 2 AZs, Public/Private split, and NAT Gateways pre-configured.
    *   **Auto-IP:** The system handles CIDR calculations (`10.0.1.0/24`, `10.0.2.0/24`) automatically so the user doesn't overlap IPs.

3.  **Visual Connectivity:**
    *   **Explicit:** Drawing a line from an ALB to an EC2 Instance = Target Group Attachment.
    *   **Implicit:** Drawing a line from "Internet" to an EC2 Instance = Security Group Rule opening port 80/443 (auto-detected).

---

## 3. Technology Stack

### **Frontend (The Canvas)**
*   **Language:** TypeScript (Strict mode).
*   **Framework:** React 18+.
*   **Core Library:** **React Flow**.
    *   *Why:* Native support for `subFlow` (parent/child nodes) and coordinate translation.
*   **State Management:** **Zustand**.
    *   *Why:* Minimalist. We need a global store to track the JSON tree of the infrastructure.
*   **UI Components:** **Shadcn/UI** (built on Tailwind CSS).
    *   *Why:* High-quality, customizable pre-built components for sidebars and modals.

### **Backend (The Compiler)**
*   **Language:** Python 3.11+.
*   **API Framework:** **FastAPI**.
*   **Data Validation:** **Pydantic**.
    *   *Role:* Defines the strict schema for "What is a valid VPC?" before we try to generate code.
*   **Template Engine:** **Jinja2**.
    *   *Role:* Renders the Terraform `.tf` files.
*   **Testing:** **Pytest**.

---

## 4. MVP Feature Specifications

### **A. Networking (The Backbone)**
| Component | Behavior & "Smart" Logic |
| :--- | :--- |
| **VPC** | Resizable container. Default CIDR `10.0.0.0/16`. |
| **Subnet** | Must be dropped inside VPC. Visual indicator for "Public" (Internet Access) vs "Private" (NAT only). |
| **Internet Gateway** | Auto-added if a "Public" subnet is detected. |

### **B. Compute & Data**
| Component | Behavior & "Smart" Logic |
| :--- | :--- |
| **EC2 Instance** | Must be dropped inside a Subnet. Sidebar allows selecting Size (t3.micro) and AMI. |
| **RDS (Database)** | Must be dropped inside a Subnet. Sidebar asks for Engine (Postgres/MySQL). |
| **S3 Bucket** | Global resource (sits outside VPC). Sidebar allows "Public Access" toggle. |

### **C. Security & Identity**
| Component | Behavior & "Smart" Logic |
| :--- | :--- |
| **Security Groups** | Abstracted. Users define "Access Rules" on the Instance sidebar (e.g., "Allow HTTP"). The backend generates the SG resource. |
| **IAM Roles** | "Capabilities" list. Example: Checkbox for "Can Read S3". Backend generates `aws_iam_role` and `aws_iam_role_policy`. |

---

## 5. System Architecture & Data Flow

### **Step 1: The React Flow State (Frontend)**
The user interacts with the canvas. React Flow maintains internal state (Nodes/Edges).
```typescript
// Conceptual Typescript Interface
interface CloudNode {
  id: string;
  type: 'ec2' | 'subnet' | 'vpc';
  parentNode?: string; // Critical for nesting
  data: {
    label: string;
    properties: {
      instanceType?: string;
      engine?: string;
    }
  }
}
```

### **Step 2: The Transformation (Frontend -> Backend)**
When the user clicks **"Generate"**, the frontend strips UI-specific data (x/y coordinates, colors) and sends a clean **Architecture Payload** to the API.

### **Step 3: The Validation & Compilation (Backend)**
1.  **Ingest:** FastAPI receives the JSON.
2.  **Validate:** Pydantic checks logic (e.g., *Error: Subnet-A has no CIDR block*).
3.  **Enrich:** Python logic adds missing pieces (e.g., *Detected Public Subnet -> Inject Route Table Association*).
4.  **Render:** Jinja2 iterates over the enriched object.

**Example Jinja Template (`ec2.tf.j2`):**
```hcl
resource "aws_instance" "{{ node.id }}" {
  ami           = "{{ node.ami }}"
  instance_type = "{{ node.instance_type }}"
  subnet_id     = aws_subnet.{{ node.parent_id }}.id
  
  tags = {
    Name = "{{ node.name }}"
  }
}
```

---

## 6. Roadmap

### **Phase 1: The "Wireframe"**
*   **Goal:** A canvas where I can drag a Box (VPC) and put a smaller Box (Subnet) inside it.
*   **Tech:** React + React Flow setup.
*   **Output:** `console.log` shows the JSON tree representing the nesting.

### **Phase 2: The "Compiler"**
*   **Goal:** Turn that JSON into text.
*   **Tech:** Python FastAPI + Jinja2.
*   **Output:** Clicking a button downloads a `main.tf` file with a hardcoded VPC resource.

### **Phase 3: The MVP Logic**
*   **Goal:** Full AWS Core support (EC2, S3, RDS).
*   **Feature:** Smart defaults (auto-assigning Subnets).
*   **Feature:** The "Sidebar" property editor to change names/sizes.

### **Phase 4: Advanced & Containers (Post-MVP)**
*   **EKS/ECS:** Complex grouping (Cluster Frame -> Node Group Frame).
*   **Templates:** A "Gallery" page to load pre-made JSON states.

