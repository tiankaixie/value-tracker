export interface Item {
  id: string;
  name: string;
  price: number;
  purchaseDate: string;
  category: string;
  expectedYears: number | null;
  daysPerWeek: number;
  notes: string;
  createdAt: string;
}
