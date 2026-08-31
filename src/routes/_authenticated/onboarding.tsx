import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getMyProfile, saveProfileSetup } from "@/lib/profile";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
});

const ROLES = ["Student", "Researcher", "Professional", "General reader", "Other"];
const FIELDS = [
  "Computer Science",
  "Engineering",
  "Medicine",
  "Law",
  "Business",
  "Humanities",
  "Natural Sciences",
  "Social Sciences",
  "Other",
];
const PURPOSES = [
  "Studying",
  "Research",
  "Writing",
  "Professional work",
  "General reading",
  "Reference",
  "Other",
];
const MATERIALS = [
  "Textbooks",
  "Books",
  "Journal articles",
  "Research papers",
  "Theses",
  "Dissertations",
  "Lecture materials",
  "Reports",
  "Manuals",
  "Essays",
  "Web articles",
  "Other",
];
const TOOLS = [
  "Notion",
  "Obsidian",
  "OneNote",
  "Google Docs",
  "Microsoft Word",
  "Paper notebook",
  "PDF annotations",
  "Other",
];

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`squircle border px-3 py-1.5 text-sm transition-colors ${
        selected
          ? "border-primary bg-accent text-accent-foreground"
          : "border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-[15px] font-medium">{title}</h2>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  );
}

function Onboarding() {
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [field, setField] = useState("");
  const [purpose, setPurpose] = useState("");
  const [materials, setMaterials] = useState<string[]>([]);
  const [tools, setTools] = useState<string[]>([]);

  useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const profile = await getMyProfile();
      if (profile?.onboarding_completed) navigate({ to: "/", replace: true });
      return profile;
    },
  });

  const toggle = (list: string[], set: (v: string[]) => void, value: string) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const save = useMutation({
    mutationFn: () =>
      saveProfileSetup({
        role_type: role,
        field,
        purpose,
        reading_types: materials,
        current_tools: tools,
      }),
    onSuccess: () => navigate({ to: "/", replace: true }),
    onError: (error: Error) => toast.error(error.message),
  });

  const ready = role && field && purpose && materials.length > 0;

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold">A few quick things</h1>
      <p className="mt-2 text-[15px] text-muted-foreground">
        This helps Reeda fit the way you read. You can change it later.
      </p>

      <div className="mt-10 space-y-9">
        <Group title="What best describes you">
          {ROLES.map((r) => (
            <Chip key={r} label={r} selected={role === r} onClick={() => setRole(r)} />
          ))}
        </Group>
        <Group title="What you study or work in">
          {FIELDS.map((f) => (
            <Chip key={f} label={f} selected={field === f} onClick={() => setField(f)} />
          ))}
        </Group>
        <Group title="Why you are using Reeda">
          {PURPOSES.map((p) => (
            <Chip key={p} label={p} selected={purpose === p} onClick={() => setPurpose(p)} />
          ))}
        </Group>
        <Group title="What you usually read">
          {MATERIALS.map((m) => (
            <Chip
              key={m}
              label={m}
              selected={materials.includes(m)}
              onClick={() => toggle(materials, setMaterials, m)}
            />
          ))}
        </Group>
        <Group title="Tools you use today">
          {TOOLS.map((t) => (
            <Chip
              key={t}
              label={t}
              selected={tools.includes(t)}
              onClick={() => toggle(tools, setTools, t)}
            />
          ))}
        </Group>
      </div>

      <div className="mt-12">
        <Button
          className="squircle h-11 px-6"
          disabled={!ready || save.isPending}
          onClick={() => save.mutate()}
        >
          Continue
        </Button>
      </div>
    </main>
  );
}
