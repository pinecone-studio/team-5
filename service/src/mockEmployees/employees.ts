export type EmployeeStatus = "active" | "inactive" | "on_leave";

export type MockEmployee = {
    id: number;
    firstname: string;
    lastname: string;
    image: string;
    contractDate: string; // ISO date (YYYY-MM-DD)
    status: EmployeeStatus;
};

export const employees: MockEmployee[] = [
    {
        id: 1,
        firstname: "Ava",
        lastname: "Johnson",
        image: "https://i.pravatar.cc/150?img=1",
        contractDate: "2023-01-15",
        status: "active",
    },
    {
        id: 2,
        firstname: "Liam",
        lastname: "Martinez",
        image: "https://i.pravatar.cc/150?img=2",
        contractDate: "2022-09-01",
        status: "active",
    },
    {
        id: 3,
        firstname: "Noah",
        lastname: "Kim",
        image: "https://i.pravatar.cc/150?img=3",
        contractDate: "2021-06-20",
        status: "on_leave",
    },
    {
        id: 4,
        firstname: "Emma",
        lastname: "Singh",
        image: "https://i.pravatar.cc/150?img=4",
        contractDate: "2024-03-11",
        status: "active",
    },
    {
        id: 5,
        firstname: "Olivia",
        lastname: "Brown",
        image: "https://i.pravatar.cc/150?img=5",
        contractDate: "2020-11-05",
        status: "inactive",
    },
    {
        id: 6,
        firstname: "Ethan",
        lastname: "Garcia",
        image: "https://i.pravatar.cc/150?img=6",
        contractDate: "2023-07-01",
        status: "active",
    },
    {
        id: 7,
        firstname: "Sophia",
        lastname: "Nguyen",
        image: "https://i.pravatar.cc/150?img=7",
        contractDate: "2022-02-18",
        status: "active",
    },
    {
        id: 8,
        firstname: "Mason",
        lastname: "Wilson",
        image: "https://i.pravatar.cc/150?img=8",
        contractDate: "2019-08-30",
        status: "inactive",
    },
    {
        id: 9,
        firstname: "Isabella",
        lastname: "Lopez",
        image: "https://i.pravatar.cc/150?img=9",
        contractDate: "2024-09-02",
        status: "active",
    },
    {
        id: 10,
        firstname: "Lucas",
        lastname: "Davis",
        image: "https://i.pravatar.cc/150?img=10",
        contractDate: "2021-12-10",
        status: "on_leave",
    },
    {
        id: 11,
        firstname: "Mia",
        lastname: "Anderson",
        image: "https://i.pravatar.cc/150?img=11",
        contractDate: "2023-04-22",
        status: "active",
    },
    {
        id: 12,
        firstname: "Logan",
        lastname: "Clark",
        image: "https://i.pravatar.cc/150?img=12",
        contractDate: "2020-05-14",
        status: "inactive",
    },
    {
        id: 13,
        firstname: "Charlotte",
        lastname: "Harris",
        image: "https://i.pravatar.cc/150?img=13",
        contractDate: "2022-10-27",
        status: "active",
    },
    {
        id: 14,
        firstname: "Jackson",
        lastname: "Taylor",
        image: "https://i.pravatar.cc/150?img=14",
        contractDate: "2021-03-03",
        status: "active",
    },
    {
        id: 15,
        firstname: "Amelia",
        lastname: "White",
        image: "https://i.pravatar.cc/150?img=15",
        contractDate: "2018-07-19",
        status: "inactive",
    },
    {
        id: 16,
        firstname: "Aiden",
        lastname: "Hall",
        image: "https://i.pravatar.cc/150?img=16",
        contractDate: "2024-01-08",
        status: "active",
    },
    {
        id: 17,
        firstname: "Harper",
        lastname: "Young",
        image: "https://i.pravatar.cc/150?img=17",
        contractDate: "2022-06-06",
        status: "on_leave",
    },
    {
        id: 18,
        firstname: "Elijah",
        lastname: "King",
        image: "https://i.pravatar.cc/150?img=18",
        contractDate: "2023-10-12",
        status: "active",
    },
    {
        id: 19,
        firstname: "Evelyn",
        lastname: "Wright",
        image: "https://i.pravatar.cc/150?img=19",
        contractDate: "2020-02-29",
        status: "inactive",
    },
    {
        id: 20,
        firstname: "James",
        lastname: "Baker",
        image: "https://i.pravatar.cc/150?img=20",
        contractDate: "2021-09-17",
        status: "active",
    },
];

