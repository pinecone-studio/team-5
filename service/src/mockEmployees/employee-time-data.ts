export type EmployeeTimeData = {
    employeeId: number;
    shitHappenedDays: string[]; // ISO dates (YYYY-MM-DD)
    remoteWorkDays: string[]; // ISO dates (YYYY-MM-DD)
};

export const employeeTimeData: EmployeeTimeData[] = [
    {
        employeeId: 1,
        shitHappenedDays: ["2024-05-07", "2024-04-02"],
        remoteWorkDays: ["2025-02-02", "2025-02-03"],
    },
    {
        employeeId: 2,
        shitHappenedDays: ["2024-01-11", "2024-09-23"],
        remoteWorkDays: ["2025-01-06", "2025-01-07", "2025-01-08"],
    },
    {
        employeeId: 3,
        shitHappenedDays: ["2024-02-14"],
        remoteWorkDays: ["2024-12-02", "2024-12-03"],
    },
    {
        employeeId: 4,
        shitHappenedDays: ["2025-03-10", "2025-03-18"],
        remoteWorkDays: ["2024-06-17"],
    },
    {
        employeeId: 5,
        shitHappenedDays: ["2024-07-01"],
        remoteWorkDays: ["2024-07-08", "2024-07-09"],
    },
    {
        employeeId: 6,
        shitHappenedDays: ["2024-11-19", "2025-02-21"],
        remoteWorkDays: ["2024-03-04", "2024-03-05"],
    },
    {
        employeeId: 7,
        shitHappenedDays: ["2024-08-12"],
        remoteWorkDays: ["2025-02-10", "2025-02-11", "2025-02-12"],
    },
    {
        employeeId: 8,
        shitHappenedDays: ["2024-10-30", "2025-01-15"],
        remoteWorkDays: ["2024-10-03"],
    },
    {
        employeeId: 9,
        shitHappenedDays: ["2024-03-22"],
        remoteWorkDays: ["2024-03-25", "2024-03-26"],
    },
    {
        employeeId: 10,
        shitHappenedDays: ["2024-12-31"],
        remoteWorkDays: ["2025-01-02", "2025-01-03"],
    },
    {
        employeeId: 11,
        shitHappenedDays: ["2024-04-18", "2024-04-19"],
        remoteWorkDays: ["2025-03-04"],
    },
    {
        employeeId: 12,
        shitHappenedDays: ["2024-06-01"],
        remoteWorkDays: ["2024-06-03", "2024-06-04", "2024-06-05"],
    },
    {
        employeeId: 13,
        shitHappenedDays: ["2024-09-05"],
        remoteWorkDays: ["2024-09-12", "2024-09-13"],
    },
    {
        employeeId: 14,
        shitHappenedDays: ["2025-02-04", "2025-02-05"],
        remoteWorkDays: ["2024-02-01"],
    },
    {
        employeeId: 15,
        shitHappenedDays: ["2024-01-29"],
        remoteWorkDays: ["2024-01-30", "2024-01-31"],
    },
    {
        employeeId: 16,
        shitHappenedDays: ["2024-05-20"],
        remoteWorkDays: ["2024-05-21", "2024-05-22"],
    },
    {
        employeeId: 17,
        shitHappenedDays: ["2024-11-04"],
        remoteWorkDays: ["2025-03-01", "2025-03-02"],
    },
    {
        employeeId: 18,
        shitHappenedDays: ["2024-02-28", "2024-02-29"],
        remoteWorkDays: ["2024-07-15"],
    },
    {
        employeeId: 19,
        shitHappenedDays: ["2024-10-10"],
        remoteWorkDays: ["2024-10-11", "2024-10-14"],
    },
    {
        employeeId: 20,
        shitHappenedDays: ["2025-01-27"],
        remoteWorkDays: ["2024-12-09", "2024-12-10"],
    },
];

