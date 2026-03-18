"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { Check, ChevronDown, FileText, Pencil, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type RuleOperator = "eq" | "neq" | "lt" | "lte" | "gt" | "gte" | "in" | "not_in";

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
  "employment_status",
  "okr_submitted",
  "attendance",
  "responsibility_level",
  "role",
  "department",
  "tenure_days",
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
  type: RULE_TYPE_OPTIONS[0],
  operator: OPERATOR_OPTIONS[0].value,
  value: "",
  errorMessage: "",
};

function formatRuleTypeLabel(value: string) {
  if (!value) {
    return "Custom rule";
  }

  return value
    .replace(/_/g, " ")
    .replace(/\bokr\b/gi, "OKR")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function AdminRulesPage() {
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [selectedBenefitIdOverride, setSelectedBenefitIdOverride] = useState<string | null>(null);
  const [isBenefitOpen, setIsBenefitOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddBenefitModalOpen, setIsAddBenefitModalOpen] = useState(false);
  const [isEditBenefitModalOpen, setIsEditBenefitModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  const [isDeleteSuccessOpen, setIsDeleteSuccessOpen] = useState(false);
  const [ruleTypeValue, setRuleTypeValue] = useState(EMPTY_FORM.type);
  const [conditionOperator, setConditionOperator] = useState<RuleOperator>(EMPTY_FORM.operator);
  const [conditionValue, setConditionValue] = useState(EMPTY_FORM.value);
  const [failMessageValue, setFailMessageValue] = useState(EMPTY_FORM.errorMessage);
  const [actionError, setActionError] = useState<string | null>(null);
  const [benefitActionError, setBenefitActionError] = useState<string | null>(null);
  const [benefitNameValue, setBenefitNameValue] = useState("");
  const [benefitCategoryValue, setBenefitCategoryValue] = useState("");
  const [benefitVendorValue, setBenefitVendorValue] = useState("");
  const [benefitSubsidyValue, setBenefitSubsidyValue] = useState("50");
  const [benefitContractValue, setBenefitContractValue] = useState<File | null>(null);

  const {
    data: benefitData,
    loading: loadingBenefits,
    refetch: refetchBenefits,
  } = useQuery<BenefitsQueryData>(GET_BENEFITS);

  const benefits = useMemo(
    () => (benefitData?.benefits ?? []).filter((benefit) => benefit.isActive),
    [benefitData?.benefits],
  );

  const selectedBenefitId = selectedBenefitIdOverride ?? benefits[0]?.id ?? null;

  const selectedBenefit = useMemo(
    () => benefits.find((benefit) => benefit.id === selectedBenefitId) ?? null,
    [benefits, selectedBenefitId],
  );

  const { data: latestVersionData, refetch: refetchLatestVersion } = useQuery<LatestVersionQueryData>(
    GET_LATEST_RULE_VERSION,
    {
      variables: { benefitId: selectedBenefitId },
      skip: !selectedBenefitId,
    },
  );

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

  const rules = useMemo(() => rulesData?.eligibilityRules ?? [], [rulesData?.eligibilityRules]);

  const editingRule = useMemo(
    () => rules.find((rule) => rule.id === editingRuleId) ?? null,
    [editingRuleId, rules],
  );

  const [createRule, { loading: creatingRule }] = useMutation<RuleMutationData>(CREATE_RULE);
  const [updateRule, { loading: updatingRule }] = useMutation<RuleMutationData>(UPDATE_RULE);
  const [deleteRule, { loading: deletingRule }] = useMutation<RuleMutationData>(DELETE_RULE);
  const [createBenefit, { loading: creatingBenefit }] = useMutation<BenefitMutationData>(CREATE_BENEFIT);
  const [updateBenefit, { loading: updatingBenefit }] = useMutation<BenefitMutationData>(UPDATE_BENEFIT);

  const isSaving = creatingRule || updatingRule;
  const isSavingBenefit = creatingBenefit || updatingBenefit;

  const resetForm = () => {
    setRuleTypeValue(EMPTY_FORM.type);
    setConditionOperator(EMPTY_FORM.operator);
    setConditionValue(EMPTY_FORM.value);
    setFailMessageValue(EMPTY_FORM.errorMessage);
    setActionError(null);
  };

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsBenefitOpen(false);
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

  const resetBenefitForm = () => {
    setBenefitNameValue("");
    setBenefitCategoryValue("");
    setBenefitVendorValue("");
    setBenefitSubsidyValue("50");
    setBenefitContractValue(null);
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
    // setBenefitContractValue(selectedBenefit.activeContractId ?? "");
    setBenefitActionError(null);
    setIsEditBenefitModalOpen(true);
  };

  const handleEditRule = (rule: RuleDataItem) => {
    setEditingRuleId(rule.id);
    setRuleTypeValue(rule.type);
    setConditionOperator(rule.operator);
    setConditionValue(rule.value);
    setFailMessageValue(rule.errorMessage);
    setActionError(null);
  };

  const handleCreateNewRule = async () => {
    if (!selectedBenefitId) {
      setActionError("Select a benefit first.");
      return;
    }

    if (!ruleTypeValue.trim() || !conditionValue.trim() || !failMessageValue.trim()) {
      setActionError("Rule type, condition value, and fail message are required.");
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
      setActionError(error instanceof Error ? error.message : "Failed to create rule.");
    }
  };

  const handleUpdateRule = async () => {
    if (!editingRuleId) {
      return;
    }

    if (!ruleTypeValue.trim() || !conditionValue.trim() || !failMessageValue.trim()) {
      setActionError("Rule type, condition value, and fail message are required.");
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
      setActionError(error instanceof Error ? error.message : "Failed to update rule.");
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
      setActionError(error instanceof Error ? error.message : "Failed to delete rule.");
    }
  };

  const setSelectedBenefit = (benefitId: string) => {
    setSelectedBenefitIdOverride(benefitId);
    setIsBenefitOpen(false);
  };

  const handleCreateBenefit = async () => {
    const subsidyPercent = Number(benefitSubsidyValue);
    if (!benefitNameValue.trim() || Number.isNaN(subsidyPercent || !benefitContractValue)) {
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
            // activeContractId: benefitContractValue.trim() || null,
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
      setBenefitActionError(error instanceof Error ? error.message : "Failed to create benefit.");
    }
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
            // activeContractId: benefitContractValue.trim() || null,
          },
        },
      });
      await refetchBenefits();
      closeEditBenefitModal();
    } catch (error) {
      setBenefitActionError(error instanceof Error ? error.message : "Failed to update benefit.");
    }
  };

  const renderRuleForm = () => (
    <>
      <div>
        <label className="mb-2 block text-base font-medium text-slate-500">
          Rule Type
        </label>
        <Input
          value={ruleTypeValue}
          onChange={(event) => setRuleTypeValue(event.target.value)}
          placeholder="e.g., Employment Status"
          className="h-11 rounded-xl border border-[#cfd8e6] bg-white px-4 text-base text-gray-800 focus-visible:ring-0"
        />
      </div>

      <div>
        <label className="mb-2 block text-base font-medium text-slate-500">
          Condition
        </label>
        <div className="grid grid-cols-3 gap-3">
          <div className="relative">
            <div
              className="flex h-11 items-center rounded-[10px] border border-[#d9e2ef] bg-white px-4 pr-10 text-sm text-slate-500"
              title={ruleTypeValue || "Rule type"}
            >
              {ruleTypeValue || "Employment..."}
            </div>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          <div className="relative">
            <select
              value={conditionOperator}
              onChange={(event) => setConditionOperator(event.target.value as RuleOperator)}
              className="h-11 w-full appearance-none rounded-[10px] border border-[#d9e2ef] bg-white px-4 pr-10 text-sm text-gray-800 outline-none"
            >
              {OPERATOR_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          <Input
            value={conditionValue}
            onChange={(event) => setConditionValue(event.target.value)}
            placeholder="Value"
            className="h-11 rounded-[10px] border border-[#d9e2ef] bg-white px-4 text-sm text-gray-800 focus-visible:ring-0"
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
          className="h-11 rounded-[10px] border border-[#d9e2ef] bg-white px-4 text-sm text-gray-800 focus-visible:ring-0"
        />
      </div>

      {actionError ? (
        <p className="text-sm text-red-600">{actionError}</p>
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
          className="min-h-[76px] w-full resize-none rounded-xl border border-[#d9e2ef] bg-white px-4 py-3 text-sm text-gray-800 outline-none"
        />
      </div>

      <div>
        <label className="mb-2 block text-base font-medium text-slate-500">
          Upload Contract
        </label>

        {!benefitContractValue ? (
          // 🟦 EMPTY STATE (drag & drop)
          <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center transition hover:border-gray-400">

            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setBenefitContractValue(file);
              }}
              className="absolute inset-0 cursor-pointer opacity-0"
            />

            <div className="mb-4">
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.8999 0.899902V16.8999M12.8999 0.899902L19.5666 7.56657M12.8999 0.899902L6.23324 7.56657M24.8999 16.8999V22.2332C24.8999 22.9405 24.619 23.6188 24.1189 24.1189C23.6188 24.619 22.9405 24.8999 22.2332 24.8999H3.56657C2.85933 24.8999 2.18105 24.619 1.68095 24.1189C1.18085 23.6188 0.899902 22.9405 0.899902 22.2332V16.8999" stroke="#0E1629" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>

            </div>

            <p className="text-lg font-medium text-gray-800">
              Drag and drop your PDF here
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Upload a contract PDF to add signature fields
            </p>
          </div>
        ) : (
          // 🟩 FILE SELECTED STATE
          <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-100 px-4 py-3">

            <div className="flex items-center gap-3">
              {/* File icon */}
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <svg
                  className="h-5 w-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
                  <path d="M14 3v5h5" />
                </svg>

              </div>

              {/* File info */}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {benefitContractValue.name}
                </p>
                <p className="text-sm text-gray-500">
                  {(benefitContractValue.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>

            {/* Remove button */}
            <button
              type="button"
              onClick={() => setBenefitContractValue(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {benefitActionError ? (
        <p className="text-sm text-red-600">{benefitActionError}</p>
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
            className="h-12 rounded-[14px] bg-[#2F66F6] px-6 text-[1rem] font-medium text-white shadow-[0_10px_24px_rgba(47,102,246,0.18)] hover:bg-[#2456d7]"
          >
            <Plus className="h-5 w-5" />
            Add Benefit
          </Button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.1fr)_minmax(0,1fr)]">
          <div ref={dropdownRef} className="relative z-20">
            <label className="mb-3 block text-[1.05rem] text-[#708198]">
              Select benefit
            </label>
            <button
              type="button"
              onClick={() => setIsBenefitOpen((open) => !open)}
              className="flex h-16 w-full items-center justify-between rounded-[16px] border border-[#d9e1ef] bg-white px-5 text-left text-[1.05rem] font-medium text-[#17243d] shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition hover:border-[#c7d5e6]"
              aria-haspopup="listbox"
              aria-expanded={isBenefitOpen}
            >
              <span className="truncate">
                {selectedBenefit?.name ?? (loadingBenefits ? "Loading..." : "No benefits")}
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
                      <button
                        type="button"
                        onClick={() => setSelectedBenefit(benefit.id)}
                        className="w-full px-5 py-3 text-left text-[1rem] text-[#253247] transition hover:bg-[#f8fbff]"
                      >
                        {benefit.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div>
            <label className="mb-3 block text-[1.05rem] text-[#708198]">
              Details
            </label>
            <button
              type="button"
              onClick={handleOpenEditBenefit}
              disabled={!selectedBenefit}
              className="flex h-16 w-full items-center rounded-[16px] border border-[#d9e1ef] bg-white px-5 text-left text-[1.02rem] text-[#475569] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-[#c7d5e6] disabled:cursor-not-allowed disabled:opacity-70"
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
            <label className="mb-3 block text-[1.05rem] text-[#708198]">
              Contract
            </label>
            <button
              type="button"
              onClick={handleOpenEditBenefit}
              disabled={!selectedBenefit}
              className="flex h-16 w-full items-center gap-3 rounded-[16px] border border-[#d9e1ef] bg-white px-5 text-left text-[1.02rem] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-[#c7d5e6] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <FileText
                className={`h-5 w-5 shrink-0 ${selectedBenefit?.activeContractId ? "text-[#2563EB]" : "text-[#94A3B8]"
                  }`}
              />
              <span
                className={`truncate ${selectedBenefit?.activeContractId ? "text-[#253247]" : "text-[#708198]"
                  }`}
              >
                {selectedBenefit?.activeContractId
                  ? selectedBenefit.activeContractId
                  : selectedBenefit?.requiresContract
                    ? "Contract required"
                    : "No contract attached"}
              </span>
            </button>
          </div>
        </div>

        <div className="admin-table-card">
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead className="admin-table-head">
                <tr className="admin-table-header-row">
                  <th className="admin-table-th w-16">#</th>
                  <th className="admin-table-th">Rule Type</th>
                  <th className="admin-table-th">Condition</th>
                  <th className="admin-table-th">Fail Message</th>
                  <th className="admin-table-th w-32 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.length > 0 ? (
                  rules.map((rule, index) => (
                    <tr key={rule.id} className="text-[#17243d]">
                      <td className="admin-table-cell text-[1rem] text-[#5f6b7e]">
                        {index + 1}
                      </td>
                      <td className="admin-table-cell text-[1.15rem] font-medium tracking-[-0.02em] text-[#17243d]">
                        {formatRuleTypeLabel(rule.type)}
                      </td>
                      <td className="admin-table-cell font-mono text-[1.02rem] text-[#55637d]">
                        {rule.type} {OPERATOR_SYMBOL[rule.operator]} {rule.value}
                      </td>
                      <td className="admin-table-cell text-[1.02rem] text-[#475569]">
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
                      className="admin-table-cell px-6 py-14 text-center text-[1rem] text-[#94A3B8]"
                    >
                      No rules found for this benefit.
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="admin-table-cell px-6 py-14 text-center text-[1rem] text-[#94A3B8]"
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
          className="h-11 rounded-[14px] border-[#d9e1ef] bg-white px-5 text-[0.98rem] font-medium text-[#253247] shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:bg-[#f8fbff]"
        >
          <Plus className="h-4 w-4" />
          Add rule
        </Button>
      </section>

      {editingRule ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 p-4">
          <div className="w-full max-w-[560px] rounded-[12px] bg-[#f5f5f5] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight text-gray-900">Edit Rule</h2>
              <button type="button" onClick={closeEditModal} className="text-gray-400">
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
          <div className="w-full max-w-[560px] rounded-[12px] bg-[#f5f5f5] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight text-gray-900">Add New Rule</h2>
              <button type="button" onClick={closeAddModal} className="text-gray-400">
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
            <h2 className="text-center text-xl font-medium leading-tight text-gray-900">
              Do you want to delete this rule?
            </h2>

            {actionError ? (
              <p className="mt-4 text-center text-sm text-red-600">{actionError}</p>
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

            <p className="mt-6 text-2xl font-medium leading-[1.3] tracking-tight text-black">
              The rule has been deleted successfully.
            </p>
          </div>
        </div>
      ) : null}

      {isAddBenefitModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 p-4">
          <div className="w-full max-w-[560px] rounded-[12px] bg-[#f5f5f5] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight text-gray-900">Add Benefit</h2>
              <button type="button" onClick={closeAddBenefitModal} className="text-gray-400">
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
              <Button
                type="button"
                onClick={handleCreateBenefit}
                disabled={isSavingBenefit}
                className="h-10 min-w-24 rounded-xl bg-blue-600 px-4 text-base font-medium text-white hover:bg-blue-700"
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isEditBenefitModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 p-4">
          <div className="w-full max-w-[560px] rounded-[12px] bg-[#f5f5f5] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight text-gray-900">Edit Benefit</h2>
              <button type="button" onClick={closeEditBenefitModal} className="text-gray-400">
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
