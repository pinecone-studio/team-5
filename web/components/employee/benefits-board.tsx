"use client";

import { useState } from "react";
import {
  BadgeCheck,
  Brain,
  ChevronRight,
  Dumbbell,
  HeartPulse,
  Umbrella,
  Wifi,
} from "lucide-react";

import { cn } from "@/lib/utils";

type BenefitCategory =
  | "all"
  | "wellness"
  | "career"
  | "flexibility"
  | "financial";
type BenefitStatus = "active" | "available" | "pending";

interface BenefitItem {
  title: string;
  description: string;
  category: Exclude<BenefitCategory, "all">;
  status: BenefitStatus;
  criteria: string;
  icon: React.ElementType;
  activeSince?: string;
}

const filters: Array<{ label: string; value: BenefitCategory }> = [
  { label: "All", value: "all" },
  { label: "Wellness", value: "wellness" },
  { label: "Career", value: "career" },
  { label: "Flexibility", value: "flexibility" },
  { label: "Financial", value: "financial" },
];

const benefits: BenefitItem[] = [
  {
    title: "Private Insurance",
    description: "50% санхүүжилттэй хувийн эрүүл мэндийн даатгал",
    category: "wellness",
    status: "active",
    criteria: "3/3 шалгуур биелсэн",
    icon: HeartPulse,
    activeSince: "Active since Feb 5, 2026",
  },
  {
    title: "Digital Wellness",
    description: "Headspace, Calm зэрэг аппликейшны 100% санхүүжилт",
    category: "financial",
    status: "active",
    criteria: "1/1 шалгуур биелсэн",
    icon: Brain,
    activeSince: "Active since Oct 20, 2025",
  },
  {
    title: "Shift Happened Days",
    description: "Гэнэтийн хувийн нөхцөл байдалд зориулсан чөлөө",
    category: "flexibility",
    status: "active",
    criteria: "1/1 шалгуур биелсэн",
    icon: Umbrella,
    activeSince: "Active since Oct 20, 2025",
  },
  {
    title: "Gym - Pinefit",
    description: "Компанийн 50% санхүүжилттэй PineFit фитнес клубын гишүүнчлэл",
    category: "wellness",
    status: "available",
    criteria: "3/3 шалгуур биелсэн",
    icon: Dumbbell,
  },
  {
    title: "Remote Work",
    description: "Гэрээсээ болон хаанаас ч ажиллах уян хатан боломж",
    category: "flexibility",
    status: "available",
    criteria: "3/3 шалгуур биелсэн",
    icon: Wifi,
  },
  {
    title: "Bonus (OKR-based)",
    description: "OKR үр дүнд суурилсан ажлын гүйцэтгэлийн урамшуулал",
    category: "financial",
    status: "available",
    criteria: "1/1 шалгуур биелсэн",
    icon: Umbrella,
  },
  {
    title: "Extra Responsibility",
    description: "Ахлах түвшний ажилтнуудад зориулсан нэмэлт үүрэг хариуцлага",
    category: "career",
    status: "pending",
    criteria: "1 шалгуур биелсэн",
    icon: BadgeCheck,
  },
];

const sections: Array<{
  key: BenefitStatus;
  title: string;
  description: string;
}> = [
  { key: "active", title: "Active", description: "These are yours" },
  {
    key: "available",
    title: "Available",
    description: "You qualify, request anytime",
  },
  { key: "pending", title: "Pending", description: "Waiting for approval" },
];

function getCategoryClasses(category: BenefitItem["category"]) {
  switch (category) {
    case "wellness":
      return "bg-green-100 text-green-800";
    case "career":
      return "bg-violet-100 text-violet-700";
    case "flexibility":
      return "bg-sky-100 text-sky-700";
    case "financial":
      return "bg-amber-100 text-amber-800";
  }
}

function BenefitCard({ benefit }: { benefit: BenefitItem }) {
  const Icon = benefit.icon;

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
            <Icon className="h-4.5 w-4.5" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">
            {benefit.title}
          </h3>
        </div>
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
            getCategoryClasses(benefit.category),
          )}
        >
          {filters.find((filter) => filter.value === benefit.category)?.label}
        </span>
      </div>

      <p className="mt-4 min-h-14 text-[0.96rem] leading-7 text-gray-900">
        {benefit.description}
      </p>

      {benefit.activeSince ? (
        <p className="mt-4 text-sm text-gray-500">{benefit.activeSince}</p>
      ) : (
        <div className="mt-4 h-6" />
      )}

      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="text-sm text-gray-500">{benefit.criteria}</span>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-900 transition hover:text-blue-700"
        >
          Дэлгэрэнгүй
          <ChevronRight className="h-4.5 w-4.5" />
        </button>
      </div>
    </article>
  );
}

export default function BenefitsBoard() {
  const [selectedCategory, setSelectedCategory] =
    useState<BenefitCategory>("all");

  const visibleBenefits = benefits.filter((benefit) =>
    selectedCategory === "all" ? true : benefit.category === selectedCategory,
  );

  return (
    <section className="w-full space-y-10">
      <div className="rounded-2xl border border-gray-200 bg-white p-1.5">
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 xl:grid-cols-5">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setSelectedCategory(filter.value)}
              className={cn(
                "min-h-12 rounded-xl px-4 py-3 text-center text-base font-medium transition",
                selectedCategory === filter.value
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-900 hover:bg-gray-50",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-10">
        {sections.map((section) => {
          const sectionBenefits = visibleBenefits.filter(
            (benefit) => benefit.status === section.key,
          );

          if (sectionBenefits.length === 0) return null;

          return (
            <div key={section.key} className="space-y-4">
              <div className="flex flex-wrap items-baseline gap-2.5">
                <h2 className="text-[1.05rem] font-semibold text-gray-900">
                  {section.title}
                </h2>
                <p className="text-base text-gray-500">
                  {section.description} ({sectionBenefits.length})
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {sectionBenefits.map((benefit) => (
                  <BenefitCard key={benefit.title} benefit={benefit} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
