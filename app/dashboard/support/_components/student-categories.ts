import { studentCategories, ticketCategoryOptions } from "@/app/data/support/schemas";

/** Ticket categories a student can pick, with display labels. */
export const studentCategoryOptions = studentCategories.map((value) => ({
  value,
  label: ticketCategoryOptions.find((option) => option.value === value)?.label ?? value,
}));
