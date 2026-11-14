export const toDateString = (value: Date) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

export const monthRange = (month: string) => {
    const [year, monthNumber] = month.split("-").map(Number);
    const lastDay = new Date(year, monthNumber, 0).getDate();

    return {startDate: `${month}-01`, endDate: `${month}-${String(lastDay).padStart(2, "0")}`};
};

export const addDays = (date: string, days: number) => {
    const [year, month, day] = date.split("-").map(Number);

    return toDateString(new Date(year, month - 1, day + days));
};
