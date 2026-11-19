import { FieldLabel, Field as UiField } from "@ui-sdk/react/field";
import type { ComponentProps } from "react";
import Input from "./Input";

interface FieldProps extends ComponentProps<typeof Input> {
  id: string;
  label: string;
}

// A visible label above an input, in the lowercase mono voice.
// ui-sdk's field ties the label (and any later error text) to the input.
export default function Field({ id, label, ...props }: FieldProps) {
  return (
    <UiField className="flex flex-col gap-space-2">
      <FieldLabel htmlFor={id} className="font-mono text-sm text-ink-muted">
        {label}
      </FieldLabel>
      <Input id={id} {...props} />
    </UiField>
  );
}
