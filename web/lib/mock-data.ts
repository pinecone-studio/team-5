export type BenefitStatus = "active" | "eligible" | "locked" | "pending";

export type Benefit = {
  id: string;
  title: string;
  description: string;
};

export type BenefitEligibility = {
  benefit: Benefit;
  status: BenefitStatus;
};

export const currentEmployee = {
  id: "emp-001",
  nameEng: "Bat-Erdene D.",
  lateArrivalCount: 2,
};

const employeeBenefits: Benefit[] = [
  {
    id: "gym",
    title: "Gym",
    description: "Monthly gym membership support.",
  },
  {
    id: "insurance",
    title: "Insurance",
    description: "Private health insurance coverage.",
  },
  {
    id: "remote-work",
    title: "Remote Work",
    description: "Work from home up to 2 days per week.",
  },
  {
    id: "learning",
    title: "Learning Budget",
    description: "Budget for courses and certifications.",
  },
];

export const myEligibility: BenefitEligibility[] = [
  { benefit: employeeBenefits[0], status: "active" },
  { benefit: employeeBenefits[1], status: "eligible" },
  { benefit: employeeBenefits[2], status: "pending" },
  { benefit: employeeBenefits[3], status: "locked" },
];

export type AdminBenefit = {
  id: string;
  name: string;
  requiresContract: boolean;
  vendorName: string;
  contractVersion: number;
};

export const benefits: AdminBenefit[] = [
  {
    id: "gym_pinefit",
    name: "Gym Pinefit",
    requiresContract: true,
    vendorName: "Pinefit LLC",
    contractVersion: 3,
  },
  {
    id: "private_insurance",
    name: "Private Insurance",
    requiresContract: true,
    vendorName: "MediCare MN",
    contractVersion: 5,
  },
  {
    id: "macbook",
    name: "MacBook Program",
    requiresContract: true,
    vendorName: "Apple Reseller",
    contractVersion: 2,
  },
  {
    id: "remote_work",
    name: "Remote Work",
    requiresContract: false,
    vendorName: "Internal Policy",
    contractVersion: 1,
  },
];

export type AuditLogEntry = {
  id: string;
  actor: string;
  action: string;
  target: string;
  createdAt: string;
};

export const auditLog: AuditLogEntry[] = [
  {
    id: "a-001",
    actor: "Sarnai M.",
    action: "UPDATED_RULE",
    target: "Gym Pinefit",
    createdAt: "2026-03-10 10:24",
  },
  {
    id: "a-002",
    actor: "Bat-Erdene D.",
    action: "UPLOADED_CONTRACT",
    target: "Private Insurance v5",
    createdAt: "2026-03-09 16:48",
  },
  {
    id: "a-003",
    actor: "HR Admin",
    action: "APPROVED_BENEFIT",
    target: "Remote Work",
    createdAt: "2026-03-08 11:03",
  },
];
