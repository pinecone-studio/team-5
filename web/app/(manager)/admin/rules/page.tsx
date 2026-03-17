"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { Check, ChevronDown, FileText, Pencil, Plus, X } from "lucide-react";

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
  const [benefitContractValue, setBenefitContractValue] = useState("");

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
    setBenefitContractValue("");
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
            activeContractId: benefitContractValue.trim() || null,
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
          Contract
        </label>
        <div className="relative">
          <FileText className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#3164e0]" />
          <Input
            value={benefitContractValue}
            onChange={(event) => setBenefitContractValue(event.target.value)}
            placeholder="+ Add files"
            className="h-11 rounded-xl border border-[#d9e2ef] bg-white pr-4 pl-10 text-sm text-gray-800 focus-visible:ring-0"
          />
        </div>
      </div>

      {benefitActionError ? (
        <p className="text-sm text-red-600">{benefitActionError}</p>
      ) : null}
    </>
  );

  return (
    <>
      <section className="mx-auto w-full max-w-6xl px-2 py-2 sm:px-4 lg:px-6">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[2rem] font-semibold tracking-tight text-gray-950">
              Benefit Rules
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Configure eligibility rules for each benefit
            </p>
          </div>

          <Button
            type="button"
            onClick={handleOpenAddBenefit}
            className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Benefit
          </Button>
        </div>

        <div className="flex w-full items-center justify-between gap-4">
          <div ref={dropdownRef} className="relative z-20 w-full">
            <label className="mb-3 block text-sm font-medium text-gray-700">
              Select benefit
            </label>
            <button
              type="button"
              onClick={() => setIsBenefitOpen((open) => !open)}
              className="flex h-11 w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 text-left text-base font-medium text-gray-800 shadow-sm outline-none transition hover:border-gray-300"
              aria-haspopup="listbox"
              aria-expanded={isBenefitOpen}
            >
              <span>{selectedBenefit?.name ?? (loadingBenefits ? "Loading..." : "No benefits")}</span>
              <ChevronDown
                className={`h-5 w-5 text-gray-800 transition-transform ${isBenefitOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isBenefitOpen ? (
              <div className="absolute top-full right-0 left-0 mt-3 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md">
                <ul role="listbox" aria-label="Benefit options" className="max-h-[560px] overflow-y-auto py-2">
                  {benefits.map((benefit) => (
                    <li key={benefit.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedBenefit(benefit.id)}
                        className="w-full px-4 py-3 text-left text-base text-gray-800 transition hover:bg-gray-50"
                      >
                        {benefit.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="flex w-full max-w-[700px] gap-4">
            <div className="w-full">
              <label className="mb-3 block text-sm font-medium text-gray-700">
                Details
              </label>
                  <button
                    type="button"
                    onClick={handleOpenEditBenefit}
                    className="flex h-11 w-full items-center rounded-xl border border-gray-200 bg-gray-50 px-4 text-left text-sm text-gray-700"
                  >
                    {selectedBenefit
                  ? selectedBenefit.vendorName ?? `${selectedBenefit.subsidyPercent}% subsidy on selected benefit`
                  : "No benefit selected"}
                  </button>
                </div>

            <div className="w-full">
              <label className="mb-3 block text-sm font-medium text-gray-700">
                Contract
              </label>
                  <button
                    type="button"
                    onClick={handleOpenEditBenefit}
                    className="flex h-11 w-full items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 text-left text-sm text-gray-700"
                  >
                    <FileText className="h-4 w-4 text-[#3164e0]" />
                {selectedBenefit?.activeContractId ? selectedBenefit.activeContractId : "No contract"}
                  </button>
                </div>
              </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-[12px] border border-gray-200 bg-white shadow-sm">
          <table className="w-full border-collapse">
            <thead className="bg-white">
              <tr className="border-b border-gray-200 text-left">
                <th className="w-16 px-4 py-4 text-xs font-semibold uppercase tracking-wide text-gray-900">#</th>
                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-gray-900">Rule Type</th>
                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-gray-900">Condition</th>
                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-gray-900">Fail Message</th>
                <th className="w-32 px-4 py-4 text-xs font-semibold uppercase tracking-wide text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule, index) => (
                <tr key={rule.id} className="border-b border-gray-200 last:border-b-0">
                  <td className="px-4 py-5 text-base text-gray-700">{index + 1}</td>
                  <td className="px-4 py-5 text-[15px] font-medium text-gray-900">{rule.type}</td>
                  <td className="px-4 py-5 font-mono text-[15px] text-gray-600">
                    {rule.type} {OPERATOR_SYMBOL[rule.operator]} {rule.value}
                  </td>
                  <td className="px-4 py-5 text-[15px] text-gray-600">{rule.errorMessage}</td>
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-2 text-gray-400">
                      <button
                        type="button"
                        onClick={() => handleEditRule(rule)}
                        className="rounded-md p-0.5 transition hover:bg-gray-100 hover:text-gray-600"
                        aria-label={`Edit rule ${rule.id}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeletingRuleId(rule.id);
                          setActionError(null);
                        }}
                        className="rounded-md p-0.5 transition hover:bg-gray-100 hover:text-gray-600"
                        aria-label={`Delete rule ${rule.id}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loadingRules && rules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                    No rules found for this benefit.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <Button
          variant="outline"
          onClick={handleAddRule}
          disabled={!selectedBenefitId}
          className="mt-8 h-9 rounded-[10px] border-gray-200 px-3 text-sm font-medium text-gray-800 shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
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
