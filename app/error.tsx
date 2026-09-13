"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
 return <section role="alert" className="mx-auto max-w-xl px-6 py-20"><h1 className="text-2xl font-semibold">We couldn’t load this page.</h1><p className="my-5 text-slate-300">Please try again. If the problem continues, come back shortly.</p><button onClick={reset} className="btn-primary rounded-xl px-5 py-3">Try again</button></section>;
}
