import { type Node } from "reactflow";

// Define the rules
const RULES = {
  subnet: {
    allowedParents: ['vpc'],
    mustHaveParent: true,
    errorMessage: "Subnets must be placed inside a VPC."
  },
  service: { // EC2, RDS, S3
    allowedParents: ['subnet'],
    mustHaveParent: true,
    // Exception: S3 is global, so we might want to allow it outside later.
    // For now, let's enforce Subnet for EC2/RDS.
    exceptions: ['s3'],
    errorMessage: "Compute resources must be placed inside a Subnet."
  },
  vpc: {
    allowedParents: [], // Top level
    mustHaveParent: false,
    errorMessage: ""
  },
  eks: {
    allowedParents: ['subnet'],
    mustHaveParent: true,
    errorMessage: "EKS clusters must be placed inside a Subnet."
  },
  'eks-node-group': {
    allowedParents: ['eks'],
    mustHaveParent: true,
    errorMessage: "Node groups must be placed inside an EKS cluster."
  }
};

export function validatePlacement(node: Node, parentNode: Node | undefined): { valid: boolean; message?: string } {
  // Determine the node type for rule lookup
  let nodeType: string;
  if (node.data.type === 'vpc' || node.data.type === 'subnet') {
    nodeType = node.type || node.data.type;
  } else if (node.data.type === 'eks') {
    nodeType = 'eks';
  } else if (node.data.type === 'eks-node-group') {
    nodeType = 'eks-node-group';
  } else {
    nodeType = 'service'; // EC2, RDS, S3, etc.
  }

  const specificType = node.data.type; // 'ec2', 's3', 'eks', 'eks-node-group'

  // 1. Get Rule Set
  // @ts-ignore
  const rule = RULES[nodeType];
  if (!rule) return { valid: true }; // Unknown types allowed for now

  // 2. Check Exceptions (e.g. S3 doesn't need a parent)
  if (rule.exceptions?.includes(specificType)) {
    return { valid: true };
  }

  // 3. Check "Must Have Parent"
  if (rule.mustHaveParent && !parentNode) {
    return { valid: false, message: rule.errorMessage };
  }

  // 4. Check Parent Type
  if (parentNode) {
    const parentType = parentNode.type;
    if (!rule.allowedParents.includes(parentType)) {
      return { valid: false, message: rule.errorMessage };
    }
  }

  return { valid: true };
}