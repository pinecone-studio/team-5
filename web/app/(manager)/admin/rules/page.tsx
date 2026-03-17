"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Pencil, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

const GET_BENEFITS = gql`
query{
  benefits{
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
`

const GET_RULES = gql`
query{
  eligibilityRules{
    id
    benefitId
    operator
    type
    value
    errorMessage
    priority
  }
}
`

interface BenefitData {
  benefits: BenefitDataItem[]
}

interface BenefitDataItem {
  activeContractId: string
  category: string
  id: string
  isActive: boolean
  name: string
  requiresContract: boolean
  subsidyPercent: number
  vendorName: string

}


interface RuleData {
  eligibilityRules: RuleDataItem[]
}

interface RuleDataItem {
  benefitId: string
  errorMessage: string
  id: string
  operator: string
  priority: number
  type: string
  value: string
}

const conditionFields = ["Employment...", "Attendance", "OKR submitted"];
const conditionOperators = [
  "Equals",
  "Not equals",
  "Greater than",
  "Less than",
];

export default function AdminRulesPage() {
  const [isBenefitOpen, setIsBenefitOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  const [isDeleteSuccessOpen, setIsDeleteSuccessOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleTypeValue, setRuleTypeValue] = useState("Responsibility level");
  const [conditionField, setConditionField] = useState(conditionFields[0]);
  const [conditionOperator, setConditionOperator] = useState(
    conditionOperators[0],
  );
  const [conditionValue, setConditionValue] = useState("2");
  const [failMessageValue, setFailMessageValue] = useState("Level must be 2");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: benefitData } = useQuery<BenefitData>(GET_BENEFITS)
  const [selectedBenefit, setSelectedBenefit] = useState(benefitData?.benefits[0].name);

  const [selectedBenefitId, setSelectedBenefitId] = useState(benefitData?.benefits[0].id || null)

  const { data: rulesData } = useQuery<RuleData>(GET_RULES)

  useEffect(() => {
    console.log(rulesData)
  }, [rulesData])

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsBenefitOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const handleEditRule = (ruleId: string) => {
    setEditingRuleId(ruleId);
    setRuleTypeValue("Responsibility level");
    setConditionField(conditionFields[0]);
    setConditionOperator(conditionOperators[0]);
    setConditionValue("2");
    setFailMessageValue("Level must be 2");
  };

  const handleAddRule = () => {
    setIsAddModalOpen(true);
    setRuleTypeValue("");
    setConditionField(conditionFields[0]);
    setConditionOperator(conditionOperators[0]);
    setConditionValue("");
    setFailMessageValue("");
  };

  const closeEditModal = () => setEditingRuleId(null);
  const closeAddModal = () => setIsAddModalOpen(false);
  const closeDeleteModal = () => setDeletingRuleId(null);
  const closeDeleteSuccessModal = () => setIsDeleteSuccessOpen(false);

  const handleDeleteConfirm = () => {
    setDeletingRuleId(null);
    setIsDeleteSuccessOpen(true);
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
            className="flex h-11 w-full items-center justify-between rounded-[10px] border border-gray-200 bg-white px-4 text-left text-base font-medium text-gray-800 shadow-sm outline-none transition hover:border-gray-300"
            aria-haspopup="listbox"
            aria-expanded={isBenefitOpen}
          >
            <span>{selectedBenefit}</span>
            <ChevronDown
              className={`h-5 w-5 text-gray-800 transition-transform ${isBenefitOpen ? "rotate-180" : ""
                }`}
            />
          </button>

          {isBenefitOpen ? (
            <div className="absolute top-full right-0 left-0 mt-3 overflow-hidden rounded-[12px] border border-gray-200 bg-white shadow-md">
              <ul
                role="listbox"
                aria-label="Benefit options"
                className="max-h-[560px] overflow-y-auto py-2"
              >
                {benefitData?.benefits.map((benefit) => (
                  <li key={benefit.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBenefit(benefit.name);
                        setSelectedBenefitId(benefit.id)
                        setIsBenefitOpen(false);
                      }}
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

        <div className="mt-8 overflow-hidden rounded-[12px] border border-gray-200 bg-white shadow-sm">
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
              {rulesData?.eligibilityRules.map((rule, index) => (rule.benefitId === selectedBenefitId &&
                <tr
                  key={rule.id}
                  className="border-b border-gray-200 last:border-b-0"
                >
                  <td className="px-4 py-5 text-base text-gray-700">
                    {index}
                  </td>
                  <td className="px-4 py-5 text-[15px] font-medium text-gray-900">
                    {rule.type}
                  </td>
                  <td className="px-4 py-5 font-mono text-[15px] text-gray-600">
                    {rule.type}
                    <span>{rule.operator === 'eq' && '='}</span>
                    <span>{rule.operator === 'neq' && '!='}</span>
                    <span>{rule.operator === 'lt' && '<'}</span>
                    <span>{rule.operator === 'lte' && '=<'}</span>
                    <span>{rule.operator === 'ht' && '>'}</span>
                    <span>{rule.operator === 'hte' && '>='}</span>
                    <span>{rule.operator === 'in' && '='}</span>
                    <span>{rule.operator === 'not_in' && '!='}</span>
                    {rule.value}
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
                        aria-label={`Edit rule ${rule.id}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingRuleId(rule.id)}
                        className="rounded-md p-0.5 transition hover:bg-gray-100 hover:text-gray-600"
                        aria-label={`Delete rule ${rule.id}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Button
          variant="outline"
          onClick={handleAddRule}
          className="mt-8 h-9 rounded-[10px] border-gray-200 px-3 text-sm font-medium text-gray-800 shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          Add rule
        </Button>
      </section>

      {editingRuleId !== null ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 p-4">
          <div className="w-full max-w-[560px] rounded-[12px] bg-[#f5f5f5] p-6 shadow-2xl">
            <h2 className="text-xl font-semibold tracking-tight text-gray-900">
              Edit New Rule
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-base font-medium text-slate-500">
                  Rule Type
                </label>
                <Input
                  value={ruleTypeValue}
                  onChange={(event) => setRuleTypeValue(event.target.value)}
                  className="h-11 rounded-[10px] border-[3px] border-gray-400 bg-white px-4 text-base text-gray-800 shadow-none focus-visible:border-gray-400 focus-visible:ring-0"
                />
              </div>

              <div>
                <label className="mb-2 block text-base font-medium text-slate-500">
                  Condition
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="relative">
                    <select
                      value={conditionField}
                      onChange={(event) =>
                        setConditionField(event.target.value)
                      }
                      className="h-11 w-full appearance-none rounded-[10px] border border-gray-300 bg-white px-4 pr-10 text-base text-gray-800 outline-none"
                    >
                      {conditionFields.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>

                  <div className="relative">
                    <select
                      value={conditionOperator}
                      onChange={(event) =>
                        setConditionOperator(event.target.value)
                      }
                      className="h-11 w-full appearance-none rounded-[10px] border border-gray-300 bg-white px-4 pr-10 text-base text-gray-800 outline-none"
                    >
                      {conditionOperators.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>

                  <Input
                    value={conditionValue}
                    onChange={(event) => setConditionValue(event.target.value)}
                    className="h-11 rounded-[10px] border border-gray-300 bg-white px-4 text-base text-gray-800 focus-visible:ring-0"
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
                  className="h-11 rounded-[10px] border border-gray-300 bg-white px-4 text-base text-gray-800 focus-visible:ring-0"
                />
              </div>
            </div>

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
                onClick={closeEditModal}
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
            <h2 className="text-xl font-semibold tracking-tight text-gray-900">
              Add New Rule
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-base font-medium text-slate-500">
                  Rule Type
                </label>
                <Input
                  value={ruleTypeValue}
                  onChange={(event) => setRuleTypeValue(event.target.value)}
                  placeholder="I.e.g. Employment Status"
                  className="h-11 rounded-[10px] border-[3px] border-gray-400 bg-white px-4 text-base text-gray-800 shadow-none focus-visible:border-gray-400 focus-visible:ring-0"
                />
              </div>

              <div>
                <label className="mb-2 block text-base font-medium text-slate-500">
                  Condition
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="relative">
                    <select
                      value={conditionField}
                      onChange={(event) =>
                        setConditionField(event.target.value)
                      }
                      className="h-11 w-full appearance-none rounded-[10px] border border-gray-300 bg-white px-4 pr-10 text-base text-gray-800 outline-none"
                    >
                      {conditionFields.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>

                  <div className="relative">
                    <select
                      value={conditionOperator}
                      onChange={(event) =>
                        setConditionOperator(event.target.value)
                      }
                      className="h-11 w-full appearance-none rounded-[10px] border border-gray-300 bg-white px-4 pr-10 text-base text-gray-800 outline-none"
                    >
                      {conditionOperators.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>

                  <Input
                    value={conditionValue}
                    onChange={(event) => setConditionValue(event.target.value)}
                    placeholder="Value"
                    className="h-11 rounded-[10px] border border-gray-300 bg-white px-4 text-base text-gray-800 focus-visible:ring-0"
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
                  className="h-11 rounded-[10px] border border-gray-300 bg-white px-4 text-base text-gray-800 focus-visible:ring-0"
                />
              </div>
            </div>

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
                onClick={closeAddModal}
                className="h-10 min-w-24 rounded-[10px] bg-blue-600 px-4 text-base font-medium text-white hover:bg-blue-700"
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
    </>
  );
}
