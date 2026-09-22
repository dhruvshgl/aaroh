import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <p className="font-serif text-5xl">Aaroh</p>
        <h1 className="mt-3 text-3xl">That page is not on this path.</h1>
        <Link href="/" className="mt-6 inline-block text-primary">
          Back home
        </Link>
      </div>
    </div>
  );
}
