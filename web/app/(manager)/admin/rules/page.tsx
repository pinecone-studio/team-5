"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  Check,
  ChevronDown,
  FileText,
  Pencil,
  Plus,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type RuleOperator =
  | "eq"
  | "neq"
  | "lt"
  | "lte"
  | "gt"
  | "gte"
  | "in"
  | "not_in";

type BenefitDataItem = {
  activeContractId: string | null;
  category: string | null;
  id: string;
  isActive: boolean;
  name: string;
  requiresContract: boolean;
  subsidyPercent: number;
  vendorName: string | null;
};

type RuleDataItem = {
  benefitId: string;
  configVersion: number;
  errorMessage: string;
  id: string;
  operator: RuleOperator;
  priority: number;
  type: string;
  value: string;
};

type BenefitsQueryData = {
  benefits: BenefitDataItem[];
};

type RulesQueryData = {
  eligibilityRules: RuleDataItem[];
};

type LatestVersionQueryData = {
  eligibilityRuleLatestVersion: number;
};

type RuleMutationData = {
  createEligibilityRule: RuleDataItem;
  updateEligibilityRule: RuleDataItem;
  deleteEligibilityRule: boolean;
};

type BenefitMutationData = {
  createBenefit: BenefitDataItem;
  updateBenefit: BenefitDataItem;
  deleteBenefit: boolean;
};

type ContractDataItem = {
  id: string;
  benefitId: string;
  version: string;
  r2ObjectKey: string;
  sha256Hash: string;
  isActive: boolean | null;
};

type ContractMutationData = {
  createContract: ContractDataItem;
};

const GET_BENEFITS = gql`
  query GetBenefits {
    benefits {
      id
      activeContractId
      isActive
      name
      vendorName
      category
      requiresContract
      subsidyPercent
    }
  }
`;

const GET_LATEST_RULE_VERSION = gql`
  query GetLatestRuleVersion($benefitId: ID!) {
    eligibilityRuleLatestVersion(benefitId: $benefitId)
  }
`;

const GET_RULES = gql`
  query GetEligibilityRules($benefitId: ID!, $configVersion: Int) {
    eligibilityRules(benefitId: $benefitId, configVersion: $configVersion) {
      id
      benefitId
      operator
      type
      value
      configVersion
      errorMessage
      priority
    }
  }
`;

const RULE_TYPE_OPTIONS = [
  { value: "employment_status", label: "Status" },
  { value: "okr_submitted", label: "OKR Submitted" },
  { value: "attendance", label: "Late Arrivals" },
  { value: "tenure_days", label: "Tenure (Days)" },
  { value: "responsibility_level", label: "Level" },
  { value: "role", label: "Role" },
  { value: "department", label: "Department" },
];

const CREATE_RULE = gql`
  mutation CreateEligibilityRule($input: CreateEligibilityRuleInput!) {
    createEligibilityRule(input: $input) {
      id
    }
  }
`;

const UPDATE_RULE = gql`
  mutation UpdateEligibilityRule($input: UpdateEligibilityRuleInput!) {
    updateEligibilityRule(input: $input) {
      id
    }
  }
`;

const DELETE_RULE = gql`
  mutation DeleteEligibilityRule($id: ID!) {
    deleteEligibilityRule(id: $id)
  }
`;

const CREATE_BENEFIT = gql`
  mutation CreateBenefit($input: CreateBenefitInput!) {
    createBenefit(input: $input) {
      id
      activeContractId
      isActive
      name
      vendorName
      category
      requiresContract
      subsidyPercent
    }
  }
`;

const UPDATE_BENEFIT = gql`
  mutation UpdateBenefit($input: UpdateBenefitInput!) {
    updateBenefit(input: $input) {
      id
      activeContractId
      isActive
      name
      vendorName
      category
      requiresContract
      subsidyPercent
    }
  }
`;

const DELETE_BENEFIT = gql`
  mutation DeleteBenefit($id: ID!) {
    deleteBenefit(id: $id)
  }
`;

const CREATE_CONTRACT = gql`
  mutation CreateContract($input: CreateContractInput!) {
    createContract(input: $input) {
      id
      benefitId
      version
      r2ObjectKey
      sha256Hash
      isActive
    }
  }
`;

const OPERATOR_OPTIONS: Array<{ label: string; value: RuleOperator }> = [
  { label: "Equals", value: "eq" },
  { label: "Not equals", value: "neq" },
  { label: "Greater than", value: "gt" },
  { label: "Greater than or equal", value: "gte" },
  { label: "Less than", value: "lt" },
  { label: "Less than or equal", value: "lte" },
  { label: "In", value: "in" },
  { label: "Not In", value: "not_in" },
];

const OPERATOR_SYMBOL: Record<RuleOperator, string> = {
  eq: "=",
  neq: "!=",
  lt: "<",
  lte: "<=",
  gt: ">",
  gte: ">=",
  in: "in",
  not_in: "not in",
};

const EMPTY_FORM = {
  type: "",
  operator: OPERATOR_OPTIONS[0].value,
  value: "",
  errorMessage: "",
};

function formatFileSize(bytes: number | null | undefined) {
  if (!bytes || Number.isNaN(bytes) || bytes <= 0) {
    return "";
  }

  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function formatRuleTypeLabel(value: string) {
  if (!value) {
    return "Custom rule";
  }

  const matchingOption = RULE_TYPE_OPTIONS.find(
    (option) => option.value === value,
  );
  if (matchingOption) {
    return matchingOption.label;
  }

  return value
    .replace(/_/g, " ")
    .replace(/\bokr\b/gi, "OKR")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function AdminRulesPage() {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const ruleTypeDropdownRef = useRef<HTMLDivElement>(null);
  const operatorDropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [signedPreviewUrl, setSignedPreviewUrl] = useState<string | null>(null);

  const [selectedBenefitIdOverride, setSelectedBenefitIdOverride] = useState<
    string | null
  >(null);
  const [isBenefitOpen, setIsBenefitOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddBenefitModalOpen, setIsAddBenefitModalOpen] = useState(false);
  const [isEditBenefitModalOpen, setIsEditBenefitModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  const [deletingBenefitId, setDeletingBenefitId] = useState<string | null>(
    null,
  );
  const [isDeleteSuccessOpen, setIsDeleteSuccessOpen] = useState(false);
  const [isRuleTypeOpen, setIsRuleTypeOpen] = useState(false);
  const [isOperatorOpen, setIsOperatorOpen] = useState(false);
  const [ruleTypeValue, setRuleTypeValue] = useState(EMPTY_FORM.type);
  const [ruleTypeInputValue, setRuleTypeInputValue] = useState("");
  const [conditionOperator, setConditionOperator] = useState<RuleOperator>(
    EMPTY_FORM.operator,
  );
  const [conditionValue, setConditionValue] = useState(EMPTY_FORM.value);
  const [failMessageValue, setFailMessageValue] = useState(
    EMPTY_FORM.errorMessage,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [benefitActionError, setBenefitActionError] = useState<string | null>(
    null,
  );
  const [benefitNameValue, setBenefitNameValue] = useState("");
  const [benefitCategoryValue, setBenefitCategoryValue] = useState("");
  const [benefitVendorValue, setBenefitVendorValue] = useState("");
  const [benefitSubsidyValue, setBenefitSubsidyValue] = useState("50");
  const [benefitContractValue, setBenefitContractValue] = useState("");
  const [benefitContractFile, setBenefitContractFile] = useState<File | null>(
    null,
  );
  const [isContractBuilderOpen, setIsContractBuilderOpen] = useState(false);
  const [contractPreviewUrl, setContractPreviewUrl] = useState<string | null>(
    null,
  );

  const {
    data: benefitData,
    loading: loadingBenefits,
    refetch: refetchBenefits,
  } = useQuery<BenefitsQueryData>(GET_BENEFITS);

  const benefits = useMemo(
    () => (benefitData?.benefits ?? []).filter((benefit) => benefit.isActive),
    [benefitData?.benefits],
  );

  const selectedBenefitId =
    selectedBenefitIdOverride ?? benefits[0]?.id ?? null;

  const selectedBenefit = useMemo(
    () => benefits.find((benefit) => benefit.id === selectedBenefitId) ?? null,
    [benefits, selectedBenefitId],
  );

  const { data: latestVersionData, refetch: refetchLatestVersion } =
    useQuery<LatestVersionQueryData>(GET_LATEST_RULE_VERSION, {
      variables: { benefitId: selectedBenefitId },
      skip: !selectedBenefitId,
    });

  const latestVersion = latestVersionData?.eligibilityRuleLatestVersion ?? 1;

  const {
    data: rulesData,
    loading: loadingRules,
    refetch: refetchRules,
  } = useQuery<RulesQueryData>(GET_RULES, {
    variables: {
      benefitId: selectedBenefitId,
      configVersion: latestVersion,
    },
    skip: !selectedBenefitId,
  });

  const rules = useMemo(
    () => rulesData?.eligibilityRules ?? [],
    [rulesData?.eligibilityRules],
  );

  const editingRule = useMemo(
    () => rules.find((rule) => rule.id === editingRuleId) ?? null,
    [editingRuleId, rules],
  );

  const [createRule, { loading: creatingRule }] = useMutation<RuleMutationData>(CREATE_RULE);
  const [updateRule, { loading: updatingRule }] = useMutation<RuleMutationData>(UPDATE_RULE);
  const [deleteRule, { loading: deletingRule }] = useMutation<RuleMutationData>(DELETE_RULE);
  const [createBenefit, { loading: creatingBenefit }] = useMutation<BenefitMutationData>(CREATE_BENEFIT);
  const [updateBenefit, { loading: updatingBenefit }] = useMutation<BenefitMutationData>(UPDATE_BENEFIT);
  const [deleteBenefit, { loading: deletingBenefit }] = useMutation<BenefitMutationData>(DELETE_BENEFIT);
  const [createContract] = useMutation<ContractMutationData>(CREATE_CONTRACT);

  const isSaving = creatingRule || updatingRule;
  const isSavingBenefit = creatingBenefit || updatingBenefit;

  const resetForm = () => {
    setRuleTypeValue(EMPTY_FORM.type);
    setRuleTypeInputValue("");
    setConditionOperator(EMPTY_FORM.operator);
    setConditionValue(EMPTY_FORM.value);
    setFailMessageValue(EMPTY_FORM.errorMessage);
    setIsRuleTypeOpen(false);
    setIsOperatorOpen(false);
    setActionError(null);
  };

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsBenefitOpen(false);
      }

      if (!ruleTypeDropdownRef.current?.contains(event.target as Node)) {
        setIsRuleTypeOpen(false);
      }

      if (!operatorDropdownRef.current?.contains(event.target as Node)) {
        setIsOperatorOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    resetForm();
  };

  const closeEditModal = () => {
    setEditingRuleId(null);
    resetForm();
  };

  const closeDeleteModal = () => {
    setDeletingRuleId(null);
    setActionError(null);
  };

  const closeDeleteSuccessModal = () => setIsDeleteSuccessOpen(false);
  const closeDeleteBenefitModal = () => {
    setDeletingBenefitId(null);
    setBenefitActionError(null);
  };

  const resetBenefitForm = () => {
    setBenefitNameValue("");
    setBenefitCategoryValue("");
    setBenefitVendorValue("");
    setBenefitSubsidyValue("50");
    setBenefitContractValue("");
    setBenefitContractFile(null);
    if (contractPreviewUrl) {
      URL.revokeObjectURL(contractPreviewUrl);
    }
    setContractPreviewUrl(null);
    setIsContractBuilderOpen(false);
    setBenefitActionError(null);
  };

  const closeAddBenefitModal = () => {
    setIsAddBenefitModalOpen(false);
    resetBenefitForm();
  };

  const closeEditBenefitModal = () => {
    setIsEditBenefitModalOpen(false);
    resetBenefitForm();
  };

  const syncAfterRuleMutation = async () => {
    await refetchLatestVersion();
    await refetchRules();
  };

  const handleAddRule = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenAddBenefit = () => {
    resetBenefitForm();
    setIsAddBenefitModalOpen(true);
  };

  const handleOpenEditBenefit = () => {
    if (!selectedBenefit) {
      return;
    }

    setBenefitNameValue(selectedBenefit.name);
    setBenefitCategoryValue(selectedBenefit.category ?? "");
    setBenefitVendorValue(selectedBenefit.vendorName ?? "");
    setBenefitSubsidyValue(String(selectedBenefit.subsidyPercent));
    setBenefitContractValue(selectedBenefit.activeContractId ?? "");
    setBenefitActionError(null);
    setIsEditBenefitModalOpen(true);
  };

  const getServiceOrigin = () => {
    const configured = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "";
    const graphqlUrl =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
        ? "http://localhost:8787/graphql"
        : configured;
    return graphqlUrl ? new URL(graphqlUrl).origin : "";
  };

  const handleOpenSignedContractPreview = () => {
    if (!selectedBenefit?.activeContractId) return;
    const origin = getServiceOrigin();
    if (!origin) return;
    setSignedPreviewUrl(
      `${origin}/contracts/signed?contractId=${encodeURIComponent(selectedBenefit.activeContractId)}`,
    );
  };

  const handleEditRule = (rule: RuleDataItem) => {
    setEditingRuleId(rule.id);
    setRuleTypeValue(rule.type);
    setRuleTypeInputValue(formatRuleTypeLabel(rule.type));
    setConditionOperator(rule.operator);
    setConditionValue(rule.value);
    setFailMessageValue(rule.errorMessage);
    setIsRuleTypeOpen(false);
    setIsOperatorOpen(false);
    setActionError(null);
  };

  const handleCreateNewRule = async () => {
    if (!selectedBenefitId) {
      setActionError("Select a benefit first.");
      return;
    }

    if (
      !ruleTypeValue.trim() ||
      !conditionValue.trim() ||
      !failMessageValue.trim()
    ) {
      setActionError(
        "Rule type, condition value, and fail message are required.",
      );
      return;
    }

    try {
      await createRule({
        variables: {
          input: {
            benefitId: selectedBenefitId,
            value: conditionValue.trim(),
            type: ruleTypeValue,
            operator: conditionOperator,
            errorMessage: failMessageValue.trim(),
          },
        },
      });
      await syncAfterRuleMutation();
      closeAddModal();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Failed to create rule.",
      );
    }
  };

  const handleUpdateRule = async () => {
    if (!editingRuleId) {
      return;
    }

    if (
      !ruleTypeValue.trim() ||
      !conditionValue.trim() ||
      !failMessageValue.trim()
    ) {
      setActionError(
        "Rule type, condition value, and fail message are required.",
      );
      return;
    }

    try {
      await updateRule({
        variables: {
          input: {
            id: editingRuleId,
            value: conditionValue.trim(),
            type: ruleTypeValue,
            operator: conditionOperator,
            errorMessage: failMessageValue.trim(),
          },
        },
      });
      await syncAfterRuleMutation();
      closeEditModal();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Failed to update rule.",
      );
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingRuleId) {
      return;
    }

    try {
      await deleteRule({ variables: { id: deletingRuleId } });
      await syncAfterRuleMutation();
      setDeletingRuleId(null);
      setIsDeleteSuccessOpen(true);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Failed to delete rule.",
      );
    }
  };

  const setSelectedBenefit = (benefitId: string) => {
    setSelectedBenefitIdOverride(benefitId);
    setIsBenefitOpen(false);
  };

  const handleCreateBenefit = async () => {
    const subsidyPercent = Number(benefitSubsidyValue);
    if (!benefitNameValue.trim() || Number.isNaN(subsidyPercent)) {
      setBenefitActionError("Benefit name and subsidy percent are required.");
      return;
    }

    try {
      const response = await createBenefit({
        variables: {
          input: {
            name: benefitNameValue.trim(),
            category: benefitCategoryValue.trim() || null,
            subsidyPercent,
            vendorName: benefitVendorValue.trim() || null,
            activeContractId: benefitContractValue.trim() || null,
          },
        },
      });
      await refetchBenefits();
      const createdBenefitId = response.data?.createBenefit.id;
      if (createdBenefitId) {
        setSelectedBenefitIdOverride(createdBenefitId);
      }
      closeAddBenefitModal();
    } catch (error) {
      setBenefitActionError(
        error instanceof Error ? error.message : "Failed to create benefit.",
      );
    }
  };

  const handleContinueToContractBuilder = () => {
    if (!benefitNameValue.trim()) {
      setBenefitActionError("Benefit name is required before continuing.");
      return;
    }

    if (!benefitContractFile || !contractPreviewUrl) {
      setBenefitActionError("Upload a contract PDF to continue.");
      return;
    }

    void (async () => {
      try {
        setBenefitActionError(null);

        const file = benefitContractFile;
        const arrayBuffer = await file.arrayBuffer();

        // Ensure we have a benefit ID to attach the contract to.
        let resolvedBenefitId = selectedBenefitId;
        if (!resolvedBenefitId) {
          const subsidyPercent = Number(benefitSubsidyValue);
          if (!benefitNameValue.trim() || Number.isNaN(subsidyPercent)) {
            setBenefitActionError("Benefit name and subsidy percent are required before continuing.");
            return;
          }

          const response = await createBenefit({
            variables: {
              input: {
                name: benefitNameValue.trim(),
                category: benefitCategoryValue.trim() || null,
                subsidyPercent,
                vendorName: benefitVendorValue.trim() || null,
                activeContractId: null,
              },
            },
          });
          resolvedBenefitId = response?.data?.createBenefit?.id ?? "";
          if (!resolvedBenefitId) {
            setBenefitActionError("Failed to create benefit.");
            return;
          }

          await refetchBenefits();
          setSelectedBenefitIdOverride(resolvedBenefitId);
        }

        // Hash the PDF for D1 record.
        const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
        const hashBytes = Array.from(new Uint8Array(hashBuffer));
        const sha256Hash = hashBytes.map((b) => b.toString(16).padStart(2, "0")).join("");

        // Upload PDF object to R2 (via service worker).
        const configuredGraphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "";
        const graphqlUrl =
          window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
            ? "http://localhost:8787/graphql"
            : configuredGraphqlUrl;
        if (!graphqlUrl) {
          setBenefitActionError("Missing NEXT_PUBLIC_GRAPHQL_URL.");
          return;
        }
        const serviceOrigin = new URL(graphqlUrl).origin;
        const uploadResponse = await fetch(
          `${serviceOrigin}/contracts/upload?benefitId=${encodeURIComponent(resolvedBenefitId)}&fileName=${encodeURIComponent(file.name)}`,
          {
            method: "POST",
            headers: { "content-type": file.type || "application/pdf" },
            body: new Blob([arrayBuffer], { type: file.type || "application/pdf" }),
            credentials: "include",
          },
        );
        if (!uploadResponse.ok) {
          const text = await uploadResponse.text().catch(() => "");
          throw new Error(
            `PDF upload failed (${uploadResponse.status}): ${text || uploadResponse.statusText}`,
          );
        }
        const uploadJson = (await uploadResponse.json()) as { url?: string };
        if (!uploadJson.url) throw new Error("PDF upload response missing url");

        // Create contract row in D1, linked to benefit (also updates benefit.active_contract_id).
        const version = new Date().toISOString();
        const vendorName = (benefitVendorValue.trim() || selectedBenefit?.vendorName || "Vendor").slice(0, 120);
        const contractResponse = await createContract({
          variables: {
            input: {
              benefitId: resolvedBenefitId,
              vendorName,
              version,
              r2ObjectKey: uploadJson.url,
              sha256Hash,
              isActive: true,
            },
          },
        });
        const createdContractId = contractResponse.data?.createContract?.id;
        if (!createdContractId) throw new Error("Failed to create contract record");

        // Navigate to builder with real URL + ids (no blob URL).
        router.push(
          `/admin/rules/contract-builder?file=${encodeURIComponent(file.name)}&url=${encodeURIComponent(
            uploadJson.url,
          )}&benefitId=${encodeURIComponent(resolvedBenefitId)}&contractId=${encodeURIComponent(createdContractId)}`,
        );
      } catch (error) {
        setBenefitActionError(error instanceof Error ? error.message : "Failed to save contract.");
      }
    })();
  };

  const handleUpdateBenefit = async () => {
    if (!selectedBenefit) {
      return;
    }

    const subsidyPercent = Number(benefitSubsidyValue);
    if (!benefitNameValue.trim() || Number.isNaN(subsidyPercent)) {
      setBenefitActionError("Benefit name and subsidy percent are required.");
      return;
    }

    try {
      await updateBenefit({
        variables: {
          input: {
            id: selectedBenefit.id,
            name: benefitNameValue.trim(),
            category: benefitCategoryValue.trim() || null,
            subsidyPercent,
            vendorName: benefitVendorValue.trim() || null,
            activeContractId: benefitContractValue.trim() || null,
          },
        },
      });
      await refetchBenefits();
      closeEditBenefitModal();
    } catch (error) {
      setBenefitActionError(
        error instanceof Error ? error.message : "Failed to update benefit.",
      );
    }
  };

  const handleDeleteBenefit = async () => {
    if (!deletingBenefitId) {
      return;
    }

    try {
      await deleteBenefit({ variables: { id: deletingBenefitId } });
      await refetchBenefits();

      if (selectedBenefitId === deletingBenefitId) {
        const nextBenefit =
          benefits.find((benefit) => benefit.id !== deletingBenefitId) ?? null;
        setSelectedBenefitIdOverride(nextBenefit?.id ?? null);
      }

      closeDeleteBenefitModal();
    } catch (error) {
      setBenefitActionError(
        error instanceof Error ? error.message : "Failed to delete benefit.",
      );
    }
  };

  const renderRuleForm = () => (
    <>
      <div>
        <label className="mb-2 block text-base font-medium text-slate-500">
          Rule Type
        </label>
        <Input
          value={ruleTypeInputValue}
          onChange={(event) => {
            const nextValue = event.target.value;
            setRuleTypeInputValue(nextValue);
            setRuleTypeValue(nextValue);
            setIsRuleTypeOpen(false);
          }}
          placeholder="e.g., Employment Status"
          className="h-11 rounded-xl border border-[#cfd8e6] bg-white px-4 text-base text-gray-800 placeholder:text-[#7A8798] focus-visible:ring-0"
        />
      </div>

      <div>
        <label className="mb-2 block text-base font-medium text-slate-500">
          Condition
        </label>
        <div className="grid grid-cols-3 gap-3">
          <div ref={ruleTypeDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setIsOperatorOpen(false);
                setIsRuleTypeOpen((open) => !open);
              }}
              className={`flex h-11 w-full items-center justify-between rounded-[10px] border border-[#d9e2ef] bg-white px-4 pr-10 text-left text-base ${ruleTypeValue ? "text-gray-800" : "text-black"
                }`}
              title={
                ruleTypeValue ? formatRuleTypeLabel(ruleTypeValue) : "Status"
              }
              aria-haspopup="listbox"
              aria-expanded={isRuleTypeOpen}
            >
              <span className="truncate">
                {ruleTypeValue ? formatRuleTypeLabel(ruleTypeValue) : "Status"}
              </span>
              <ChevronDown
                className={`pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400 transition-transform ${isRuleTypeOpen ? "rotate-180" : ""
                  }`}
              />
            </button>

            {isRuleTypeOpen ? (
              <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-[16px] border border-[#d9e1ef] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
                <ul
                  role="listbox"
                  aria-label="Rule type options"
                  className="max-h-64 overflow-y-auto py-2"
                >
                  {RULE_TYPE_OPTIONS.map((option) => (
                    <li key={option.value}>
                      <button
                        type="button"
                        onClick={() => {
                          setRuleTypeValue(option.value);
                          setRuleTypeInputValue(option.label);
                          setIsRuleTypeOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left text-[16px] text-[#253247] transition hover:bg-[#f8fbff]"
                      >
                        {option.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div ref={operatorDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setIsRuleTypeOpen(false);
                setIsOperatorOpen((open) => !open);
              }}
              className="flex h-11 w-full items-center justify-between rounded-[10px] border border-[#d9e2ef] bg-white px-4 pr-10 text-left text-base text-gray-800"
              title={
                OPERATOR_OPTIONS.find(
                  (option) => option.value === conditionOperator,
                )?.label ?? "Equals"
              }
              aria-haspopup="listbox"
              aria-expanded={isOperatorOpen}
            >
              <span className="truncate">
                {OPERATOR_OPTIONS.find(
                  (option) => option.value === conditionOperator,
                )?.label ?? "Equals"}
              </span>
              <ChevronDown
                className={`pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400 transition-transform ${isOperatorOpen ? "rotate-180" : ""
                  }`}
              />
            </button>

            {isOperatorOpen ? (
              <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-[16px] border border-[#d9e1ef] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
                <ul
                  role="listbox"
                  aria-label="Operator options"
                  className="max-h-64 overflow-y-auto py-2"
                >
                  {OPERATOR_OPTIONS.map((option) => (
                    <li key={option.value}>
                      <button
                        type="button"
                        onClick={() => {
                          setConditionOperator(option.value);
                          setIsOperatorOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left text-[16px] text-[#253247] transition hover:bg-[#f8fbff]"
                      >
                        {option.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <Input
            value={conditionValue}
            onChange={(event) => setConditionValue(event.target.value)}
            placeholder="Value"
            className="h-11 rounded-[10px] border border-[#d9e2ef] bg-white px-4 text-base text-gray-800 placeholder:text-[#7A8798] focus-visible:ring-0"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-base font-medium text-slate-500">
          Fail message
        </label>
        <Input
          value={failMessageValue}
          onChange={(event) => setFailMessageValue(event.target.value)}
          placeholder="Message shown when rule fails"
          className="h-11 rounded-[10px] border border-[#d9e2ef] bg-white px-4 text-base text-gray-800 placeholder:text-[#7A8798] focus-visible:ring-0"
        />
      </div>

      {actionError ? (
        <p className="text-base text-red-600">{actionError}</p>
      ) : null}
    </>
  );

  const renderBenefitForm = () => (
    <>
      <div>
        <label className="mb-2 block text-base font-medium text-slate-500">
          Benefit name
        </label>
        <Input
          value={benefitNameValue}
          onChange={(event) => setBenefitNameValue(event.target.value)}
          placeholder="I.e.g.,private insurance"
          className="h-11 rounded-xl border border-[#cfd8e6] bg-white px-4 text-base text-gray-800 focus-visible:ring-0"
        />
      </div>

      <div>
        <label className="mb-2 block text-base font-medium text-slate-500">
          Details
        </label>
        <textarea
          value={benefitVendorValue}
          onChange={(event) => setBenefitVendorValue(event.target.value)}
          placeholder="Write the benefit details"
          className="min-h-[76px] w-full resize-none rounded-xl border border-[#d9e2ef] bg-white px-4 py-3 text-base text-gray-800 outline-none"
        />
      </div>

      <div>
        <label className="mb-2 block text-base font-medium text-slate-500">
          Upload contract
        </label>
        <div className="space-y-3">
          {!benefitContractFile ? (
            <>
              <input
                id="benefit-contract-input"
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    return;
                  }

                  setBenefitContractFile(file);
                  setBenefitContractValue(file.name);
                  if (contractPreviewUrl) {
                    URL.revokeObjectURL(contractPreviewUrl);
                  }
                  setContractPreviewUrl(URL.createObjectURL(file));
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById(
                    "benefit-contract-input",
                  ) as HTMLInputElement | null;
                  input?.click();
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  const file = event.dataTransfer.files?.[0];
                  if (!file) {
                    return;
                  }

                  setBenefitContractFile(file);
                  setBenefitContractValue(file.name);
                  if (contractPreviewUrl) {
                    URL.revokeObjectURL(contractPreviewUrl);
                  }
                  setContractPreviewUrl(URL.createObjectURL(file));
                }}
                className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[#d9e2ef] bg-[#fbfcff] px-4 py-7 text-center transition hover:border-[#b9c7dd] hover:bg-white"
              >
                <UploadCloud className="mb-3 h-7 w-7 text-[#3164e0]" />
                <p className="text-[16px] font-medium text-[#17243d]">
                  Drag and drop your PDF here
                </p>
                <p className="mt-1 text-[16px] text-[#7a8798]">
                  Upload a contract PDF to add signature fields
                </p>
              </button>
            </>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#d9e2ef] bg-[#fbfcff] px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e4ecff] text-[#3164e0]">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[16px] font-medium text-[#17243d]">
                    {benefitContractFile.name}
                  </p>
                  <p className="text-[16px] text-[#7a8798]">
                    {formatFileSize(benefitContractFile.size)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBenefitContractFile(null);
                  setBenefitContractValue("");
                  if (contractPreviewUrl) {
                    URL.revokeObjectURL(contractPreviewUrl);
                  }
                  setContractPreviewUrl(null);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full text-[#94a3b8] transition hover:bg-[#e2e8f0] hover:text-[#17243d]"
                aria-label="Remove uploaded contract"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {benefitActionError ? (
        <p className="text-base text-red-600">{benefitActionError}</p>
      ) : null}
    </>
  );

  return (
    <>
      <section className="space-y-10 pb-24">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <h1 className="text-[2.35rem] font-medium tracking-[-0.05em] text-[#17243d]">
              Benefit Rules
            </h1>
            <p className="text-[1.15rem] text-[#708198]">
              Configure eligibility rules for each benefit
            </p>
          </div>

          <Button
            type="button"
            onClick={handleOpenAddBenefit}
            className="h-12 rounded-[14px] bg-[#2F66F6] px-6 text-[16px] font-medium text-white shadow-[0_10px_24px_rgba(47,102,246,0.18)] hover:bg-[#2456d7]"
          >
            <Plus className="h-5 w-5" />
            Add Benefit
          </Button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.1fr)_minmax(0,1fr)]">
          <div ref={dropdownRef} className="relative z-20">
            <label className="mb-3 block text-[16px] text-[#708198]">
              Select benefit
            </label>
            <button
              type="button"
              onClick={() => setIsBenefitOpen((open) => !open)}
              className="flex h-16 w-full items-center justify-between rounded-[16px] border border-[#d9e1ef] bg-white px-5 text-left text-[16px] font-medium text-[#17243d] shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition hover:border-[#c7d5e6]"
              aria-haspopup="listbox"
              aria-expanded={isBenefitOpen}
            >
              <span className="truncate">
                {selectedBenefit?.name ??
                  (loadingBenefits ? "Loading..." : "No benefits")}
              </span>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-[#7a8798] transition-transform ${isBenefitOpen ? "rotate-180" : ""
                  }`}
              />
            </button>

            {isBenefitOpen ? (
              <div className="absolute inset-x-0 top-full mt-3 overflow-hidden rounded-[18px] border border-[#d9e1ef] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
                <ul
                  role="listbox"
                  aria-label="Benefit options"
                  className="max-h-[420px] overflow-y-auto py-2"
                >
                  {benefits.map((benefit) => (
                    <li key={benefit.id}>
                      <div className="flex items-center gap-3 px-3 py-1.5 transition hover:bg-[#f8fbff]">
                        <button
                          type="button"
                          onClick={() => setSelectedBenefit(benefit.id)}
                          className="min-w-0 flex-1 rounded-[12px] px-2 py-2 text-left text-[16px] text-[#253247]"
                        >
                          <span className="truncate">{benefit.name}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setDeletingBenefitId(benefit.id);
                            setBenefitActionError(null);
                          }}
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[#94a3b8] transition hover:bg-[#fee2e2] hover:text-[#dc2626]"
                          aria-label={`Delete benefit ${benefit.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div>
            <label className="mb-3 block text-[16px] text-[#708198]">
              Details
            </label>
            <button
              type="button"
              onClick={handleOpenEditBenefit}
              disabled={!selectedBenefit}
              className="flex h-16 w-full items-center rounded-[16px] border border-[#d9e1ef] bg-white px-5 text-left text-[16px] text-[#475569] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-[#c7d5e6] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="truncate">
                {selectedBenefit
                  ? `${selectedBenefit.subsidyPercent}% subsidy on ${selectedBenefit.vendorName ?? selectedBenefit.name
                  }`
                  : "Select a benefit to view details"}
              </span>
            </button>
          </div>

          <div>
            <label className="mb-3 block text-[16px] text-[#708198]">
              Contract
            </label>
            <button
              type="button"
              onClick={handleOpenSignedContractPreview}
              disabled={!selectedBenefit}
              className="flex h-16 w-full items-center gap-3 rounded-[16px] border border-[#d9e1ef] bg-white px-5 text-left text-[16px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-[#c7d5e6] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <FileText
                className={`h-5 w-5 shrink-0 ${selectedBenefit?.activeContractId
                    ? "text-[#2563EB]"
                    : "text-[#94A3B8]"
                  }`}
              />
              <span
                className={`truncate ${selectedBenefit?.activeContractId
                    ? "text-[#253247]"
                    : "text-[#708198]"
                  }`}
              >
                {selectedBenefit?.activeContractId
                  ? selectedBenefit.activeContractId
                  : selectedBenefit?.requiresContract
                    ? "Contract required"
                    : "No contract attached"}
              </span>
            </button>

            {signedPreviewUrl ? (
              <div className="mt-3 overflow-hidden rounded-[16px] border border-[#d9e1ef] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                <div className="flex items-center justify-between gap-3 border-b border-[#eef2f7] px-4 py-3">
                  <div className="text-[0.95rem] font-semibold text-[#17243d]">
                    Signed contract preview
                  </div>
                  <button
                    type="button"
                    onClick={() => setSignedPreviewUrl(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[#94a3b8] transition hover:bg-[#f1f5f9] hover:text-[#17243d]"
                    aria-label="Close signed preview"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="h-[52vh] min-h-[420px] bg-[#fbfcfe] p-3">
                  <div className="h-full overflow-hidden rounded-[14px] border border-[#e4ebf5] bg-white">
                    <iframe title="Signed contract preview" src={signedPreviewUrl} className="h-full w-full" />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="admin-table-card">
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead className="admin-table-head">
                <tr className="admin-table-header-row">
                  <th className="admin-table-th w-16 text-[16px]">#</th>
                  <th className="admin-table-th text-[16px]">Rule Type</th>
                  <th className="admin-table-th text-[16px]">Condition</th>
                  <th className="admin-table-th text-[16px]">Fail Message</th>
                  <th className="admin-table-th w-32 text-right text-[16px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rules.length > 0 ? (
                  rules.map((rule, index) => (
                    <tr key={rule.id} className="text-[#17243d]">
                      <td className="admin-table-cell text-[16px] text-[#5f6b7e]">
                        {index + 1}
                      </td>
                      <td className="admin-table-cell text-[16px] font-medium tracking-[-0.02em] text-[#17243d]">
                        {formatRuleTypeLabel(rule.type)}
                      </td>
                      <td className="admin-table-cell font-mono text-[16px] text-[#55637d]">
                        {rule.type} {OPERATOR_SYMBOL[rule.operator]}{" "}
                        {rule.value}
                      </td>
                      <td className="admin-table-cell text-[16px] text-[#475569]">
                        {rule.errorMessage}
                      </td>
                      <td className="admin-table-cell">
                        <div className="flex items-center justify-end gap-3 text-[#748197]">
                          <button
                            type="button"
                            onClick={() => handleEditRule(rule)}
                            className="rounded-[10px] p-1.5 transition hover:bg-[#f4f7fb] hover:text-[#17243d]"
                            aria-label={`Edit rule ${rule.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeletingRuleId(rule.id);
                              setActionError(null);
                            }}
                            className="rounded-[10px] p-1.5 transition hover:bg-[#f4f7fb] hover:text-[#EF4444]"
                            aria-label={`Delete rule ${rule.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : !loadingRules ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="admin-table-cell px-6 py-14 text-center text-[16px] text-[#94A3B8]"
                    >
                      No rules found for this benefit.
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="admin-table-cell px-6 py-14 text-center text-[16px] text-[#94A3B8]"
                    >
                      Loading rules...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={handleAddRule}
          disabled={!selectedBenefitId}
          className="h-11 rounded-[14px] border-[#d9e1ef] bg-white px-5 text-[16px] font-medium text-[#253247] shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:bg-[#f8fbff]"
        >
          <Plus className="h-4 w-4" />
          Add rule
        </Button>
      </section>

      {editingRule ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 p-4">
          <div className="w-full max-w-[560px] rounded-[12px] bg-[#f5f5f5] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-semibold tracking-tight text-gray-900">
                Edit Rule
              </h2>
              <button
                type="button"
                onClick={closeEditModal}
                className="text-gray-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-5">{renderRuleForm()}</div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={closeEditModal}
                className="h-10 min-w-24 rounded-[10px] border border-gray-300 bg-white px-4 text-base font-medium text-gray-800 shadow-none hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleUpdateRule}
                disabled={isSaving}
                className="h-10 min-w-24 rounded-[10px] bg-blue-600 px-4 text-base font-medium text-white hover:bg-blue-700"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isAddModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 p-4">
          <div className="w-full max-w-[560px] rounded-[12px] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-semibold tracking-tight text-gray-900">
                Add New Rule
              </h2>
              <button
                type="button"
                onClick={closeAddModal}
                className="text-gray-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-5">{renderRuleForm()}</div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={closeAddModal}
                className="h-10 min-w-24 rounded-[10px] border border-gray-300 bg-white px-4 text-base font-medium text-gray-800 shadow-none hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCreateNewRule}
                disabled={isSaving}
                className="h-10 min-w-24 rounded-xl bg-blue-600 px-4 text-base font-medium text-white hover:bg-blue-700"
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {deletingRuleId !== null ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
          <div className="w-full max-w-[360px] rounded-[12px] bg-[#f5f5f5] px-6 py-6 shadow-2xl">
            <h2 className="text-center text-[16px] font-medium leading-tight text-gray-900">
              Do you want to delete this rule?
            </h2>

            {actionError ? (
              <p className="mt-4 text-center text-base text-red-600">
                {actionError}
              </p>
            ) : null}

            <div className="mt-7 flex justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={closeDeleteModal}
                className="h-9 min-w-20 rounded-[10px] border border-gray-300 bg-white px-5 text-base font-medium text-gray-800 shadow-none hover:bg-gray-50"
              >
                No
              </Button>
              <Button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deletingRule}
                className="h-9 min-w-20 rounded-[10px] bg-blue-600 px-5 text-base font-medium text-white hover:bg-blue-700"
              >
                Yes
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isDeleteSuccessOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
          <div
            className="w-full max-w-[360px] rounded-[12px] bg-[#f5f5f5] px-6 py-7 text-center shadow-2xl"
            onClick={closeDeleteSuccessModal}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#c9efd8]">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-emerald-600 text-emerald-600">
                <Check className="h-4 w-4" strokeWidth={3} />
              </div>
            </div>

            <p className="mt-6 text-[16px] font-medium leading-[1.3] tracking-tight text-black">
              The rule has been deleted successfully.
            </p>
          </div>
        </div>
      ) : null}

      {deletingBenefitId !== null ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
          <div className="w-full max-w-[360px] rounded-[12px] bg-[#f5f5f5] px-6 py-6 shadow-2xl">
            <h2 className="text-center text-[16px] font-medium leading-tight text-gray-900">
              Do you want to delete this benefit?
            </h2>

            {benefitActionError ? (
              <p className="mt-4 text-center text-base text-red-600">
                {benefitActionError}
              </p>
            ) : null}

            <div className="mt-7 flex justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={closeDeleteBenefitModal}
                className="h-9 min-w-20 rounded-[10px] border border-gray-300 bg-white px-5 text-base font-medium text-gray-800 shadow-none hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleDeleteBenefit}
                disabled={deletingBenefit}
                className="h-9 min-w-20 rounded-[10px] bg-red-500 px-5 text-base font-medium text-white hover:bg-red-600"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isAddBenefitModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 p-4">
          <div className="w-full max-w-[560px] rounded-[12px] bg-[#f5f5f5] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-semibold tracking-tight text-gray-900">
                Add Benefit
              </h2>
              <button
                type="button"
                onClick={closeAddBenefitModal}
                className="text-gray-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-5">{renderBenefitForm()}</div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={closeAddBenefitModal}
                className="h-10 min-w-24 rounded-[10px] border border-gray-300 bg-white px-4 text-base font-medium text-gray-800 shadow-none hover:bg-gray-50"
              >
                Cancel
              </Button>
              {benefitContractFile ? (
                <Button
                  type="button"
                  onClick={handleContinueToContractBuilder}
                  className="h-10 min-w-24 rounded-xl bg-blue-600 px-4 text-base font-medium text-white hover:bg-blue-700"
                >
                  Continue
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleCreateBenefit}
                  disabled={isSavingBenefit}
                  className="h-10 min-w-24 rounded-xl bg-blue-600 px-4 text-base font-medium text-white hover:bg-blue-700"
                >
                  Add
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {isAddBenefitModalOpen &&
        isContractBuilderOpen &&
        contractPreviewUrl &&
        benefitContractFile ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/40 p-4">
          <div className="flex h-full max-h-[680px] w-full max-w-6xl flex-col overflow-hidden rounded-[18px] border border-[#d9e1ef] bg-[#f8fafc] shadow-[0_24px_64px_rgba(15,23,42,0.38)]">
            <div className="flex items-center justify-between border-b border-[#dde4f0] bg-white px-6 py-4">
              <div className="space-y-1">
                <h2 className="text-[16px] font-semibold tracking-[-0.04em] text-[#17243d]">
                  Prepare contract for {benefitNameValue || "New benefit"}
                </h2>
                <p className="text-[16px] text-[#6d7b93]">
                  Review the contract and confirm the template before activating
                  this benefit.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsContractBuilderOpen(false)}
                className="rounded-[10px] p-1.5 text-[#64748b] transition hover:bg-[#e2e8f0] hover:text-[#0f172a]"
                aria-label="Close contract builder"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-4 bg-[#eef2f9] p-4 lg:flex-row">
              <section className="flex-1 overflow-hidden rounded-[16px] border border-[#d9e1ef] bg-white">
                <div className="flex items-center justify-between border-b border-[#e2e8f0] px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[16px] font-medium text-[#17243d]">
                      {benefitContractFile.name}
                    </p>
                    <p className="text-[16px] text-[#7a8798]">
                      PDF preview · {formatFileSize(benefitContractFile.size)}
                    </p>
                  </div>
                </div>
                <div className="h-full bg-[#f1f5f9] p-3">
                  <div className="h-full min-h-[420px] overflow-hidden rounded-[14px] border border-[#d9e1ef] bg-white">
                    <iframe
                      title="Contract PDF preview"
                      src={contractPreviewUrl}
                      className="h-full w-full"
                    />
                  </div>
                </div>
              </section>

              <section className="w-full max-w-sm rounded-[16px] border border-[#d9e1ef] bg-white px-5 py-5">
                <h3 className="text-[16px] font-semibold text-[#17243d]">
                  Template details
                </h3>
                <div className="mt-4 space-y-3 text-[16px]">
                  <div className="space-y-1">
                    <p className="text-[16px] font-medium uppercase tracking-[0.16em] text-[#94a3b8]">
                      Benefit
                    </p>
                    <p className="rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-[#0f172a]">
                      {benefitNameValue || "Untitled benefit"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[16px] font-medium uppercase tracking-[0.16em] text-[#94a3b8]">
                      Details
                    </p>
                    <p className="min-h-[64px] rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-[#4b5563]">
                      {benefitVendorValue ||
                        "No description yet. Add details to clarify coverage and conditions."}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[16px] font-medium uppercase tracking-[0.16em] text-[#94a3b8]">
                      Subsidy
                    </p>
                    <p className="rounded-[10px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-[#0f172a]">
                      {Number.isNaN(Number(benefitSubsidyValue))
                        ? "Not set"
                        : `${benefitSubsidyValue}% company subsidy`}
                    </p>
                  </div>
                </div>
                <div className="mt-6 space-y-3 text-[16px] text-[#64748b]">
                  <p className="font-medium text-[#0f172a]">Next steps</p>
                  <ul className="space-y-1.5">
                    <li>Review the PDF with your legal or HR team.</li>
                    <li>
                      Confirm this file as the active template for the benefit.
                    </li>
                    <li>
                      Save to make this contract available for employee
                      requests.
                    </li>
                  </ul>
                </div>
                <div className="mt-6 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsContractBuilderOpen(false)}
                    className="h-9 rounded-[10px] border-[#d9e1ef] px-4 text-[16px] text-[#1f2933] hover:bg-[#f8fafc]"
                  >
                    Close
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCreateBenefit}
                    disabled={isSavingBenefit}
                    className="h-9 rounded-[10px] bg-[#2563eb] px-4 text-[16px] font-medium text-white hover:bg-[#1d4ed8]"
                  >
                    Save template
                  </Button>
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : null}

      {isEditBenefitModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 p-4">
          <div className="w-full max-w-[560px] rounded-[12px] bg-[#f5f5f5] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-semibold tracking-tight text-gray-900">
                Edit Benefit
              </h2>
              <button
                type="button"
                onClick={closeEditBenefitModal}
                className="text-gray-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-5">{renderBenefitForm()}</div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={closeEditBenefitModal}
                className="h-10 min-w-24 rounded-[10px] border border-gray-300 bg-white px-4 text-base font-medium text-gray-800 shadow-none hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleUpdateBenefit}
                disabled={isSavingBenefit}
                className="h-10 min-w-24 rounded-xl bg-blue-600 px-4 text-base font-medium text-white hover:bg-blue-700"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
