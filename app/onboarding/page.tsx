import { generatePath } from "@/app/onboarding/actions";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="font-serif text-2xl text-slate-900">
        Let&apos;s map your path
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Field: <span className="font-medium text-slate-700">Backend Development</span>{" "}
        <span className="text-slate-400">(more fields coming later)</span>
      </p>

      {params.error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {params.error}
        </p>
      )}

      <form action={generatePath} className="mt-6 space-y-5">
        <div>
          <label htmlFor="skillLevel" className="block text-sm font-medium text-slate-700">
            Current skill level
          </label>
          <select
            id="skillLevel"
            name="skillLevel"
            required
            defaultValue="beginner"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div>
          <label htmlFor="weeklyHours" className="block text-sm font-medium text-slate-700">
            Hours per week you can commit
          </label>
          <input
            id="weeklyHours"
            name="weeklyHours"
            type="number"
            min={1}
            max={80}
            defaultValue={5}
            required
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label htmlFor="budgetTotal" className="block text-sm font-medium text-slate-700">
              Total budget
            </label>
            <input
              id="budgetTotal"
              name="budgetTotal"
              type="number"
              min={0}
              defaultValue={50}
              placeholder="e.g. 50"
              required
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
          </div>
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-slate-700">
              Currency
            </label>
            <select
              id="currency"
              name="currency"
              defaultValue="USD"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            >
              <option value="USD">USD</option>
              <option value="INR">INR</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          Generate my path
        </button>
        <p className="text-xs text-slate-400">
          This calls Gemini twice (skeleton, then resource matching) and can
          take 5-10 seconds.
        </p>
      </form>
    </div>
  );
}
