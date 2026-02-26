"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogRoot,
  DialogTitle,
  DialogDescription,
  Button,
  Input,
  Select,
} from "@cloudflare/kumo";
import type { Item } from "@/lib/types";

interface ItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: Item | null;
  categories: string[];
  onSave: (data: Omit<Item, "id" | "createdAt">) => void;
  onDelete?: (id: string) => void;
}

const DEFAULT_CATEGORIES = [
  "Electronics",
  "Vehicle",
  "Furniture",
  "Clothing",
  "Kitchen",
  "Sports",
  "Tools",
  "Other",
];

export default function ItemDialog({
  open,
  onOpenChange,
  item,
  categories,
  onSave,
  onDelete,
}: ItemDialogProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [category, setCategory] = useState("");
  const [expectedYears, setExpectedYears] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState("7");
  const [notes, setNotes] = useState("");

  const allCategories = [
    ...new Set([...DEFAULT_CATEGORIES, ...categories]),
  ].sort();

  useEffect(() => {
    if (item) {
      setName(item.name);
      setPrice(String(item.price));
      setPurchaseDate(item.purchaseDate);
      setCategory(item.category);
      setExpectedYears(item.expectedYears ? String(item.expectedYears) : "");
      setDaysPerWeek(String(item.daysPerWeek || 7));
      setNotes(item.notes || "");
    } else {
      setName("");
      setPrice("");
      setPurchaseDate(new Date().toISOString().split("T")[0]);
      setCategory("");
      setExpectedYears("");
      setDaysPerWeek("7");
      setNotes("");
    }
  }, [item, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !purchaseDate) return;
    onSave({
      name,
      price: parseFloat(price),
      purchaseDate,
      category: category || "Other",
      expectedYears: expectedYears ? parseFloat(expectedYears) : null,
      daysPerWeek: Math.min(7, Math.max(0.1, parseFloat(daysPerWeek) || 7)),
      notes,
    });
    onOpenChange(false);
  };

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <Dialog size="base" className="max-h-[90vh] overflow-y-auto">
        <DialogTitle>{item ? "Edit Item" : "Add Item"}</DialogTitle>
        <DialogDescription>
          {item
            ? "Update the details of your item."
            : "Track a new item to see its cost over time."}
        </DialogDescription>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Input
            label="Name"
            required
            placeholder="MacBook Pro"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Price ($)"
              required
              type="number"
              placeholder="999"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <Input
              label="Purchase Date"
              required
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
            />
          </div>
          <Select
            label="Category"
            hideLabel={false}
            placeholder="Select category"
            value={category || undefined}
            onValueChange={(v) => setCategory(v as string)}
          >
            {allCategories.map((c) => (
              <Select.Option key={c} value={c}>
                {c}
              </Select.Option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Expected Years"
              type="number"
              placeholder="5"
              value={expectedYears}
              onChange={(e) => setExpectedYears(e.target.value)}
            />
            <Input
              label="Days/Week"
              type="number"
              placeholder="7"
              value={daysPerWeek}
              onChange={(e) => setDaysPerWeek(e.target.value)}
            />
          </div>
          <Input
            label="Notes"
            placeholder="Optional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex gap-2 pt-2">
            <Button type="submit" variant="primary">
              {item ? "Save Changes" : "Add Item"}
            </Button>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {item && onDelete && (
              <Button
                variant="destructive"
                className="ml-auto"
                onClick={() => {
                  onDelete(item.id);
                  onOpenChange(false);
                }}
              >
                Delete
              </Button>
            )}
          </div>
        </form>
      </Dialog>
    </DialogRoot>
  );
}
