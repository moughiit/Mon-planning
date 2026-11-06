import { Pressable, Text, TextInput, type TextInputProps, View } from 'react-native';

/** Libellé + contenu, pour les formulaires. */
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</Text>
      {children}
    </View>
  );
}

/** Champ de saisie avec libellé. */
export function TextField({ label, ...inputProps }: TextInputProps & { label: string }) {
  return (
    <Field label={label}>
      <TextInput
        placeholderTextColor="#A8A29E"
        className="rounded-xl bg-stone-100 px-4 py-3 text-stone-900 dark:bg-zinc-800 dark:text-stone-50"
        {...inputProps}
      />
    </Field>
  );
}

/** Choix parmi des options. `allowNone` permet de désélectionner. */
export function Chips({
  options,
  selected,
  onSelect,
  allowNone = false,
}: {
  options: { id: string; label: string }[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  allowNone?: boolean;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((o) => {
        const active = o.id === selected;
        return (
          <Pressable
            key={o.id}
            onPress={() => onSelect(allowNone && active ? null : o.id)}
            className={`rounded-full px-3 py-2 ${active ? 'bg-stone-900 dark:bg-stone-100' : 'bg-stone-100 dark:bg-zinc-800'}`}
          >
            <Text
              className={`text-sm ${active ? 'font-semibold text-white dark:text-stone-900' : 'text-stone-700 dark:text-stone-200'}`}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Bouton principal pleine largeur. */
export function SubmitButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="items-center rounded-xl bg-stone-900 py-3 disabled:opacity-50 dark:bg-stone-100"
    >
      <Text className="font-semibold text-white dark:text-stone-900">{label}</Text>
    </Pressable>
  );
}
