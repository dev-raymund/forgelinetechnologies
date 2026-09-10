export default function SectionHead({
  kicker,
  title,
  body,
  center = false,
}: {
  kicker: string;
  title: string;
  body?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "ec-head is-center" : "ec-head"}>
      <span className="ec-kicker">{kicker}</span>
      <h2>{title}</h2>
      {body ? <p>{body}</p> : null}
    </div>
  );
}
