interface RequestItem {
  title: string;
  submittedAt: string;
  approvedBy: string;
  approvedAt: string;
}

const steps = ["Submitted", "HR Review", "Active"] as const;

const requests: RequestItem[] = [
  {
    title: "Private Insurance",
    submittedAt: "Submitted Feb 3, 2026",
    approvedBy: "Sarnai M.",
    approvedAt: "Feb 5, 2026",
  },
  {
    title: "Digital Wellness",
    submittedAt: "Submitted Oct 10, 2025",
    approvedBy: "System",
    approvedAt: "Oct 5, 2025",
  },
];

function StatusCheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12.5354 5.45829C12.8094 6.80307 12.6142 8.20114 11.9821 9.41936C11.3501 10.6376 10.3196 11.6023 9.06234 12.1527C7.80512 12.703 6.39721 12.8058 5.07342 12.4437C3.74962 12.0817 2.58996 11.2767 1.78781 10.1631C0.985661 9.04955 0.589518 7.69463 0.665443 6.32432C0.741368 4.95401 1.28477 3.65115 2.20503 2.633C3.1253 1.61484 4.36679 0.942953 5.72248 0.729366C7.07817 0.51578 8.46611 0.77341 9.65484 1.45929M4.85484 6.05829L6.65484 7.85829L12.6548 1.85829"
        stroke="#16A34A"
        strokeWidth="1.3125"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RequestProgressCard({ request }: { request: RequestItem }) {
  return (
    <article className="w-full rounded-2xl border border-gray-200 bg-white p-4">
      <h3 className="text-[1.05rem] font-semibold text-gray-900">
        {request.title}
      </h3>
      <p className="mt-2 text-sm text-gray-500">{request.submittedAt}</p>

      <div className="mt-8">
        <div className="grid grid-cols-3 gap-4">
          {steps.map((step, index) => (
            <div key={step} className="relative text-center">
              {index < steps.length - 1 ? (
                <div className="absolute top-4 left-1/2 h-[2px] w-full bg-green-200" />
              ) : null}
              <div className="relative mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 ring-2 ring-green-200">
                <StatusCheckIcon />
              </div>
              <p className="mt-3 text-sm text-gray-500">{step}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-7 text-right text-sm text-gray-500">
        Approved by {request.approvedBy} on {request.approvedAt}
      </p>
    </article>
  );
}

export default function RequestsBoard() {
  return (
    <section className="w-full">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">My Requests</h2>
        <p className="mt-2 text-base text-gray-500">
          {requests.length} requests
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {requests.map((request) => (
          <RequestProgressCard key={request.title} request={request} />
        ))}
      </div>
    </section>
  );
}
