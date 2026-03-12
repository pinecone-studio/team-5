"use client";

import { useEffect, useRef, useState } from "react";
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";
import { Check, ChevronDown, Pencil, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const GET_BENEFITS = gql`
  query BenefitsForAdminRules {
    benefits {
      id
      name
    }
  }
`;

const GET_LATEST_RULE_VERSION = gql`
  query LatestRuleVersionForAdminRules($benefitId: ID!) {
    eligibilityRuleLatestVersion(benefitId: $benefitId)
  }
`;

const GET_RULES = gql`
  query RulesForAdminRules($benefitId: ID!, $configVersion: Int) {
    eligibilityRules(
      benefitId: $benefitId
      configVersion: $configVersion
      activeOnly: false
    ) {
      id
      type
      operator
      value
      errorMessage
      priority
      isActive
    }
  }
`;

const CREATE_RULE = gql`
  mutation CreateRuleForAdminRules($input: CreateEligibilityRuleInput!) {
    createEligibilityRule(input: $input) {
      id
    }
  }
`;

const UPDATE_RULE = gql`
  mutation UpdateRuleForAdminRules($input: UpdateEligibilityRuleInput!) {
    updateEligibilityRule(input: $input) {
      id
    }
  }
`;

const DELETE_RULE = gql`
  mutation DeleteRuleForAdminRules($id: ID!) {
    deleteEligibilityRule(id: $id)
  }
`;

type RuleOperator = "eq" | "neq" | "lt" | "lte" | "gt" | "gte";

type Benefit = {
  id: string;
  name: string;
};

type BenefitOption = {
  id: string;
  name: string;
  isMock: boolean;
};

type EligibilityRule = {
  id: string;
  type: string;
  operator: RuleOperator;
  value: string;
  errorMessage: string;
  priority: number;
  isActive: boolean;
};

type BenefitsQueryData = {
  benefits: Benefit[];
};

type LatestRuleVersionData = {
  eligibilityRuleLatestVersion: number;
};

type LatestRuleVersionVariables = {
  benefitId: string;
};

type RulesQueryData = {
  eligibilityRules: EligibilityRule[];
};

type RulesQueryVariables = {
  benefitId: string;
  configVersion?: number;
};

type CreateRuleVariables = {
  input: {
    benefitId: string;
    type: string;
    operator: RuleOperator;
    value: string;
    errorMessage: string;
    configVersion?: number;
  };
};

type UpdateRuleVariables = {
  input: {
    id: string;
    type?: string;
    operator?: RuleOperator;
    value?: string;
    errorMessage?: string;
  };
};

type DeleteRuleVariables = {
  id: string;
};

const mockBenefitNames = [
  "Private Insurance",
  "Digital Welness",
  "Shit Happened Days",
  "Gym - Pinefit",
  "Remote Work",
  "Bonus (OKR-based)",
  "Extra Responsibility",
  "Advance Payment",
  "Macbook",
  "Travel",
];

const conditionFields = [
  { label: "Employment Status", value: "employment_status" },
  { label: "Attendance", value: "attendance" },
  { label: "OKR submitted", value: "okr_submitted" },
  { label: "Responsibility level", value: "responsibility_level" },
];

const conditionOperators = [
  { label: "Equals", value: "eq" as RuleOperator },
  { label: "Not equals", value: "neq" as RuleOperator },
  { label: "Greater than", value: "gt" as RuleOperator },
  { label: "Less than", value: "lt" as RuleOperator },
];

function getFieldLabel(type: string) {
  const matched = conditionFields.find((field) => field.value === type);
  return matched?.label ?? type;
}

function getOperatorLabel(operator: RuleOperator) {
  const matched = conditionOperators.find((item) => item.value === operator);
  return matched?.label ?? operator;
}

function getOperatorSymbol(operator: RuleOperator) {
  switch (operator) {
    case "eq":
      return "=";
    case "neq":
      return "!=";
    case "gt":
      return ">";
    case "gte":
      return ">=";
    case "lt":
      return "<";
    case "lte":
      return "<=";
  }
}

export default function AdminRulesPage() {
  const [selectedBenefitId, setSelectedBenefitId] = useState("");
  const [isBenefitOpen, setIsBenefitOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  const [isDeleteSuccessOpen, setIsDeleteSuccessOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleTypeValue, setRuleTypeValue] = useState(conditionFields[0].value);
  const [conditionField, setConditionField] = useState(conditionFields[0].value);
  const [conditionOperator, setConditionOperator] = useState<RuleOperator>(
    conditionOperators[0].value,
  );
  const [conditionValue, setConditionValue] = useState("2");
  const [failMessageValue, setFailMessageValue] = useState("");
  const [mutationError, setMutationError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: benefitsData } = useQuery<BenefitsQueryData>(GET_BENEFITS);

  const benefitOptions: BenefitOption[] = [
    ...(benefitsData?.benefits.map((benefit) => ({
      id: benefit.id,
      name: benefit.name,
      isMock: false,
    })) ?? []),
  ];

  for (const mockName of mockBenefitNames) {
    const alreadyIncluded = benefitOptions.some(
      (benefit) => benefit.name.toLowerCase() === mockName.toLowerCase(),
    );

    if (!alreadyIncluded) {
      benefitOptions.push({
        id: `mock:${mockName}`,
        name: mockName,
        isMock: true,
      });
    }
  }

  const selectedBenefit =
    benefitOptions.find((benefit) => benefit.id === selectedBenefitId) ?? null;
  const selectedBenefitIsMock = selectedBenefit?.isMock ?? false;

  useEffect(() => {
    if (!selectedBenefitId && benefitOptions.length > 0) {
      const firstRealBenefit =
        benefitOptions.find((benefit) => !benefit.isMock) ?? benefitOptions[0];
      setSelectedBenefitId(firstRealBenefit.id);
    }
  }, [benefitOptions, selectedBenefitId]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsBenefitOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const { data: latestVersionData, refetch: refetchLatestVersion } = useQuery<
    LatestRuleVersionData,
    LatestRuleVersionVariables
  >(GET_LATEST_RULE_VERSION, {
    variables: { benefitId: selectedBenefitId },
    skip: !selectedBenefitId || selectedBenefitIsMock,
  });

  const latestVersion = latestVersionData?.eligibilityRuleLatestVersion;

  const {
    data: rulesData,
    loading: rulesLoading,
    refetch: refetchRules,
  } = useQuery<RulesQueryData, RulesQueryVariables>(GET_RULES, {
    variables: {
      benefitId: selectedBenefitId,
      configVersion: latestVersion,
    },
    skip: !selectedBenefitId || latestVersion == null || selectedBenefitIsMock,
  });

  const [createRule, { loading: isCreating }] = useMutation<
    { createEligibilityRule: { id: string } },
    CreateRuleVariables
  >(CREATE_RULE);

  const [updateRule, { loading: isUpdating }] = useMutation<
    { updateEligibilityRule: { id: string } },
    UpdateRuleVariables
  >(UPDATE_RULE);

  const [deleteRule, { loading: isDeleting }] = useMutation<
    { deleteEligibilityRule: boolean },
    DeleteRuleVariables
  >(DELETE_RULE);

  const rules = rulesData?.eligibilityRules ?? [];

  const resetForm = () => {
    setRuleTypeValue(conditionFields[0].value);
    setConditionField(conditionFields[0].value);
    setConditionOperator(conditionOperators[0].value);
    setConditionValue("");
    setFailMessageValue("");
    setMutationError(null);
  };

  const handleEditRule = (ruleId: string) => {
    const rule = rules.find((item) => item.id === ruleId);
    if (!rule) return;

    setEditingRuleId(ruleId);
    setRuleTypeValue(rule.type);
    setConditionField(rule.type);
    setConditionOperator(rule.operator);
    setConditionValue(rule.value);
    setFailMessageValue(rule.errorMessage);
    setMutationError(null);
  };

  const handleAddRule = () => {
    setIsAddModalOpen(true);
    resetForm();
  };

  const closeEditModal = () => {
    setEditingRuleId(null);
    setMutationError(null);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setMutationError(null);
  };

  const closeDeleteModal = () => {
    setDeletingRuleId(null);
    setMutationError(null);
  };

  const closeDeleteSuccessModal = () => setIsDeleteSuccessOpen(false);

  const refreshRules = async () => {
    await refetchLatestVersion();
    await refetchRules();
  };

  const submitCreateRule = async () => {
    if (!selectedBenefitId) {
      setMutationError("Benefit songono uu.");
      return;
    }

    if (selectedBenefitIsMock) {
      setMutationError("Mock benefit deer rule uusgehgui. Real benefit songono uu.");
      return;
    }

    if (!ruleTypeValue.trim() || !conditionValue.trim() || !failMessageValue.trim()) {
      setMutationError("Buh talbaruudiig buglunu uu.");
      return;
    }

    try {
      await createRule({
        variables: {
          input: {
            benefitId: selectedBenefitId,
            type: ruleTypeValue.trim(),
            operator: conditionOperator,
            value: conditionValue.trim(),
            errorMessage: failMessageValue.trim(),
            ...(latestVersion != null ? { configVersion: latestVersion } : {}),
          },
        },
      });
      await refreshRules();
      closeAddModal();
    } catch (error) {
      setMutationError(
        error instanceof Error ? error.message : "Rule uusgehed aldaa garlaa.",
      );
    }
  };

  const submitEditRule = async () => {
    if (!editingRuleId) return;

    if (selectedBenefitIsMock) {
      setMutationError(
        "Mock benefit deer rule shinechlehgui. Real benefit songono uu.",
      );
      return;
    }

    if (!ruleTypeValue.trim() || !conditionValue.trim() || !failMessageValue.trim()) {
      setMutationError("Buh talbaruudiig buglunu uu.");
      return;
    }

    try {
      await updateRule({
        variables: {
          input: {
            id: editingRuleId,
            type: ruleTypeValue.trim(),
            operator: conditionOperator,
            value: conditionValue.trim(),
            errorMessage: failMessageValue.trim(),
          },
        },
      });
      await refreshRules();
      closeEditModal();
    } catch (error) {
      setMutationError(
        error instanceof Error
          ? error.message
          : "Rule shinechlehed aldaa garlaa.",
      );
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingRuleId) return;

    if (selectedBenefitIsMock) {
      setMutationError("Mock benefit deer rule ustgahgui. Real benefit songono uu.");
      return;
    }

    try {
      await deleteRule({ variables: { id: deletingRuleId } });
      await refreshRules();
      setDeletingRuleId(null);
      setIsDeleteSuccessOpen(true);
    } catch (error) {
      setMutationError(
        error instanceof Error ? error.message : "Rule ustgahad aldaa garlaa.",
      );
    }
  };

  return (
    <>
      <section className="mx-auto w-full max-w-6xl px-2 py-2 sm:px-4 lg:px-6">
        <div ref={dropdownRef} className="relative z-20 max-w-[535px]">
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
            <span>{selectedBenefit?.name ?? "Select benefit"}</span>
            <ChevronDown
              className={`h-5 w-5 text-gray-800 transition-transform ${
                isBenefitOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isBenefitOpen ? (
            <div className="absolute top-full right-0 left-0 mt-3 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md">
              <ul
                role="listbox"
                aria-label="Benefit options"
                className="max-h-[560px] overflow-y-auto py-2"
              >
                {benefitOptions.map((benefit) => (
                  <li key={benefit.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBenefitId(benefit.id);
                        setIsBenefitOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left text-base text-gray-800 transition hover:bg-gray-50"
                    >
                      <span>{benefit.name}</span>
                      {benefit.isMock ? (
                        <span className="ml-2 text-xs text-gray-400">mock</span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full border-collapse">
            <thead className="bg-white">
              <tr className="border-b border-gray-200 text-left">
                <th className="w-16 px-4 py-4 text-xs font-semibold tracking-wide text-gray-900 uppercase">
                  #
                </th>
                <th className="px-4 py-4 text-xs font-semibold tracking-wide text-gray-900 uppercase">
                  Rule Type
                </th>
                <th className="px-4 py-4 text-xs font-semibold tracking-wide text-gray-900 uppercase">
                  Condition
                </th>
                <th className="px-4 py-4 text-xs font-semibold tracking-wide text-gray-900 uppercase">
                  Fail Message
                </th>
                <th className="w-32 px-4 py-4 text-xs font-semibold tracking-wide text-gray-900 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {selectedBenefitIsMock ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    This is a mock benefit option. Select a real backend benefit
                    to manage rules.
                  </td>
                </tr>
              ) : rulesLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    Loading rules...
                  </td>
                </tr>
              ) : rules.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    No rules found for this benefit.
                  </td>
                </tr>
              ) : (
                rules.map((rule, index) => (
                  <tr
                    key={rule.id}
                    className="border-b border-gray-200 last:border-b-0"
                  >
                    <td className="px-4 py-5 text-base text-gray-700">
                      {index + 1}
                    </td>
                    <td className="px-4 py-5 text-[15px] font-medium text-gray-900">
                      {getFieldLabel(rule.type)}
                    </td>
                    <td className="px-4 py-5 font-mono text-[15px] text-gray-600">
                      {rule.type} {getOperatorSymbol(rule.operator)} {rule.value}
                    </td>
                    <td className="px-4 py-5 text-[15px] text-gray-600">
                      {rule.errorMessage}
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-2 text-gray-400">
                        <button
                          type="button"
                          onClick={() => handleEditRule(rule.id)}
                          className="rounded-md p-0.5 transition hover:bg-gray-100 hover:text-gray-600"
                          aria-label={`Edit rule ${index + 1}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeletingRuleId(rule.id);
                            setMutationError(null);
                          }}
                          className="rounded-md p-0.5 transition hover:bg-gray-100 hover:text-gray-600"
                          aria-label={`Delete rule ${index + 1}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Button
          variant="outline"
          onClick={handleAddRule}
          disabled={selectedBenefitIsMock || !selectedBenefitId}
          className="mt-8 h-9 rounded-lg border-gray-200 px-3 text-sm font-medium text-gray-800 shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          Add rule
        </Button>
      </section>

      {editingRuleId !== null ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 p-4">
          <div className="w-full max-w-[560px] rounded-3xl bg-[#f5f5f5] p-6 shadow-2xl">
            <h2 className="text-xl font-semibold tracking-tight text-gray-900">
              Edit New Rule
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-base font-medium text-slate-500">
                  Rule Type
                </label>
                <Input
                  value={getFieldLabel(ruleTypeValue)}
                  onChange={(event) => setRuleTypeValue(event.target.value)}
                  className="hidden"
                />
                <select
                  value={conditionField}
                  onChange={(event) => {
                    setConditionField(event.target.value);
                    setRuleTypeValue(event.target.value);
                  }}
                  className="h-11 w-full appearance-none rounded-xl border-[3px] border-gray-400 bg-white px-4 text-base text-gray-800 outline-none"
                >
                  {conditionFields.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-base font-medium text-slate-500">
                  Condition
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="relative">
                    <select
                      value={conditionField}
                      onChange={(event) => {
                        setConditionField(event.target.value);
                        setRuleTypeValue(event.target.value);
                      }}
                      className="h-11 w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 pr-10 text-base text-gray-800 outline-none"
                    >
                      {conditionFields.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>

                  <div className="relative">
                    <select
                      value={conditionOperator}
                      onChange={(event) =>
                        setConditionOperator(event.target.value as RuleOperator)
                      }
                      className="h-11 w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 pr-10 text-base text-gray-800 outline-none"
                    >
                      {conditionOperators.map((option) => (
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
                    className="h-11 rounded-xl border border-gray-300 bg-white px-4 text-base text-gray-800 focus-visible:ring-0"
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
                  className="h-11 rounded-xl border border-gray-300 bg-white px-4 text-base text-gray-800 focus-visible:ring-0"
                />
              </div>

              {mutationError ? (
                <p className="text-sm text-red-600">{mutationError}</p>
              ) : null}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={closeEditModal}
                className="h-10 min-w-24 rounded-xl border border-gray-300 bg-white px-4 text-base font-medium text-gray-800 shadow-none hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void submitEditRule()}
                disabled={isUpdating}
                className="h-10 min-w-24 rounded-xl bg-blue-600 px-4 text-base font-medium text-white hover:bg-blue-700"
              >
                {isUpdating ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isAddModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 p-4">
          <div className="w-full max-w-[560px] rounded-3xl bg-[#f5f5f5] p-6 shadow-2xl">
            <h2 className="text-xl font-semibold tracking-tight text-gray-900">
              Add New Rule
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-base font-medium text-slate-500">
                  Rule Type
                </label>
                <Input
                  value={getFieldLabel(ruleTypeValue)}
                  onChange={(event) => setRuleTypeValue(event.target.value)}
                  placeholder="I.e.g. Employment Status"
                  className="hidden"
                />
                <select
                  value={conditionField}
                  onChange={(event) => {
                    setConditionField(event.target.value);
                    setRuleTypeValue(event.target.value);
                  }}
                  className="h-11 w-full appearance-none rounded-xl border-[3px] border-gray-400 bg-white px-4 text-base text-gray-800 outline-none"
                >
                  {conditionFields.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-base font-medium text-slate-500">
                  Condition
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="relative">
                    <select
                      value={conditionField}
                      onChange={(event) => {
                        setConditionField(event.target.value);
                        setRuleTypeValue(event.target.value);
                      }}
                      className="h-11 w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 pr-10 text-base text-gray-800 outline-none"
                    >
                      {conditionFields.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>

                  <div className="relative">
                    <select
                      value={conditionOperator}
                      onChange={(event) =>
                        setConditionOperator(event.target.value as RuleOperator)
                      }
                      className="h-11 w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 pr-10 text-base text-gray-800 outline-none"
                    >
                      {conditionOperators.map((option) => (
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
                    className="h-11 rounded-xl border border-gray-300 bg-white px-4 text-base text-gray-800 focus-visible:ring-0"
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
                  className="h-11 rounded-xl border border-gray-300 bg-white px-4 text-base text-gray-800 focus-visible:ring-0"
                />
              </div>

              {mutationError ? (
                <p className="text-sm text-red-600">{mutationError}</p>
              ) : null}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={closeAddModal}
                className="h-10 min-w-24 rounded-xl border border-gray-300 bg-white px-4 text-base font-medium text-gray-800 shadow-none hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void submitCreateRule()}
                disabled={isCreating}
                className="h-10 min-w-24 rounded-xl bg-blue-600 px-4 text-base font-medium text-white hover:bg-blue-700"
              >
                {isCreating ? "Adding..." : "Add"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {deletingRuleId !== null ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
          <div className="w-full max-w-[360px] rounded-[24px] bg-[#f5f5f5] px-6 py-6 shadow-2xl">
            <h2 className="text-center text-xl font-medium leading-tight text-gray-900">
              Do you want to delete this rule?
            </h2>

            {mutationError ? (
              <p className="mt-4 text-center text-sm text-red-600">
                {mutationError}
              </p>
            ) : null}

            <div className="mt-7 flex justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={closeDeleteModal}
                className="h-9 min-w-20 rounded-xl border border-gray-300 bg-white px-5 text-base font-medium text-gray-800 shadow-none hover:bg-gray-50"
              >
                No
              </Button>
              <Button
                type="button"
                onClick={() => void handleDeleteConfirm()}
                disabled={isDeleting}
                className="h-9 min-w-20 rounded-xl bg-blue-600 px-5 text-base font-medium text-white hover:bg-blue-700"
              >
                {isDeleting ? "..." : "Yes"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isDeleteSuccessOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
          <div
            className="w-full max-w-[360px] rounded-[24px] bg-[#f5f5f5] px-6 py-7 text-center shadow-2xl"
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
    </>
  );
}
