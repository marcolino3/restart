import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useFormContext, FieldValues, Path } from "react-hook-form";

interface RadioOption {
  label: string;
  value: string;
}

interface Props<T extends FieldValues> {
  name: Path<T>; // typischer Feldname, auch verschachtelt
  label: string;
  options: RadioOption[];
  orientation?: "vertical" | "horizontal";
}

export const RadioGroupFormField = <T extends FieldValues>({
  name,
  label,
  options,
  orientation = "vertical",
}: Props<T>) => {
  const { control } = useFormContext<T>();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-3">
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              className={
                orientation === "horizontal"
                  ? "flex flex-row gap-4"
                  : "flex flex-col"
              }
            >
              {options.map((option) => (
                <FormItem
                  key={option.value}
                  className="flex items-center gap-3"
                >
                  <FormControl>
                    <RadioGroupItem value={option.value} />
                  </FormControl>
                  <FormLabel className="font-normal">{option.label}</FormLabel>
                </FormItem>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
