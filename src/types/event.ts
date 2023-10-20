export type Event_type = {
    date: string;
    category: (
        "Despesas" |
        "Renda" |
        "Lazer" |
        "Transporte" |
        "Alimentação" |
        "Investimento");

    title: string;
    value: number;
    createdAt?: Date;
}