import { FieldLabel, Field as UiField } from "@ui-sdk/react/field";
import type { ComponentProps } from "react";

import Input from "./Input";

interface FieldProps extends ComponentProps<typeof Input> {
  id: string;
  label: string;
}

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
