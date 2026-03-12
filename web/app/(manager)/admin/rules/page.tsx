/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { gql } from "@apollo/client";
import { useMutation, useQuery } from "@apollo/client/react";

const BENEFITS_QUERY = gql`
  query BenefitsForRules {
    benefits {
      id
      name
    }
  }
`;

const LATEST_RULE_VERSION_QUERY = gql`
  query LatestEligibilityRuleVersion($benefitId: ID!) {
    eligibilityRuleLatestVersion(benefitId: $benefitId)
  }
`;

const ELIGIBILITY_RULES_QUERY = gql`
  query EligibilityRulesForBenefit($benefitId: ID!, $configVersion: Int) {
    eligibilityRules(
      benefitId: $benefitId
      configVersion: $configVersion
      activeOnly: false
    ) {
      id
      type
      operator
      value
      valueJson
      configVersion
      errorMessage
      priority
      isActive
    }
  }
`;

const CREATE_RULE_MUTATION = gql`
  mutation CreateEligibilityRule($input: CreateEligibilityRuleInput!) {
    createEligibilityRule(input: $input) {
      id
      benefitId
      type
      operator
      value
      valueJson
      configVersion
      errorMessage
      priority
      isActive
    }
  }
`;

type RuleOperator = "eq" | "neq" | "lt" | "lte" | "gt" | "gte";

interface Benefit {
  id: string;
  name: string;
}

interface EligibilityRule {
  id: string;
  type: string;
  operator: RuleOperator;
  value: string;
  valueJson: string;
  configVersion: number;
  errorMessage: string;
  priority: number;
  isActive: boolean;
}

interface BenefitsQueryData {
  benefits: Benefit[];
}

interface LatestVersionQueryData {
  eligibilityRuleLatestVersion: number;
}

interface LatestVersionQueryVariables {
  benefitId: string;
}

interface EligibilityRulesQueryData {
  eligibilityRules: EligibilityRule[];
}

interface EligibilityRulesQueryVariables {
  benefitId: string;
  configVersion?: number;
}

interface CreateRuleMutationData {
  createEligibilityRule: EligibilityRule;
}

interface CreateRuleMutationVariables {
  input: {
    benefitId: string;
    value: string;
    type?: string;
    operator?: RuleOperator;
    configVersion?: number;
    errorMessage: string;
    priority?: number;
    isActive?: boolean;
  };
}

const operatorOptions: Array<{ label: string; value: RuleOperator }> = [
  { label: "Equals", value: "eq" },
  { label: "Not equals", value: "neq" },
  { label: "Less than", value: "lt" },
  { label: "Less than or equal", value: "lte" },
  { label: "Greater than", value: "gt" },
  { label: "Greater than or equal", value: "gte" },
];

const operatorSymbol: Record<RuleOperator, string> = {
  eq: "=",
  neq: "!=",
  lt: "<",
  lte: "<=",
  gt: ">",
  gte: ">=",
};

export default function AdminRulesPage() {
  const [selectedBenefitId, setSelectedBenefitId] = useState<string>("");
  const [ruleType, setRuleType] = useState("employment_status");
  const [operator, setOperator] = useState<RuleOperator>("eq");
  const [ruleValue, setRuleValue] = useState("active");
  const [errorMessage, setErrorMessage] = useState("");
  const [priority, setPriority] = useState("");
  const [configVersionInput, setConfigVersionInput] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const { data: benefitsData, loading: benefitsLoading } =
    useQuery<BenefitsQueryData>(BENEFITS_QUERY);

  useEffect(() => {
    if (!selectedBenefitId && benefitsData?.benefits?.length) {
      setSelectedBenefitId(benefitsData.benefits[0].id);
    }
  }, [benefitsData, selectedBenefitId]);

  const selectedBenefit = useMemo(
    () =>
      benefitsData?.benefits.find(
        (benefit) => benefit.id === selectedBenefitId,
      ),
    [benefitsData, selectedBenefitId],
  );

  const {
    data: latestVersionData,
    loading: latestVersionLoading,
    refetch: refetchLatestVersion,
  } = useQuery<LatestVersionQueryData, LatestVersionQueryVariables>(
    LATEST_RULE_VERSION_QUERY,
    {
      variables: { benefitId: selectedBenefitId },
      skip: !selectedBenefitId,
    },
  );

  const latestVersion = latestVersionData?.eligibilityRuleLatestVersion ?? 1;
  const selectedVersion = configVersionInput
    ? Number.parseInt(configVersionInput, 10)
    : latestVersion;

  const {
    data: rulesData,
    loading: rulesLoading,
    refetch: refetchRules,
  } = useQuery<EligibilityRulesQueryData, EligibilityRulesQueryVariables>(
    ELIGIBILITY_RULES_QUERY,
    {
      variables: {
        benefitId: selectedBenefitId,
        configVersion: Number.isFinite(selectedVersion)
          ? selectedVersion
          : latestVersion,
      },
      skip: !selectedBenefitId,
    },
  );

  const [createRule, { loading: createLoading }] = useMutation<
    CreateRuleMutationData,
    CreateRuleMutationVariables
  >(CREATE_RULE_MUTATION);

  async function handleCreateRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!selectedBenefitId) {
      setSubmitError("Select a benefit first.");
      return;
    }

    const normalizedType = ruleType.trim();
    if (!normalizedType) {
      setSubmitError("Rule type is required.");
      return;
    }

    const trimmedValue = ruleValue.trim();
    if (!trimmedValue) {
      setSubmitError("Condition value is required.");
      return;
    }

    const trimmedErrorMessage = errorMessage.trim();
    if (!trimmedErrorMessage) {
      setSubmitError("Fail message is required.");
      return;
    }

    const parsedPriority =
      priority.trim().length > 0 ? Number.parseInt(priority, 10) : undefined;
    if (parsedPriority !== undefined && !Number.isFinite(parsedPriority)) {
      setSubmitError("Priority must be a number.");
      return;
    }

    const parsedVersion = configVersionInput.trim().length
      ? Number.parseInt(configVersionInput, 10)
      : latestVersion;

    if (!Number.isFinite(parsedVersion) || parsedVersion < 1) {
      setSubmitError("Config version must be a positive number.");
      return;
    }

    await createRule({
      variables: {
        input: {
          benefitId: selectedBenefitId,
          type: normalizedType,
          operator,
          value: trimmedValue,
          configVersion: parsedVersion,
          errorMessage: trimmedErrorMessage,
          priority: parsedPriority,
          isActive: true,
        },
      },
    })
      .then(async () => {
        await Promise.all([refetchLatestVersion(), refetchRules()]);
        setSubmitSuccess("Rule added successfully.");
        setRuleValue("");
        setErrorMessage("");
        setPriority("");
      })
      .catch((error: { message?: string }) => {
        setSubmitError(error.message ?? "Could not create rule.");
      });
  }

  return (
    <section className="w-full py-2">
      <div className="grid gap-6 lg:grid-cols-[1.05fr_1.35fr]">
        <form
          onSubmit={handleCreateRule}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <h1 className="text-lg font-semibold text-gray-900">
            Eligibility rule configuration
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Add rules without deleting existing ones. Rules are versioned per
            benefit.
          </p>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">
                Benefit
              </span>
              <select
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-gray-500"
                value={selectedBenefitId}
                onChange={(event) => setSelectedBenefitId(event.target.value)}
                disabled={benefitsLoading || !benefitsData?.benefits?.length}
              >
                {!benefitsData?.benefits?.length ? (
                  <option value="">No benefits found</option>
                ) : null}
                {benefitsData?.benefits?.map((benefit) => (
                  <option key={benefit.id} value={benefit.id}>
                    {benefit.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Rule type
                </span>
                <input
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-gray-500"
                  value={ruleType}
                  onChange={(event) => setRuleType(event.target.value)}
                  placeholder="employment_status"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Operator
                </span>
                <select
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-gray-500"
                  value={operator}
                  onChange={(event) =>
                    setOperator(event.target.value as RuleOperator)
                  }
                >
                  {operatorOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">
                Expected value
              </span>
              <input
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-gray-500"
                value={ruleValue}
                onChange={(event) => setRuleValue(event.target.value)}
                placeholder='active, true, 3, or JSON like {"min":2}'
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">
                Fail message
              </span>
              <input
                className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-gray-500"
                value={errorMessage}
                onChange={(event) => setErrorMessage(event.target.value)}
                placeholder="Explain why a user is not eligible."
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Priority (optional)
                </span>
                <input
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-gray-500"
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                  placeholder="Auto if empty"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">
                  Config version
                </span>
                <input
                  className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-gray-500"
                  value={configVersionInput}
                  onChange={(event) =>
                    setConfigVersionInput(event.target.value)
                  }
                  placeholder={`Latest: ${latestVersion}`}
                />
              </label>
            </div>

            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-gray-900 px-4 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={createLoading || !selectedBenefitId}
            >
              {createLoading ? "Adding..." : "Add rule"}
            </button>

            {submitError ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {submitError}
              </p>
            ) : null}
            {submitSuccess ? (
              <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                {submitSuccess}
              </p>
            ) : null}
          </div>
        </form>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Active version snapshot
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {selectedBenefit?.name ?? "Select a benefit"} · version{" "}
                {latestVersionLoading ? "..." : latestVersion}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                void refetchLatestVersion();
                void refetchRules();
              }}
              className="h-9 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 transition hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>

          {rulesLoading ? (
            <p className="mt-6 text-sm text-gray-500">Loading rules...</p>
          ) : !rulesData?.eligibilityRules?.length ? (
            <p className="mt-6 rounded-lg border border-dashed border-gray-300 px-4 py-5 text-sm text-gray-600">
              No rules for this benefit/version yet.
            </p>
          ) : (
            <div className="mt-5 overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs tracking-wide text-gray-700 uppercase">
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Rule Type</th>
                    <th className="px-3 py-2">Condition</th>
                    <th className="px-3 py-2">Fail Message</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rulesData.eligibilityRules.map((rule) => (
                    <tr key={rule.id} className="border-t border-gray-200">
                      <td className="px-3 py-2 text-gray-700">
                        {rule.priority}
                      </td>
                      <td className="px-3 py-2 font-medium text-gray-900">
                        {rule.type}
                      </td>
                      <td className="px-3 py-2 font-mono text-gray-700">
                        {rule.type} {operatorSymbol[rule.operator]}{" "}
                        {rule.valueJson}
                      </td>
                      <td className="px-3 py-2 text-gray-700">
                        {rule.errorMessage}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            rule.isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {rule.isActive ? "Active" : "Disabled"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
