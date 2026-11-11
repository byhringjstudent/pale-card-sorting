
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Study = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  instructions: string | null;
  thankYouMessage: string | null;
  allowUndo: boolean;
  showProgress: boolean;
  requireAllCardsSorted: boolean;
  randomizeCards: boolean;
  timeLimitMinutes: number | null;
  cards?: Array<{
    id: string;
    label?: string;
    title?: string;
    description?: string | null;
  }>;
};

export default function EditStudyPage() {
  const params = useParams();
  const router = useRouter();
  const studyId = params.studyId as string;

  const [study, setStudy] = useState<Study | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadStudy() {
      try {
        const response = await fetch(
          `/api/studies/${encodeURIComponent(studyId)}`
        );

        if (!response.ok) {
          throw new Error("Unable to load study.");
        }

        const data = await response.json();
        setStudy(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unknown error"
        );
      } finally {
        setLoading(false);
      }
    }

    loadStudy();
  }, [studyId]);

  async function saveStudy() {
    if (!study) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/studies/${encodeURIComponent(studyId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: study.name,
            description: study.description,
            status: study.status,
            settings: {
              instructions: study.instructions,
              thankYouMessage: study.thankYouMessage,
              allowUndo: study.allowUndo,
              showProgress: study.showProgress,
              requireAllCardsSorted:
                study.requireAllCardsSorted,
              randomizeCards: study.randomizeCards,
              timeLimitMinutes: study.timeLimitMinutes,
            },
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Save failed.");
      }

      const updated = await response.json();
      setStudy(updated);
      setSuccess("Study changes saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unknown error"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="p-8">Loading study...</main>;
  }

  if (!study) {
    return <main className="p-8">{error}</main>;
  }

  const fieldClass =
    "w-full rounded-md border p-3 bg-background text-foreground";

  return (
    <main className="mx-auto max-w-4xl p-8 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">
          Edit Study
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your PALE card-sorting study.
        </p>
      </header>

      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}

      {success && (
        <p role="status" className="text-green-600">
          {success}
        </p>
      )}

      <div className="space-y-2">
        <label htmlFor="studyName">Study Name</label>
        <input
          id="studyName"
          className={fieldClass}
          value={study.name}
          onChange={(e) =>
            setStudy({ ...study, name: e.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="description">
          Study Description
        </label>
        <textarea
          id="description"
          className={fieldClass}
          rows={4}
          value={study.description ?? ""}
          onChange={(e) =>
            setStudy({
              ...study,
              description: e.target.value,
            })
          }
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="instructions">
          Participant Instructions
        </label>
        <textarea
          id="instructions"
          className={fieldClass}
          rows={7}
          value={study.instructions ?? ""}
          onChange={(e) =>
            setStudy({
              ...study,
              instructions: e.target.value,
            })
          }
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="thankYou">
          Thank-You Message
        </label>
        <textarea
          id="thankYou"
          className={fieldClass}
          rows={5}
          value={study.thankYouMessage ?? ""}
          onChange={(e) =>
            setStudy({
              ...study,
              thankYouMessage: e.target.value,
            })
          }
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="status">Study Status</label>
        <select
          id="status"
          className={fieldClass}
          value={study.status}
          onChange={(e) =>
            setStudy({
              ...study,
              status: e.target.value,
            })
          }
        >
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      <fieldset className="space-y-3">
        <legend className="font-semibold">
          Sorting Settings
        </legend>

        {(
          [
            ["allowUndo", "Allow participants to undo"],
            ["showProgress", "Show sorting progress"],
            [
              "requireAllCardsSorted",
              "Require all cards to be sorted",
            ],
            ["randomizeCards", "Randomize card order"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex gap-3">
            <input
              type="checkbox"
              checked={study[key]}
              onChange={(e) =>
                setStudy({
                  ...study,
                  [key]: e.target.checked,
                })
              }
            />
            {label}
          </label>
        ))}
      </fieldset>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">
          Existing Feature Cards
        </h2>

        <p className="text-sm text-muted-foreground">
          Cards are displayed for reference. Editing cards
          requires an additional API update.
        </p>

        {study.cards?.map((card) => (
          <div
            key={card.id}
            className="rounded-md border p-3"
          >
            <p className="font-medium">
              {card.label ?? card.title ?? card.id}
            </p>
            <p className="text-sm text-muted-foreground">
              {card.description}
            </p>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={saveStudy}
          disabled={saving || !study.name.trim()}
          className="rounded-md bg-blue-700 px-5 py-3 text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

        <button
          onClick={() =>
            router.push(
              `/admin/studies/${studyId}/results`
            )
          }
          className="rounded-md border px-5 py-3"
        >
          View Clustering Results
        </button>

        <button
          onClick={() => router.push("/admin/studies")}
          className="rounded-md border px-5 py-3"
        >
          Back to Studies
        </button>
      </div>
    </main>
  );
}

